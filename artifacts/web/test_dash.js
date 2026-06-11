// removed
const { createClient } = require("@supabase/supabase-js");

const fs = require('fs');
const path = require('path');

// Parse ../../.env.local
let supabaseUrl = '';
let supabaseKey = '';
try {
  const envContent = fs.readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error('Failed to read root .env.local:', e);
}

if (!supabaseUrl) supabaseUrl = "http://127.0.0.1:54321";
if (!supabaseKey) supabaseKey = "dummy-key";

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== CHECK ORGANIZATIONS ===");
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, clerk_org_id, name");
  console.log("Organizations in DB:", orgs, error);
}

run();
