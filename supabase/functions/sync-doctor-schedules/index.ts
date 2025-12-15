import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64URL encode helper
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper function to create JWT for Google Service Account
async function createServiceAccountJWT(serviceAccount: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

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

  // Import the private key
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceAccountJson = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    const sheetId = Deno.env.get("DOCTOR_SCHEDULE_SHEET_ID");

    if (!serviceAccountJson || !sheetId) {
      console.log("Google Sheets credentials not configured, using sample data");
      
      // Return sample data for testing
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const today = new Date();
      const sampleData = [];
      
      // Generate sample data for a week
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        
        sampleData.push(
          { center_name: "الشاطئ", doctor_name: "د. أحمد محمد", doctor_id: "1234567890", date: dateStr, status: i % 2 === 0 ? "كامل اليوم" : "افتراضي" },
          { center_name: "الشاطئ", doctor_name: "د. فاطمة علي", doctor_id: "0987654321", date: dateStr, status: i % 3 === 0 ? "اجازة" : "افتراضي" },
          { center_name: "النهضة", doctor_name: "د. خالد سعيد", doctor_id: "1122334455", date: dateStr, status: i % 2 === 1 ? "مسائي" : "كامل اليوم" },
        );
      }

      const { error } = await supabase
        .from("schedules")
        .upsert(sampleData, { onConflict: "center_name,doctor_id,date" });

      if (error) {
        console.error("Error inserting sample data:", error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Sample data loaded (configure GOOGLE_SHEETS_API_KEY and DOCTOR_SCHEDULE_SHEET_ID for real sync)",
          count: sampleData.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse Service Account JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error("Failed to parse service account JSON:", e);
      throw new Error("Invalid service account JSON format");
    }

    console.log("Service account email:", serviceAccount.client_email);

    // Get access token using service account
    const accessToken = await getAccessToken(serviceAccount);
    console.log("Successfully obtained access token");

    // Fetch data from Google Sheets
    const range = "A:Z"; // Adjust range as needed
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    
    console.log("Fetching data from Google Sheets...");
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    
    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error("Google Sheets API error:", errorText);
      throw new Error(`Google Sheets API error: ${sheetsResponse.status} - ${errorText}`);
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];

    console.log(`Fetched ${rows.length} rows from Google Sheets`);

    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ success: true, message: "No data to sync", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse headers - expecting Arabic headers
    const headers = rows[0];
    console.log("Headers found:", headers);

    // Find column indices based on Arabic headers
    const centerIdx = headers.findIndex((h: string) => 
      h.includes("اسم المركز") || h.includes("المركز")
    );
    const doctorNameIdx = headers.findIndex((h: string) => 
      h.includes("اسم الطبيب") || h.includes("الطبيب")
    );
    const doctorIdIdx = headers.findIndex((h: string) => 
      h.includes("رقم الهوية") || h.includes("الهوية")
    );

    console.log(`Column indices - Center: ${centerIdx}, Doctor Name: ${doctorNameIdx}, Doctor ID: ${doctorIdIdx}`);

    if (centerIdx === -1 || doctorNameIdx === -1 || doctorIdIdx === -1) {
      throw new Error("Required columns not found. Expected: اسم المركز, اسم الطبيب, رقم الهوية");
    }

    // Date columns start after the first 3 columns (A, B, C)
    const dateColumns = headers.slice(3).map((header: string, idx: number) => ({
      index: idx + 3,
      date: header // Assume date is in the header
    }));

    console.log("Date columns:", dateColumns);

    // Parse data rows
    const schedules: any[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const centerName = row[centerIdx]?.trim();
      const doctorName = row[doctorNameIdx]?.trim();
      const doctorId = row[doctorIdIdx]?.toString().trim();

      if (!centerName || !doctorName || !doctorId) {
        console.log(`Skipping row ${i + 1}: missing required data`);
        continue;
      }

      // Process each date column
      for (const dateCol of dateColumns) {
        const status = row[dateCol.index]?.trim();
        if (status) {
          // Try to parse date from header (could be in various formats)
          let dateStr = dateCol.date;
          
          // Handle formats like "2024/01/15", "15/01/2024", "2024-01-15", etc.
          try {
            let parsedDate: Date | null = null;
            
            // Try ISO format first
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              parsedDate = new Date(dateStr);
            }
            // Try yyyy/mm/dd format
            else if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
              parsedDate = new Date(dateStr.replace(/\//g, "-"));
            }
            // Try dd/mm/yyyy format
            else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
              const parts = dateStr.split("/");
              parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            // Try mm/dd/yyyy format
            else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
              const parts = dateStr.split("/");
              parsedDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
            }

            if (parsedDate && !isNaN(parsedDate.getTime())) {
              schedules.push({
                center_name: centerName,
                doctor_name: doctorName,
                doctor_id: doctorId,
                date: parsedDate.toISOString().split("T")[0],
                status: status
              });
            } else {
              console.log(`Could not parse date: ${dateStr}`);
            }
          } catch (e) {
            console.log(`Error parsing date ${dateStr}:`, e);
          }
        }
      }
    }

    console.log(`Parsed ${schedules.length} schedule entries`);

    // Upsert to Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (schedules.length > 0) {
      const { error } = await supabase
        .from("schedules")
        .upsert(schedules, { onConflict: "center_name,doctor_id,date" });

      if (error) {
        console.error("Error upserting schedules:", error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Sync completed successfully",
        count: schedules.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in sync-doctor-schedules:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
