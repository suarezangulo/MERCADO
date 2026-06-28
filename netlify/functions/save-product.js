const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { filePath, content, message, sha } = JSON.parse(event.body);
        if (!filePath || !content || !message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Faltan filePath, content o message' }) };
        }

        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN no configurado en el servidor' }) };
        }

        const url = `https://api.github.com/repos/suarezangulo/MERCADO/contents/${filePath}`;
        const encodedContent = Buffer.from(content).toString('base64');
        const payload = { content: encodedContent, message };
        if (sha) payload.sha = sha;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify({ error: errorData }) };
        }

        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
