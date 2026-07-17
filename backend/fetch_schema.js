import dotenv from "dotenv";
dotenv.config();

async function fetchSchema() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`;
  const headers = {
    "apikey": process.env.SUPABASE_KEY,
    "Authorization": `Bearer ${process.env.SUPABASE_KEY}`
  };

  try {
    const res = await fetch(url, { headers });
    const schema = await res.json();
    console.log("Tables and RPCs available in schema:");
    if (schema.paths) {
      console.log(Object.keys(schema.paths));
    } else {
      console.log(schema);
    }
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}

fetchSchema();
