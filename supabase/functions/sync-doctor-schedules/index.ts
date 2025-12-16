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

// Smart date format detection
// Analyzes patterns to determine if format is MM-DD or DD-MM
function detectDateFormat(datePatterns: { first: number; second: number }[]): 'first-is-month' | 'second-is-month' {
  if (datePatterns.length === 0) {
    return 'second-is-month'; // Default: DD-MM (common in Arabic region)
  }

  const currentMonth = new Date().getMonth() + 1; // 12 for December
  
  const firstValues = datePatterns.map(p => p.first);
  const secondValues = datePatterns.map(p => p.second);
  
  const uniqueFirst = new Set(firstValues);
  const uniqueSecond = new Set(secondValues);
  
  console.log(`Date format detection: first values = [${[...uniqueFirst].join(', ')}], second values = [${[...uniqueSecond].join(', ')}]`);
  console.log(`Current month: ${currentMonth}`);
  
  // Rule 1: Constant value is month, changing value is day
  // If first value is constant (e.g., always 12) and second changes (14, 15, 16...)
  if (uniqueFirst.size === 1 && uniqueSecond.size > 1) {
    console.log(`Detected: first value is constant (${[...uniqueFirst][0]}) = month`);
    return 'first-is-month';
  }
  
  // If second value is constant and first changes
  if (uniqueSecond.size === 1 && uniqueFirst.size > 1) {
    console.log(`Detected: second value is constant (${[...uniqueSecond][0]}) = month`);
    return 'second-is-month';
  }
  
  // Rule 2: If one value matches current month consistently
  const firstMatchesCurrent = firstValues.every(v => v === currentMonth);
  const secondMatchesCurrent = secondValues.every(v => v === currentMonth);
  
  if (firstMatchesCurrent && !secondMatchesCurrent) {
    console.log(`Detected: first value matches current month (${currentMonth}) = month`);
    return 'first-is-month';
  }
  if (secondMatchesCurrent && !firstMatchesCurrent) {
    console.log(`Detected: second value matches current month (${currentMonth}) = month`);
    return 'second-is-month';
  }
  
  // Rule 3: If any value > 12, it must be a day
  if (firstValues.some(v => v > 12)) {
    console.log(`Detected: first value has values > 12, so second = month`);
    return 'second-is-month';
  }
  if (secondValues.some(v => v > 12)) {
    console.log(`Detected: second value has values > 12, so first = month`);
    return 'first-is-month';
  }
  
  // Rule 4: Check if values increment (days typically increment in a week)
  const firstSorted = [...firstValues].sort((a, b) => a - b);
  const secondSorted = [...secondValues].sort((a, b) => a - b);
  
  // Check for sequential pattern (days)
  const isFirstSequential = firstSorted.length > 1 && 
    firstSorted.every((v, i) => i === 0 || v - firstSorted[i-1] <= 2);
  const isSecondSequential = secondSorted.length > 1 && 
    secondSorted.every((v, i) => i === 0 || v - secondSorted[i-1] <= 2);
  
  if (isFirstSequential && !isSecondSequential) {
    console.log(`Detected: first values are sequential (days), second = month`);
    return 'second-is-month';
  }
  if (isSecondSequential && !isFirstSequential) {
    console.log(`Detected: second values are sequential (days), first = month`);
    return 'first-is-month';
  }
  
  // Default: assume DD-MM format (common in Arabic region)
  console.log(`No clear pattern detected, defaulting to DD-MM (second = month)`);
  return 'second-is-month';
}

// Extract date patterns from headers
function extractDatePatterns(headers: string[]): { first: number; second: number }[] {
  const patterns: { first: number; second: number }[] = [];
  const datePattern = /(\d{1,2})[-\/](\d{1,2})/;
  
  for (const header of headers) {
    if (!header || typeof header !== 'string') continue;
    const match = header.match(datePattern);
    if (match) {
      patterns.push({
        first: parseInt(match[1]),
        second: parseInt(match[2])
      });
    }
  }
  
  return patterns;
}

// Parse date from header using detected format
function parseDateFromHeader(header: string, format: 'first-is-month' | 'second-is-month'): Date | null {
  if (!header || typeof header !== "string") return null;

  const datePattern = /(\d{1,2})[-\/](\d{1,2})/;
  const match = header.match(datePattern);

  if (!match) return null;

  const first = parseInt(match[1]);
  const second = parseInt(match[2]);
  
  let month: number, day: number;
  
  if (format === 'first-is-month') {
    month = first;
    day = second;
  } else {
    day = first;
    month = second;
  }

  // Validate month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    console.log(`Invalid date values: month=${month}, day=${day} from header "${header}"`);
    return null;
  }

  // Determine year based on current date
  const now = new Date();
  let year = now.getFullYear();

  // If the month is earlier than current month, assume next year
  if (month < now.getMonth() + 1) {
    year++;
  }

  const date = new Date(year, month - 1, day);
  
  // Validate the date is real (e.g., not Feb 31)
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    console.log(`Invalid date: ${year}-${month}-${day}`);
    return null;
  }

  return date;
}

// Format date as YYYY-MM-DD for database
function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Process a single sheet's data
function processSheetData(
  rows: string[][],
  sheetName: string,
  dateFormat: 'first-is-month' | 'second-is-month'
): { schedules: any[]; skippedRows: number; rabwaSkipped: number; invalidDates: number } {
  const schedules: any[] = [];
  let skippedRows = 0;
  let rabwaSkipped = 0;
  let invalidDates = 0;

  if (rows.length < 2) {
    console.log(`Sheet "${sheetName}": no data (less than 2 rows)`);
    return { schedules, skippedRows, rabwaSkipped, invalidDates };
  }

  // Row 1 (index 0) is the header row
  const headers: string[] = rows[0] || [];
  console.log(`Sheet "${sheetName}" headers:`, JSON.stringify(headers.slice(0, 10)));

  // Fixed column positions:
  // Column A (index 0) = center_name (اسم المركز)
  // Column B (index 1) = doctor_name (اسم الطبيب)
  const CENTER_COL = 0;
  const DOCTOR_NAME_COL = 1;

  // Detect date columns dynamically starting from Column C (index 2)
  const dateColumns: { index: number; date: Date; dateStr: string }[] = [];

  for (let colIdx = 2; colIdx < headers.length; colIdx++) {
    const header = headers[colIdx];
    const parsedDate = parseDateFromHeader(header, dateFormat);

    if (parsedDate) {
      dateColumns.push({
        index: colIdx,
        date: parsedDate,
        dateStr: formatDateForDB(parsedDate),
      });
    }
  }

  console.log(`Sheet "${sheetName}": found ${dateColumns.length} date columns using format ${dateFormat}`);
  if (dateColumns.length > 0) {
    console.log(`Sample dates: ${dateColumns.slice(0, 3).map(d => `${headers[d.index]} -> ${d.dateStr}`).join(', ')}`);
  }

  if (dateColumns.length === 0) {
    console.log(`Sheet "${sheetName}": no date columns found, skipping`);
    return { schedules, skippedRows, rabwaSkipped, invalidDates };
  }

  // Parse data rows (starting from Row 2, index 1)
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
      skippedRows++;
      continue;
    }

    // IGNORE rows where center contains "الربوة" (closed)
    if (centerName.includes("الربوة")) {
      rabwaSkipped++;
      continue;
    }

    // Generate doctor_id from center and doctor name
    const doctorId = `${centerName}-${doctorName}`.replace(/\s+/g, "-");

    // Process each date column
    for (const dateCol of dateColumns) {
      const status = (row[dateCol.index] || "").toString().trim();

      // Create schedule entry even for empty status (we'll store empty as "غير محدد")
      schedules.push({
        center_name: centerName,
        doctor_name: doctorName,
        doctor_id: doctorId,
        date: dateCol.dateStr,
        status: status || "",
      });
    }
  }

  console.log(`Sheet "${sheetName}": parsed ${schedules.length} entries, skipped ${skippedRows} rows`);
  return { schedules, skippedRows, rabwaSkipped, invalidDates };
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

    // First, get all sheet names in the spreadsheet
    console.log("Fetching spreadsheet metadata...");
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`;

    const metadataResponse = await fetch(metadataUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error("Google Sheets metadata error:", errorText);
      throw new Error(`Google Sheets API error: ${metadataResponse.status}`);
    }

    const metadataData = await metadataResponse.json();
    const sheetNames: string[] = metadataData.sheets?.map((s: any) => s.properties?.title).filter(Boolean) || [];

    console.log(`Found ${sheetNames.length} sheets:`, sheetNames.join(", "));

    if (sheetNames.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No sheets found in spreadsheet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // First pass: collect all date patterns to detect format
    console.log("Analyzing date patterns across all sheets...");
    const allDatePatterns: { first: number; second: number }[] = [];
    const sheetDataCache: Map<string, string[][]> = new Map();

    for (const sheetName of sheetNames) {
      const encodedSheetName = encodeURIComponent(sheetName);
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${encodedSheetName}'!A:Z?majorDimension=ROWS`;

      try {
        const sheetsResponse = await fetch(sheetsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!sheetsResponse.ok) {
          console.error(`Failed to fetch sheet "${sheetName}": ${sheetsResponse.status}`);
          continue;
        }

        const sheetsData = await sheetsResponse.json();
        const rows = sheetsData.values || [];
        
        if (rows.length >= 2) {
          sheetDataCache.set(sheetName, rows);
          const headers = rows[0] || [];
          const patterns = extractDatePatterns(headers);
          allDatePatterns.push(...patterns);
        }
      } catch (err) {
        console.error(`Error fetching sheet "${sheetName}":`, err);
      }
    }

    // Detect date format from all patterns
    const dateFormat = detectDateFormat(allDatePatterns);
    console.log(`=== DETECTED DATE FORMAT: ${dateFormat} ===`);

    // Second pass: process all sheets with detected format
    const allSchedules: any[] = [];
    let totalSkippedRows = 0;
    let totalRabwaSkipped = 0;
    let totalInvalidDates = 0;
    const processedSheets: string[] = [];

    for (const [sheetName, rows] of sheetDataCache) {
      const result = processSheetData(rows, sheetName, dateFormat);
      allSchedules.push(...result.schedules);
      totalSkippedRows += result.skippedRows;
      totalRabwaSkipped += result.rabwaSkipped;
      totalInvalidDates += result.invalidDates;
      
      if (result.schedules.length > 0) {
        processedSheets.push(sheetName);
      }
    }

    console.log(`Total: parsed ${allSchedules.length} schedule entries from ${processedSheets.length} sheets`);
    console.log(`Total skipped: ${totalSkippedRows} rows (missing data), ${totalRabwaSkipped} rows (الربوة), ${totalInvalidDates} invalid dates`);

    if (allSchedules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No schedule entries to sync",
          syncedCount: 0,
          sheetsProcessed: processedSheets.length,
          totalSheets: sheetNames.length,
          skippedRows: totalSkippedRows,
          rabwaSkipped: totalRabwaSkipped,
          dateFormat,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear existing schedules and insert new ones (full sync)
    console.log("Clearing existing schedules...");
    const { error: deleteError } = await supabase.from("schedules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    if (deleteError) {
      console.error("Delete error:", deleteError);
    }

    // Insert all schedules in batches
    console.log("Inserting new schedules...");
    const batchSize = 500;
    let insertedCount = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < allSchedules.length; i += batchSize) {
      const batch = allSchedules.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from("schedules").insert(batch);

      if (insertError) {
        console.error(`Insert error for batch ${i / batchSize + 1}:`, insertError);
        insertErrors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`Successfully synced ${insertedCount} schedules from ${processedSheets.length} sheets`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${insertedCount} entries from ${processedSheets.length} sheets`,
        syncedCount: insertedCount,
        sheetsProcessed: processedSheets.length,
        totalSheets: sheetNames.length,
        processedSheetNames: processedSheets,
        skippedRows: totalSkippedRows,
        rabwaSkipped: totalRabwaSkipped,
        dateFormat,
        errors: insertErrors.length > 0 ? insertErrors : undefined,
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
