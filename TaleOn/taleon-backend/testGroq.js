// testGroq.js
import "dotenv/config"; // so it can read from your .env

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testGroq() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "Hello! Just say 'Working fine'." }],
      }),
    });

    const data = await res.json();
    console.log("✅ Groq response:", data.choices?.[0]?.message?.content || data);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testGroq();
