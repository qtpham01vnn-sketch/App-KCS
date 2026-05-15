import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://namwpwyjwzruaagwfoox.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hbXdwd3lqd3pydWFhZ3dmb294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDE4MzMsImV4cCI6MjA3NTc3NzgzM30.2ySYAtueeFPvuUT6gZSSodhMKrNcwJwbNMyAFOH9ZeI');

async function checkData() {
  const { data, error } = await supabase
    .from('production_logs')
    .select('product_type, kiln_data')
    .ilike('product_type', '%40x80%')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }
  
  data.forEach(l => {
    console.log("Product:", l.product_type);
    console.log("Data:", JSON.stringify(l.kiln_data, null, 1));
  });
}

checkData();
