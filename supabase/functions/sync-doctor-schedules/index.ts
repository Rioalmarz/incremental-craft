import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64URL encode helper
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Create JWT for Google Service Account
async function createServiceAccountJWT(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

// Get access token from Google OAuth
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createServiceAccountJWT(serviceAccount);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OAuth error:", errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Parse date from header like "12-14", "11-30", "14/12", "Sunday 12-14"
function parseDateFromHeader(header: string): Date | null {
  if (!header || typeof header !== "string") return null;

  // Regex to find patterns like 12-14, 11-30, 14/12
  const datePattern = /(\d{1,2})[-\/](\d{1,2})/;
  const match = header.match(datePattern);

  if (!match) return null;

  // User specified: 12-14 means Month 12, Day 14
  const month = parseInt(match[1]);
  const day = parseInt(match[2]);

  // Validate month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Determine year based on current date
  const now = new Date();
  let year = now.getFullYear();

  // If the month is earlier than current month, assume next year
  if (month < now.getMonth() + 1) {
    year++;
  }

  return new Date(year, month - 1, day);
}

// Format date as YYYY-MM-DD for database
function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceAccountJson = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    const sheetId = Deno.env.get("DOCTOR_SCHEDULE_SHEET_ID");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we have Google Sheets credentials
    if (!serviceAccountJson || !sheetId) {
      console.log("Google Sheets credentials not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Google Sheets credentials not configured. Please set GOOGLE_SHEETS_API_KEY and DOCTOR_SCHEDULE_SHEET_ID secrets.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse Service Account JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error("Failed to parse service account JSON:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid service account JSON format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Service account email:", serviceAccount.client_email);

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    console.log("Successfully obtained access token");

    // Fetch data from Google Sheets
    console.log("Fetching data from Google Sheets...");
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?majorDimension=ROWS`;

    const sheetsResponse = await fetch(sheetsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error("Google Sheets API error:", errorText);
      throw new Error(`Google Sheets API error: ${sheetsResponse.status}`);
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];

    console.log(`Fetched ${rows.length} rows from Google Sheets`);

    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "No data found in sheet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Row 1 (index 0) is the header row
    const headers: string[] = rows[0] || [];
    console.log("Headers:", JSON.stringify(headers));

    // Fixed column positions:
    // Column A (index 0) = center_name (اسم المركز)
    // Column B (index 1) = doctor_name (اسم الطبيب)
    const CENTER_COL = 0;
    const DOCTOR_NAME_COL = 1;

    // Detect date columns dynamically starting from Column C (index 2)
    const dateColumns: { index: number; date: Date; dateStr: string }[] = [];

    for (let colIdx = 2; colIdx < headers.length; colIdx++) {
      const header = headers[colIdx];
      const parsedDate = parseDateFromHeader(header);

      if (parsedDate) {
        dateColumns.push({
          index: colIdx,
          date: parsedDate,
          dateStr: formatDateForDB(parsedDate),
        });
        console.log(`Date column at index ${colIdx}: "${header}" -> ${formatDateForDB(parsedDate)}`);
      }
      // If no date pattern, skip (handles empty columns between weeks)
    }

    console.log(`Found ${dateColumns.length} date columns`);

    if (dateColumns.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No date columns found. Expected formats: 12-14, 11-30, Sunday 12-14",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse data rows (starting from Row 2, index 1)
    const schedules: any[] = [];
    let skippedRows = 0;
    let rabwaSkipped = 0;

    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx];
      if (!row || row.length === 0) {
        skippedRows++;
        continue;
      }

      const centerName = (row[CENTER_COL] || "").toString().trim();
      const doctorName = (row[DOCTOR_NAME_COL] || "").toString().trim();

      // Skip if missing required data
      if (!centerName || !doctorName) {
        console.log(`Row ${rowIdx + 1}: missing center or doctor`);
        skippedRows++;
        continue;
      }

      // IGNORE rows where center contains "الربوة" (closed)
      if (centerName.includes("الربوة")) {
        console.log(`Row ${rowIdx + 1}: الربوة (closed)`);
        rabwaSkipped++;
        continue;
      }

      // Generate doctor_id from center and doctor name
      const doctorId = `${centerName}-${doctorName}`.replace(/\s+/g, "-");

      // Process each date column
      for (const dateCol of dateColumns) {
        const status = (row[dateCol.index] || "").toString().trim();

        // Only create schedule entry if there's a status
        if (status && status !== "-") {
          schedules.push({
            center_name: centerName,
            doctor_name: doctorName,
            doctor_id: doctorId,
            date: dateCol.dateStr,
            status: status,
          });
        }
      }
    }

    console.log(`Parsed ${schedules.length} schedule entries`);
    console.log(`Skipped ${skippedRows} rows (missing data), ${rabwaSkipped} rows (الربوة)`);

    if (schedules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No schedule entries to sync",
          syncedCount: 0,
          skippedRows,
          rabwaSkipped,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert schedules to database
    const { error } = await supabase.from("schedules").upsert(schedules, {
      onConflict: "center_name,doctor_id,date",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error("Database error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("Successfully synced schedules");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${schedules.length} entries`,
        syncedCount: schedules.length,
        skippedRows,
        rabwaSkipped,
        dateColumnsFound: dateColumns.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
