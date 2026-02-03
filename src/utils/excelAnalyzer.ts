// Utility to analyze Excel file structure
import * as XLSX from "xlsx";

export interface SheetAnalysis {
  name: string;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, any>[];
}

export interface FileAnalysis {
  sheetCount: number;
  sheets: SheetAnalysis[];
}

export async function analyzeExcelFile(filePath: string): Promise<FileAnalysis> {
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  
  const sheets: SheetAnalysis[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const columns = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];
    
    sheets.push({
      name: sheetName,
      columns,
      rowCount: jsonData.length,
      sampleData: jsonData.slice(0, 5) as Record<string, any>[],
    });
  }
  
  return {
    sheetCount: workbook.SheetNames.length,
    sheets,
  };
}

// For console debugging
export async function logExcelAnalysis(filePath: string): Promise<void> {
  try {
    const analysis = await analyzeExcelFile(filePath);
    console.log("=== EXCEL FILE ANALYSIS ===");
    console.log("File:", filePath);
    console.log("Total Sheets:", analysis.sheetCount);
    
    analysis.sheets.forEach((sheet, idx) => {
      console.log(`\n--- Sheet ${idx + 1}: ${sheet.name} ---`);
      console.log("Columns:", JSON.stringify(sheet.columns, null, 2));
      console.log("Row Count:", sheet.rowCount);
      console.log("Sample Data:", JSON.stringify(sheet.sampleData.slice(0, 2), null, 2));
    });
    
    return;
  } catch (error) {
    console.error("Failed to analyze Excel file:", error);
    throw error;
  }
}
