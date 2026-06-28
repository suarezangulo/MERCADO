// netlify/functions/delete-product.js
// Función serverless para eliminar productos de GitHub

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'DELETE') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { filePath, message, sha } = JSON.parse(event.body);
        const token = process.env.GITHUB_TOKEN;

        if (!token) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'GITHUB_TOKEN no configurado' })
            };
        }

        const url = `https://api.github.com/repos/suarezangulo/MERCADO/contents/${filePath}`;

        const body = {
            message: message,
            sha: sha
        };

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorData })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
