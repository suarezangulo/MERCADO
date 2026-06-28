const fetch = require('node-fetch');

function ToSlug(str) {
    if (!str) return "";
    let s = str.toLowerCase();
    s = s.replace(/[^a-z0-9\s-]/g, "");
    s = s.replace(/ /g, "-");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-+/, "").replace(/-+$/, "");
    if (s.length > 50) s = s.substring(0, 50);
    return s;
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { product, oldSlug } = JSON.parse(event.body);
        if (!product || !product.Category || !product.SubCategory || !product.Label) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Producto incompleto' }) };
        }

        const token = process.env.GITHUB_TOKEN;
        const indexPath = 'data/products-index.json';
        const url = `https://api.github.com/repos/suarezangulo/MERCADO/contents/${indexPath}`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) {
            return { statusCode: 500, body: JSON.stringify({ error: 'No se pudo obtener el índice' }) };
        }
        const data = await res.json();
        const indexSha = data.sha;
        let indexContent = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));

        if (oldSlug) {
            for (let cat in indexContent) {
                for (let sub in indexContent[cat]) {
                    indexContent[cat][sub] = indexContent[cat][sub].filter(p => ToSlug(p.Label) !== oldSlug);
                    if (indexContent[cat][sub].length === 0) delete indexContent[cat][sub];
                }
                if (Object.keys(indexContent[cat]).length === 0) delete indexContent[cat];
            }
        }

        if (!indexContent[product.Category]) indexContent[product.Category] = {};
        if (!indexContent[product.Category][product.SubCategory]) indexContent[product.Category][product.SubCategory] = [];
        const list = indexContent[product.Category][product.SubCategory];
        const existing = list.findIndex(p => p.Label === product.Label);
        if (existing !== -1) list[existing] = product;
        else list.push(product);

        const updatedContent = JSON.stringify(indexContent, null, 2);
        const encodedContent = Buffer.from(updatedContent).toString('base64');
        const putUrl = `https://api.github.com/repos/suarezangulo/MERCADO/contents/${indexPath}`;
        const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ content: encodedContent, message: 'Actualizar índice de productos', sha: indexSha })
        });
        if (!putRes.ok) {
            const err = await putRes.json();
            return { statusCode: putRes.status, body: JSON.stringify({ error: err }) };
        }
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
