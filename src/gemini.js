export async function synthesizeMatrix(day, cumul, rate, activeEvents) {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('GOOGLE_API_KEY');
  if (!apiKey) {
    apiKey = prompt("Enter your Gemini API Key to enable the AI Synthesis Layer:");
    if (apiKey) localStorage.setItem('GEMINI_API_KEY', apiKey);
    else return "API Key required for AI Synthesis Layer. Please provide it to proceed.";
  }

  const promptText = `You are an AI Spatial Intelligence Analyst providing a briefing on the 1994 genocide against the Tutsi in Rwanda.
Current Day: Day ${day} (of 100 days).
Cumulative Lives Lost: ${cumul}.
Current Killing Rate: ${rate} deaths per day.
Active Event Sites Mapped so far: ${activeEvents.length}.

Synthesize the spatial data into a clinical, yet empathetic, intelligence report. Bridge the gap between the "dots on the map" and the human story behind them. Use a severe, intelligence briefing tone combined with deep historical empathy. Keep it to 2-3 short paragraphs.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "API Error");
    return data.candidates[0].content.parts[0].text;
  } catch(e) {
    return "Error generating synthesis: " + e.message;
  }
}
