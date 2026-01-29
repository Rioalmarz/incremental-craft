import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PatientAnalysisRequest {
  patient: {
    name: string;
    age?: number;
    gender?: string;
    has_dm?: boolean;
    has_htn?: boolean;
    has_dyslipidemia?: boolean;
    hba1c?: number;
    ldl?: number;
    systolic_bp?: number;
    diastolic_bp?: number;
    bmi?: number;
    visit_count?: number;
    dm_medications_count?: number;
    htn_medications_count?: number;
    dlp_medications_count?: number;
    priority_level?: string;
    priority_reason?: string;
  };
  analysisType?: 'summary' | 'recommendations' | 'risks' | 'full';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient, analysisType = 'full' } = await req.json() as PatientAnalysisRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build patient context
    const patientContext = buildPatientContext(patient);
    
    // Build analysis prompt based on type
    const systemPrompt = getSystemPrompt(analysisType);
    const userPrompt = buildUserPrompt(patient, analysisType, patientContext);

    console.log("Analyzing patient:", patient.name, "Type:", analysisType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        patientName: patient.name,
        analysisType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI health analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPatientContext(patient: PatientAnalysisRequest['patient']): string {
  const parts: string[] = [];
  
  parts.push(`اسم المريض: ${patient.name}`);
  if (patient.age) parts.push(`العمر: ${patient.age} سنة`);
  if (patient.gender) parts.push(`الجنس: ${patient.gender}`);
  
  // Chronic conditions
  const conditions: string[] = [];
  if (patient.has_dm) conditions.push("السكري");
  if (patient.has_htn) conditions.push("ارتفاع ضغط الدم");
  if (patient.has_dyslipidemia) conditions.push("اضطراب الدهون");
  if (conditions.length > 0) {
    parts.push(`الأمراض المزمنة: ${conditions.join("، ")}`);
  }
  
  // Lab results
  if (patient.hba1c) parts.push(`السكر التراكمي (HbA1c): ${patient.hba1c}%`);
  if (patient.ldl) parts.push(`الكولسترول الضار (LDL): ${patient.ldl} mg/dL`);
  if (patient.systolic_bp && patient.diastolic_bp) {
    parts.push(`ضغط الدم: ${patient.systolic_bp}/${patient.diastolic_bp} mmHg`);
  }
  if (patient.bmi) parts.push(`مؤشر كتلة الجسم (BMI): ${patient.bmi}`);
  
  // Medications
  const meds: string[] = [];
  if (patient.dm_medications_count) meds.push(`أدوية السكري: ${patient.dm_medications_count}`);
  if (patient.htn_medications_count) meds.push(`أدوية الضغط: ${patient.htn_medications_count}`);
  if (patient.dlp_medications_count) meds.push(`أدوية الدهون: ${patient.dlp_medications_count}`);
  if (meds.length > 0) {
    parts.push(`عدد الأدوية: ${meds.join("، ")}`);
  }
  
  // Visits
  if (patient.visit_count) parts.push(`عدد الزيارات: ${patient.visit_count}`);
  
  // Priority
  if (patient.priority_level) {
    parts.push(`تصنيف الأولوية: ${patient.priority_level}`);
    if (patient.priority_reason) parts.push(`سبب الأولوية: ${patient.priority_reason}`);
  }
  
  return parts.join("\n");
}

function getSystemPrompt(analysisType: string): string {
  const basePrompt = `أنت طبيب استشاري متخصص في الرعاية الأولية والأمراض المزمنة في المملكة العربية السعودية.
مهمتك هي تحليل بيانات المرضى وتقديم توصيات طبية شخصية باللغة العربية.
يجب أن تكون إجاباتك:
- مختصرة وواضحة
- مبنية على الأدلة والإرشادات الطبية المعتمدة
- مراعية لسياق الرعاية الأولية في السعودية
- عملية وقابلة للتطبيق`;

  switch (analysisType) {
    case 'summary':
      return `${basePrompt}\n\nقدم ملخصاً موجزاً للحالة الصحية للمريض.`;
    case 'recommendations':
      return `${basePrompt}\n\nقدم توصيات علاجية محددة ومخطط متابعة للمريض.`;
    case 'risks':
      return `${basePrompt}\n\nحدد المخاطر الصحية المحتملة والمضاعفات التي يجب مراقبتها.`;
    default:
      return `${basePrompt}\n\nقدم تحليلاً شاملاً يتضمن: ملخص الحالة، التوصيات، المخاطر، وخطة المتابعة.`;
  }
}

function buildUserPrompt(
  patient: PatientAnalysisRequest['patient'],
  analysisType: string,
  context: string
): string {
  let prompt = `بيانات المريض:\n${context}\n\n`;
  
  switch (analysisType) {
    case 'summary':
      prompt += "الرجاء تقديم ملخص موجز للحالة الصحية الحالية للمريض (3-4 جمل).";
      break;
    case 'recommendations':
      prompt += "الرجاء تقديم توصيات علاجية محددة تشمل:\n1. تعديلات الأدوية المقترحة\n2. الفحوصات المطلوبة\n3. تعديلات نمط الحياة\n4. موعد المتابعة القادم";
      break;
    case 'risks':
      prompt += "الرجاء تحديد:\n1. المخاطر الصحية الرئيسية\n2. المضاعفات المحتملة\n3. العلامات التحذيرية التي يجب مراقبتها";
      break;
    default:
      prompt += `الرجاء تقديم تحليل شامل للحالة يتضمن:

📋 **ملخص الحالة:**
(وصف موجز للحالة الصحية الحالية)

💊 **التوصيات العلاجية:**
(إجراءات محددة وقابلة للتنفيذ)

⚠️ **المخاطر والمضاعفات:**
(المخاطر التي يجب مراقبتها)

📅 **خطة المتابعة:**
(الفحوصات والمواعيد المطلوبة)`;
  }
  
  return prompt;
}
