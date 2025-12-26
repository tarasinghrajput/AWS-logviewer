export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API Key missing on server' });
    }

    try {
        const { logLine } = req.body;

        const prompt = `
            You are a helpful DevOps assistant.
            Explain this specific AWS Lightsail server log entry to a junior developer in simple, non-technical terms.
            
            1. What does it mean?
            2. Is it an error, warning, or normal traffic?
            3. If it's an error, what might be the cause?

            Keep it short (max 3 sentences).

            Log Entry:
            "${logLine}"
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const explanation = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ explanation });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}