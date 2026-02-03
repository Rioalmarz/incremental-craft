import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

interface SheetInfo {
  name: string;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, any>[];
}

const AnalyzeExcel = () => {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeFile = async () => {
      try {
        const response = await fetch("/ray_Khalid_PHC_TBC_Complete_Report_1.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        
        const sheetsInfo: SheetInfo[] = [];
        
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const columns = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];
          
          sheetsInfo.push({
            name: sheetName,
            columns,
            rowCount: jsonData.length,
            sampleData: jsonData.slice(0, 5) as Record<string, any>[],
          });
        }
        
        setSheets(sheetsInfo);
        console.log("=== EXCEL FILE ANALYSIS ===");
        console.log("Total Sheets:", workbook.SheetNames.length);
        sheetsInfo.forEach((sheet, idx) => {
          console.log(`\n--- Sheet ${idx + 1}: ${sheet.name} ---`);
          console.log("Columns:", sheet.columns);
          console.log("Row Count:", sheet.rowCount);
          console.log("Sample Data:", sheet.sampleData);
        });
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    analyzeFile();
  }, []);

  if (loading) return <div className="p-8 text-center">جاري تحليل الملف...</div>;
  if (error) return <div className="p-8 text-center text-red-500">خطأ: {error}</div>;

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold text-primary">تحليل ملف Excel</h1>
      <p className="text-muted-foreground">عدد الصفحات: {sheets.length}</p>
      
      {sheets.map((sheet, idx) => (
        <div key={idx} className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-primary">
            {idx + 1}. {sheet.name} ({sheet.rowCount} صف)
          </h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">الأعمدة ({sheet.columns.length}):</h3>
            <div className="flex flex-wrap gap-2">
              {sheet.columns.map((col, i) => (
                <span key={i} className="px-2 py-1 bg-secondary rounded text-sm">
                  {col}
                </span>
              ))}
            </div>
          </div>
          
          {sheet.sampleData.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">عينة من البيانات:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {sheet.columns.slice(0, 10).map((col, i) => (
                        <th key={i} className="border p-2 bg-muted text-right">{col}</th>
                      ))}
                      {sheet.columns.length > 10 && <th className="border p-2 bg-muted">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.sampleData.slice(0, 3).map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {sheet.columns.slice(0, 10).map((col, colIdx) => (
                          <td key={colIdx} className="border p-2 text-right">
                            {String(row[col] ?? "-").substring(0, 30)}
                          </td>
                        ))}
                        {sheet.columns.length > 10 && <td className="border p-2">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnalyzeExcel;
