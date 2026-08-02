const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://fbxuljocaslnjwnjvddk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInJlZiI6ImZieHVsam9jYXNsbmp3bmp2ZGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTIyMDgsImV4cCI6MjA5NzEyODIwOH0.qCLfIwWC-yLrUs3WPXz7QVegDyFWwM2cGbAjpiew8WE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
(async () => {
  try {
    const res = await supabase.from('product_thickness_codes')
      .select('product_thickness_code_id,thickness_code,thickness_name,reference_thickness_mm,is_unspecified,description,is_active,is_deleted,status,sort_order', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('thickness_code', { ascending: true });
    console.log('product_thickness_codes error:', res.error ? res.error.message : null);
    console.log('rowCount:', res.count);
    console.log('rows sample:', JSON.stringify(res.data ? res.data.slice(0, 20) : [], null, 2));
    if (res.data) {
      const summary = res.data.reduce((acc, row) => {
        const key = `${row.status}|${row.is_active}|${row.is_deleted}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      console.log('status summary:', JSON.stringify(summary, null, 2));
    }
    const exists = await supabase.from('information_schema.tables').select('table_name').eq('table_name', 'product_thickness_codes').limit(1);
    console.log('tableExistsErr:', exists.error ? exists.error.message : null);
    console.log('tableExists:', JSON.stringify(exists.data, null, 2));
    const cols = await supabase.from('information_schema.columns')
      .select('column_name,data_type,is_nullable,column_default')
      .eq('table_name', 'product_thickness_codes')
      .order('ordinal_position');
    console.log('colsErr:', cols.error ? cols.error.message : null);
    console.log('cols:', JSON.stringify(cols.data, null, 2));
    const familyCols = await supabase.from('information_schema.columns')
      .select('column_name,data_type')
      .eq('table_name', 'product_code_families')
      .order('ordinal_position');
    console.log('familyColsErr:', familyCols.error ? familyCols.error.message : null);
    console.log('familyCols:', JSON.stringify(familyCols.data, null, 2));
    const familyTypeCols = await supabase.from('information_schema.columns')
      .select('column_name,data_type')
      .eq('table_name', 'product_code_family_types')
      .order('ordinal_position');
    console.log('familyTypeColsErr:', familyTypeCols.error ? familyTypeCols.error.message : null);
    console.log('familyTypeCols:', JSON.stringify(familyTypeCols.data, null, 2));
    const sizeRuleCols = await supabase.from('information_schema.columns')
      .select('column_name,data_type')
      .eq('table_name', 'product_code_size_rules')
      .order('ordinal_position');
    console.log('sizeRuleColsErr:', sizeRuleCols.error ? sizeRuleCols.error.message : null);
    console.log('sizeRuleCols:', JSON.stringify(sizeRuleCols.data, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
