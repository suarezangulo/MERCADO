const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ===== CONFIGURACIÓN =====
const CSV_FILE = './data/catalogo.csv';
const OUTPUT_INDEX = './data/products-index.json';
const OUTPUT_DIR = './data/products/';

// ===== FUNCIÓN PARA CREAR SLUG =====
function toSlug(text) {
    if (!text) return '';
    const map = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ü': 'u', 'ñ': 'n', 'Á': 'A', 'É': 'E', 'Í': 'I',
        'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N'
    };
    let result = text.toLowerCase();
    result = result.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, char => map[char] || char);
    result = result.replace(/[^a-z0-9\s-]/g, '');
    result = result.replace(/\s+/g, '-');
    result = result.replace(/-+/g, '-');
    result = result.replace(/^-+/, '').replace(/-+$/, '');
    return result;
}

// ===== LEER CSV Y GENERAR JSON =====
function generateProducts() {
    const results = [];

    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ No se encuentra el archivo CSV:', CSV_FILE);
        const headers = 'Category,SubCategory,Label,Price,Description,Features,Images,Type,Episodes,PricePerEpisode\n';
        fs.writeFileSync(CSV_FILE, headers, 'utf8');
        console.log('✅ CSV creado con encabezados.');
        fs.writeFileSync(OUTPUT_INDEX, JSON.stringify({}, null, 2), 'utf8');
        return;
    }

    // Leer el archivo con opciones para limpiar encabezados y manejar BOM
    fs.createReadStream(CSV_FILE, { encoding: 'utf8' })
        .pipe(csv({
            separator: ',',
            mapHeaders: ({ header }) => header.trim() // elimina espacios o BOM
        }))
        .on('data', (data) => {
            // Depuración: si la primera fila no tiene Category, muestra las claves
            if (!data.Category) {
                console.error('⚠️ Error: El CSV no tiene columna "Category". Claves detectadas:', Object.keys(data));
                console.error('   Contenido de la primera fila:', JSON.stringify(data, null, 2));
                process.exit(1);
            }
            results.push(data);
        })
        .on('end', () => {
            console.log(`📄 Leídos ${results.length} registros.`);

            if (!fs.existsSync(OUTPUT_DIR)) {
                fs.mkdirSync(OUTPUT_DIR, { recursive: true });
            }

            const index = {};

            results.forEach((row) => {
                const slug = toSlug(row.Label);

                let images = [];
                if (row.Images && row.Images.trim()) {
                    images = row.Images.split(';').map(img => img.trim());
                } else {
                    images = [`/images/products/${slug}-0.webp`];
                }

                let features = [];
                if (row.Features && row.Features.trim()) {
                    features = row.Features.split(';').map(f => f.trim());
                }

                const product = {
                    Category: row.Category.trim(),
                    SubCategory: row.SubCategory.trim(),
                    Label: row.Label.trim(),
                    Images: images,
                    Description: row.Description ? row.Description.replace(/\\n/g, '\n') : '',
                    Price: row.Price.trim(),
                    Features: features,
                    Type: row.Type ? row.Type.trim() : '',
                    Episodes: parseInt(row.Episodes) || 0,
                    PricePerEpisode: row.PricePerEpisode ? row.PricePerEpisode.trim() : '',
                    Date: new Date().toISOString(),
                    Update: new Date().toISOString()
                };

                const filePath = path.join(OUTPUT_DIR, `${slug}.json`);
                fs.writeFileSync(filePath, JSON.stringify(product, null, 2), 'utf8');
                console.log(`✅ ${slug}.json creado`);

                if (!index[product.Category]) index[product.Category] = {};
                if (!index[product.Category][product.SubCategory]) index[product.Category][product.SubCategory] = [];

                index[product.Category][product.SubCategory].push({
                    Label: product.Label,
                    Price: product.Price,
                    Features: product.Features,
                    Type: product.Type,
                    Episodes: product.Episodes,
                    PricePerEpisode: product.PricePerEpisode,
                    Date: product.Date,
                    Update: product.Update
                });
            });

            fs.writeFileSync(OUTPUT_INDEX, JSON.stringify(index, null, 2), 'utf8');
            console.log(`✅ Índice guardado en ${OUTPUT_INDEX}`);
            console.log(`🎉 ¡Proceso completado! Se generaron ${results.length} productos.`);
        })
        .on('error', (error) => {
            console.error('❌ Error al leer CSV:', error);
            process.exit(1);
        });
}

generateProducts();
