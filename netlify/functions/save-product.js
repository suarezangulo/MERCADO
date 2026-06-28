// netlify/functions/save-product.js
// Función serverless para guardar productos en GitHub

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Solo aceptar POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { filePath, content, message, sha } = JSON.parse(event.body);
        const token = process.env.GITHUB_TOKEN; // Token de variable de entorno

        if (!token) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'GITHUB_TOKEN no configurado' })
            };
        }

        const url = `https://api.github.com/repos/suarezangulo/MERCADO/contents/${filePath}`;
        const encodedContent = Buffer.from(content).toString('base64');

        const body = {
            content: encodedContent,
            message: message,
            sha: sha || undefined
        };

        const response = await fetch(url, {
            method: 'PUT',
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

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
