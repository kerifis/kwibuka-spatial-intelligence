export default function handler(req, res) {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || '';
  if (!apiKey) {
    res.status(503).json({ error: 'GEMINI_API_KEY environment variable is not set' });
    return;
  }
  res.status(200).json({ ready: true, key: apiKey });
}
