// Checks that the Supabase project in .env.local is reachable and that
// Google sign-in is turned on. Run with: npm run check:supabase
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    "✗ VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing in .env.local",
  );
  process.exit(1);
}

try {
  const res = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
  });
  if (!res.ok) {
    console.error(
      `✗ Supabase answered ${res.status}. Check the URL and the publishable key.`,
    );
    process.exit(1);
  }
  const settings = await res.json();
  console.log(`✓ Connected to ${url}`);
  if (settings.external?.google) {
    console.log("✓ Google sign-in is enabled");
  } else {
    console.error(
      "✗ Google sign-in is not enabled (Authentication -> Providers -> Google)",
    );
    process.exit(1);
  }
} catch (error) {
  console.error(`✗ Could not reach ${url}: ${error.message}`);
  process.exit(1);
}
