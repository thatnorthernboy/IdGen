/**
 * This is a Netlify serverless function. It acts as a secure proxy to the Gemini API.
 * This version uses the built-in 'https' module to avoid external dependencies and has enhanced error handling.
 */
const https = require('https');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'API key is not set on the server.' }),
        };
    }

    try {
        const { category } = JSON.parse(event.body);
        const prompt = `Generate a single, innovative, and concise project idea within the '${category}' category. The idea should be actionable for a small team.`;

        const payload = JSON.stringify({
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        });

        // Use a promise to handle the https request asynchronously
        const idea = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const result = JSON.parse(data);
                            let ideaText = "Could not generate an idea. Please try again.";
                            if (result.candidates && result.candidates[0]?.content?.parts[0]) {
                                ideaText = result.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
                            }
                            resolve(ideaText);
                        } catch (parseError) {
                            console.error("JSON Parsing Error:", parseError);
                            console.error("Received non-JSON response from Gemini API:", data);
                            reject(new Error('Received an invalid response from the AI service.'));
                        }
                    } else {
                        console.error("Gemini API Error - Status:", res.statusCode);
                        console.error("Gemini API Error - Body:", data);
                        reject(new Error('The AI service returned an error. Check function logs.'));
                    }
                });
            });

            req.on('error', (error) => {
                console.error("Request Error:", error);
                reject(new Error('An internal server error occurred while contacting the AI.'));
            });

            req.write(payload);
            req.end();
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ idea: idea }),
        };

    } catch (error) {
        console.error("Error in serverless function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message || 'An internal server error occurred.' }),
        };
    }
};
