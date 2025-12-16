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

// Format date as YYYY-MM-DD for database
function formatDateForDB(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ============= SMART DETECTION ALGORITHM =============

// 1. Find the Header Row Dynamically
// Searches first 10 rows for "اسم الطبيب"
function findHeaderRow(rows: string[][]): { headerRowIndex: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    
    // Search for "اسم الطبيب" in any column
    const hasDoctorNameHeader = row.some(cell => {
      if (!cell) return false;
      const cellStr = cell.toString().trim();
      return cellStr.includes('اسم الطبيب') || cellStr === 'الطبيب';
    });
    
    if (hasDoctorNameHeader) {
      return { headerRowIndex: i, headers: row.map(c => (c || '').toString()) };
    }
  }
  
  return null;
}

// 2. Map Columns Based on Found Header
interface ColumnMapping {
  doctorNameCol: number;
  centerNameCol: number;
  doctorIdCol: number;
  dateColumns: { index: number; dateStr: string; headerText: string }[];
}

function mapColumnsFromHeader(headers: string[], sheetName: string): ColumnMapping | null {
  let doctorNameCol = -1;
  let centerNameCol = -1;
  let doctorIdCol = -1;
  const dateColumns: { index: number; dateStr: string; headerText: string }[] = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = (headers[i] || '').toString().trim();
    
    // Find doctor name column
    if (header.includes('اسم الطبيب') || header === 'الطبيب') {
      doctorNameCol = i;
      console.log(`  📌 Doctor Name column found at index ${i}: "${header}"`);
    }
    
    // Find center name column
    if (header.includes('اسم المركز') || header === 'المركز') {
      centerNameCol = i;
      console.log(`  📌 Center Name column found at index ${i}: "${header}"`);
    }
    
    // Find doctor ID column
    if (header.includes('الهوية') || header.includes('رقم الهوية')) {
      doctorIdCol = i;
      console.log(`  📌 Doctor ID column found at index ${i}: "${header}"`);
    }
    
    // Find date columns (contain numbers and separators)
    const dateStr = smartParseDateFromHeader(header);
    if (dateStr) {
      dateColumns.push({ index: i, dateStr, headerText: header });
    }
  }
  
  // Must find at least doctor_name column
  if (doctorNameCol === -1) {
    console.log(`  ❌ No "اسم الطبيب" column found`);
    return null;
  }
  
  console.log(`  📅 Found ${dateColumns.length} date columns`);
  if (dateColumns.length > 0) {
    console.log(`  📅 Date samples: ${dateColumns.slice(0, 3).map(d => `"${d.headerText}" → ${d.dateStr}`).join(', ')}`);
  }
  
  return { doctorNameCol, centerNameCol, doctorIdCol, dateColumns };
}

// 3. Smart Date Parsing from Header
// Handles both MM-DD and DD-MM with >12 rule
function smartParseDateFromHeader(header: string): string | null {
  if (!header || typeof header !== 'string') return null;
  
  // Match patterns like: 12-14, 14/12, 12/1, 1-14, etc.
  const datePattern = /(\d{1,2})[-\/](\d{1,2})/;
  const match = header.match(datePattern);
  
  if (!match) return null;
  
  const first = parseInt(match[1]);
  const second = parseInt(match[2]);
  
  let month: number, day: number;
  
  // Rule 1: If first number > 12, it must be Day (DD-MM format)
  if (first > 12) {
    day = first;
    month = second;
  }
  // Rule 2: If second number > 12, it must be Day (MM-DD format)
  else if (second > 12) {
    month = first;
    day = second;
  }
  // Rule 3: Both <= 12, assume Month-Day (MM-DD) as per user preference
  else {
    month = first;
    day = second;
  }
  
  // Validate month and day ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  
  // Determine year based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  let year = currentYear;
  
  // Smart year inference:
  // - If the month is more than 2 months in the past, assume next year
  // - Otherwise, assume current year
  const monthDiff = currentMonth - month;
  if (monthDiff > 2) {
    // e.g., we're in December (12) and see March (3), monthDiff = 9 → next year
    year = currentYear + 1;
  } else if (monthDiff < -9) {
    // e.g., we're in January (1) and see November (11), monthDiff = -10 → current year (not past year)
    // This handles the case where we're at the start of a new year looking at late-year dates
    year = currentYear;
  }
  
  // Validate the date is real (e.g., not Feb 31)
  const testDate = new Date(year, month - 1, day);
  if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
    return null;
  }
  
  return formatDateForDB(year, month, day);
}

// 4. Process Sheet Data with Smart Detection
interface SheetResult {
  schedules: any[];
  skippedRows: number;
  rabwaSkipped: number;
  headerRowIndex: number;
  dateColumnsFound: number;
  status: 'success' | 'no_header' | 'no_columns' | 'no_dates';
}

function processSheetDataSmart(rows: string[][], sheetName: string): SheetResult {
  console.log(`\n📄 Processing sheet: "${sheetName}" (${rows.length} rows)`);
  
  // Step 1: Find header row dynamically
  const headerResult = findHeaderRow(rows);
  
  if (!headerResult) {
    console.log(`  ⚠️ No "اسم الطبيب" found in first 10 rows - SKIPPING`);
    return { 
      schedules: [], 
      skippedRows: rows.length, 
      rabwaSkipped: 0,
      headerRowIndex: -1, 
      dateColumnsFound: 0,
      status: 'no_header'
    };
  }
  
  console.log(`  ✅ Header found at row ${headerResult.headerRowIndex + 1}`);
  console.log(`  📋 Headers: ${JSON.stringify(headerResult.headers.slice(0, 8))}...`);
  
  // Step 2: Map columns from header
  const columnMapping = mapColumnsFromHeader(headerResult.headers, sheetName);
  
  if (!columnMapping) {
    console.log(`  ⚠️ Failed to map columns - SKIPPING`);
    return { 
      schedules: [], 
      skippedRows: rows.length, 
      rabwaSkipped: 0,
      headerRowIndex: headerResult.headerRowIndex, 
      dateColumnsFound: 0,
      status: 'no_columns'
    };
  }
  
  if (columnMapping.dateColumns.length === 0) {
    console.log(`  ⚠️ No date columns found - SKIPPING`);
    return { 
      schedules: [], 
      skippedRows: rows.length, 
      rabwaSkipped: 0,
      headerRowIndex: headerResult.headerRowIndex, 
      dateColumnsFound: 0,
      status: 'no_dates'
    };
  }
  
  // Step 3: Read data starting from row after header
  const schedules: any[] = [];
  let skippedRows = 0;
  let rabwaSkipped = 0;
  
  for (let rowIdx = headerResult.headerRowIndex + 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    
    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
      skippedRows++;
      continue;
    }
    
    // Get doctor name (required)
    const doctorName = (row[columnMapping.doctorNameCol] || '').toString().trim();
    if (!doctorName) {
      skippedRows++;
      continue;
    }
    
    // Get center name (use column if found, otherwise use sheet name)
    let centerName = sheetName;
    if (columnMapping.centerNameCol >= 0) {
      const cellValue = (row[columnMapping.centerNameCol] || '').toString().trim();
      if (cellValue) {
        centerName = cellValue;
      }
    }
    
    // IGNORE rows where center contains "الربوة" (closed)
    if (centerName.includes('الربوة')) {
      rabwaSkipped++;
      continue;
    }
    
    // Get doctor ID (generate if not found)
    let doctorId = '';
    if (columnMapping.doctorIdCol >= 0) {
      doctorId = (row[columnMapping.doctorIdCol] || '').toString().trim();
    }
    if (!doctorId) {
      doctorId = `${centerName}-${doctorName}`.replace(/\s+/g, '-');
    }
    
    // Process each date column
    for (const dateCol of columnMapping.dateColumns) {
      const status = (row[dateCol.index] || '').toString().trim();
      
      schedules.push({
        center_name: centerName,
        doctor_name: doctorName,
        doctor_id: doctorId,
        date: dateCol.dateStr,
        status: status || '',
      });
    }
  }
  
  console.log(`  ✅ Parsed ${schedules.length} entries, skipped ${skippedRows} empty rows, ${rabwaSkipped} الربوة rows`);
  
  return { 
    schedules, 
    skippedRows, 
    rabwaSkipped,
    headerRowIndex: headerResult.headerRowIndex, 
    dateColumnsFound: columnMapping.dateColumns.length,
    status: 'success'
  };
}

// ============= MAIN HANDLER =============

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
    console.log("✅ Successfully obtained access token");

    // Get all sheet names
    console.log("\n📊 Fetching spreadsheet metadata...");
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

    console.log(`📋 Found ${sheetNames.length} sheets: ${sheetNames.join(", ")}`);

    if (sheetNames.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No sheets found in spreadsheet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Process each sheet with smart detection
    console.log("\n🔍 Processing sheets with Smart Detection Algorithm...");
    const allSchedules: any[] = [];
    let totalSkippedRows = 0;
    let totalRabwaSkipped = 0;
    const sheetReports: { name: string; status: string; headerRow: number; dateCols: number; entries: number }[] = [];

    for (const sheetName of sheetNames) {
      const encodedSheetName = encodeURIComponent(sheetName);
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${encodedSheetName}'!A:Z?majorDimension=ROWS`;

      try {
        const sheetsResponse = await fetch(sheetsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!sheetsResponse.ok) {
          console.error(`❌ Failed to fetch sheet "${sheetName}": ${sheetsResponse.status}`);
          sheetReports.push({ name: sheetName, status: 'fetch_error', headerRow: -1, dateCols: 0, entries: 0 });
          continue;
        }

        const sheetsData = await sheetsResponse.json();
        const rows = sheetsData.values || [];
        
        // Process with smart detection
        const result = processSheetDataSmart(rows, sheetName);
        
        allSchedules.push(...result.schedules);
        totalSkippedRows += result.skippedRows;
        totalRabwaSkipped += result.rabwaSkipped;
        
        sheetReports.push({
          name: sheetName,
          status: result.status,
          headerRow: result.headerRowIndex + 1,
          dateCols: result.dateColumnsFound,
          entries: result.schedules.length
        });
        
      } catch (err) {
        console.error(`❌ Error fetching sheet "${sheetName}":`, err);
        sheetReports.push({ name: sheetName, status: 'error', headerRow: -1, dateCols: 0, entries: 0 });
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SYNC SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total schedules: ${allSchedules.length}`);
    console.log(`Skipped rows: ${totalSkippedRows}`);
    console.log(`الربوة skipped: ${totalRabwaSkipped}`);
    console.log("\nSheet-by-sheet report:");
    for (const report of sheetReports) {
      const icon = report.status === 'success' ? '✅' : '⚠️';
      console.log(`  ${icon} ${report.name}: ${report.status}, header row ${report.headerRow}, ${report.dateCols} date cols, ${report.entries} entries`);
    }

    if (allSchedules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No schedule entries to sync",
          syncedCount: 0,
          sheetsProcessed: sheetReports.filter(r => r.status === 'success').length,
          totalSheets: sheetNames.length,
          skippedRows: totalSkippedRows,
          rabwaSkipped: totalRabwaSkipped,
          sheetReports,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate schedules (same center + doctor_id + date = keep last occurrence)
    console.log("\n🔄 Deduplicating schedules...");
    const uniqueSchedules = new Map<string, any>();
    for (const schedule of allSchedules) {
      const key = `${schedule.center_name}|${schedule.doctor_id}|${schedule.date}`;
      uniqueSchedules.set(key, schedule);
    }
    const deduplicatedSchedules = Array.from(uniqueSchedules.values());
    console.log(`  📊 ${allSchedules.length} → ${deduplicatedSchedules.length} (removed ${allSchedules.length - deduplicatedSchedules.length} duplicates)`);

    // Clear existing schedules and insert new ones
    console.log("\n🗑️ Clearing existing schedules...");
    const { error: deleteError } = await supabase.from("schedules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    if (deleteError) {
      console.error("Delete error:", deleteError);
    }

    // Insert all schedules in batches using upsert
    console.log("📥 Inserting new schedules...");
    const batchSize = 500;
    let insertedCount = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < deduplicatedSchedules.length; i += batchSize) {
      const batch = deduplicatedSchedules.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from("schedules")
        .upsert(batch, { onConflict: 'center_name,doctor_id,date' });

      if (insertError) {
        console.error(`Upsert error for batch ${i / batchSize + 1}:`, insertError);
        insertErrors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`\n✅ Successfully synced ${insertedCount} schedules from ${sheetReports.filter(r => r.status === 'success').length} sheets`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${insertedCount} entries from ${sheetReports.filter(r => r.status === 'success').length} sheets`,
        syncedCount: insertedCount,
        sheetsProcessed: sheetReports.filter(r => r.status === 'success').length,
        totalSheets: sheetNames.length,
        skippedRows: totalSkippedRows,
        rabwaSkipped: totalRabwaSkipped,
        sheetReports,
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
