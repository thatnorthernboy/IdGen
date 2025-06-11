/**
 * This is a Netlify serverless function. It acts as a secure proxy to the Gemini API.
 */
const fetch = require('node-fetch');

exports.handler = async function(event) {
    // We only accept POST requests to this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    // Get the secret API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'API key is not set on the server.' }),
        };
    }

    try {
        // Get the category sent from the frontend
        const { category } = JSON.parse(event.body);
        const prompt = `Generate a single, innovative, and concise project idea within the '${category}' category. The idea should be actionable for a small team.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // Prepare the payload for the Gemini API
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }]
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Gemini API Error:", await response.text());
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: 'Failed to get a response from the AI.' }),
            };
        }

        const result = await response.json();
        
        let ideaText = "Could not generate an idea. Please try again.";
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            ideaText = result.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
        }

        // Send the successful response back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ idea: ideaText }),
        };

    } catch (error) {
        console.error("Error in serverless function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An internal server error occurred.' }),
        };
    }
};
