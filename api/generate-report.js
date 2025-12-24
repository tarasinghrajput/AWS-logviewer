export default async function handler(req, res) {
    // SECURITY: Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // SECURITY: Get the API Key from Vercel Environment Variables
    // Make sure to add GEMINI_API_KEY in your Vercel Project Settings
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API Key missing' });
    }

    try {
        // Vercel automatically parses the JSON body
        const { accessLogs, errorLogs } = req.body;

        const prompt = `
            You are a Senior Site Reliability Engineer. 
            Analyze the following Web Server Access Logs and Error Logs to create a technical incident report.
            
            **CRITICAL INSTRUCTIONS FOR GENERATION:**
            1. **Be Concise:** Keep descriptions short, direct, and to the point. No fluff.
            2. **Simple Language:** Use plain English. This report is for a non-technical manager. Avoid heavy jargon.
            3. **Strict Structure:** You MUST use the exact headers below.

            STRICTLY follow this reporting template structure:

            # ⚡ Root Cause
            [Explain the primary reason for the issue in 1-2 simple sentences.]

            # 🕒 Summary of the Incident
            * **Date & Time:** [Extract from logs]
            * **What Happened:** [Brief narrative of the event in simple terms]
            * **Impact:** [How did this affect the user? e.g., "Site was down," "Slow loading"]

            # 🔍 Findings From Logs
            [Bullet points only. Cite specific error codes or patterns, explaining them simply.]

            # 📈 CPU Utilisation Evidence
            [Look for "timeout", "maximum execution time", or "connection refused". State clearly if the server was overloaded. Keep it brief.]

            # 🛡️ Actions Taken
            [Bullet points of actions to fix the immediate issue.]

            # 🔮 Next Steps
            [Bullet points of simple preventative measures for the future.]

            # ✅ To Summarise
            [A 2-3 sentence non-technical summary wrapping up the incident for stakeholders.]

            ---
            
            **ACCESS LOGS:**
            ${accessLogs.substring(0, 15000)}

            **ERROR LOGS:**
            ${errorLogs.substring(0, 15000)}
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const markdown = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ markdown });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}