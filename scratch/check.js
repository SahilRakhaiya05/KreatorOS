const { createClient } = require("@supabase/supabase-js");

const url = "https://baezoomwwsicqfwngvvz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZXpvb213d3NpY3Fmd25ndnZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc3OTY5MSwiZXhwIjoyMDk1MzU1NjkxfQ.y0athzOV-9rHRuVd_n6Tjx3-Ig4pLUKYKktAq5SeltI";

const supabase = createClient(url, key);

async function run() {
  const { data: profiles, error } = await supabase
    .from("creator_profiles")
    .select("*");

  console.log("CREATOR PROFILES IN DATABASE:", profiles);
  if (error) console.error("ERROR FETCHING:", error);

  const { data: workspaces } = await supabase.from("workspaces").select("*");
  console.log("WORKSPACES IN DATABASE:", workspaces);
}

run();
