import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  const res = await fetch(url); // built-in fetch works
  const json = await res.json();

  console.log("Models your key can access:\n", JSON.stringify(json, null, 2));
}

listModels().catch(console.error);
