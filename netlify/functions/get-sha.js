const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { filePath } = JSON.parse(event.body);
        if (!filePath) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Falta filePath' }) };
        }

        const token = process.env.GITHUB_TOKEN;
        const url = `https://api.github.com/repos/suarezangulo/MERCADO/contents/${filePath}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });

        if (response.status === 404) {
            return { statusCode: 200, body: JSON.stringify({ sha: null }) };
        }
        if (!response.ok) {
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify({ error: errorData }) };
        }
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify({ sha: data.sha }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
