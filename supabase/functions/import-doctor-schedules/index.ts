import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRecord {
  center_name: string;
  doctor_name: string;
  doctor_id: string;
  date: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { records } = await req.json() as { records: ScheduleRecord[] };

    if (!records || !Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'لا توجد بيانات للإدخال' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Received ${records.length} records for import`);

    // Filter out invalid records
    const validRecords = records.filter(r => 
      r.center_name && 
      r.doctor_name && 
      r.date && 
      r.status &&
      !r.center_name.includes('الربوة')
    );

    console.log(`Valid records after filtering: ${validRecords.length}`);

    // Delete existing schedules first
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Delete error:', deleteError);
    }

    // Insert in batches of 500
    const batchSize = 500;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('schedules')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        insertedCount += data?.length || 0;
      }
    }

    // Get unique centers count
    const uniqueCenters = new Set(validRecords.map(r => r.center_name)).size;

    return new Response(
      JSON.stringify({ 
        success: true, 
        insertedCount,
        centersCount: uniqueCenters,
        message: `تم إدخال ${insertedCount} سجل من ${uniqueCenters} مركز`,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
