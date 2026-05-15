import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
  const { data, error } = await supabase
    .from('production_logs')
    .select('product_type, kiln_data')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
  
  for (let l of data) {
    console.log("Product:", l.product_type);
    console.log("Type of kiln_data:", typeof l.kiln_data);
    if (l.kiln_data) {
      console.log("Is array?", Array.isArray(l.kiln_data));
      console.log("Keys:", Object.keys(l.kiln_data));
      console.log("Type of nhietDo:", typeof l.kiln_data.nhietDo);
      console.log("Is nhietDo array?", Array.isArray(l.kiln_data.nhietDo));
      console.log("Type of filteredModules:", typeof l.kiln_data.filteredModules);
    }
    console.log("-------------");
  }
}

checkData();
