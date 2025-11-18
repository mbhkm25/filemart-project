import { supabase } from "../lib/supabaseClient";

export default async function Home() {
  const { data, error } = await supabase.from("profiles").select("*");

  console.log("TEST DATA:", data);
  console.log("TEST ERROR:", error);

  return <div style={{ padding: 20 }}>Supabase Test — Check Console</div>;
}
