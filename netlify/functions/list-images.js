const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN no configurado' }) };
        }

        const url = 'https://api.github.com/repos/suarezangulo/MERCADO/contents/images/products';
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify({ error: errorData }) };
        }

        const files = await response.json();
        const images = files
            .filter(file => {
                const name = file.name.toLowerCase();
                return name.endsWith('.webp') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif');
            })
            .map(file => ({
                path: '/images/products/' + file.name,
                name: file.name,
                size: file.size
            }));

        return {
            statusCode: 200,
            body: JSON.stringify({ images })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
