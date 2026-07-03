const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ===== CONFIGURACIÓN =====
const CSV_FILE = './data/catalogo.csv';
const OUTPUT_INDEX = './data/products-index.json';
const OUTPUT_DIR = './data/products/';

// ===== FUNCIÓN PARA CREAR SLUG (convertir acentos) =====
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
    
    // Verificar que el archivo CSV existe
    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ No se encuentra el archivo CSV:', CSV_FILE);
        console.log('📌 Creando archivo CSV vacío...');
        // Crear CSV con encabezados
        const headers = 'Category,SubCategory,Label,Price,Stock,Description,Features,Images\n';
        fs.writeFileSync(CSV_FILE, headers, 'utf8');
        console.log('✅ Archivo CSV creado con encabezados. Agrega tus productos.');
        // Crear índice vacío
        fs.writeFileSync(OUTPUT_INDEX, JSON.stringify({}, null, 2), 'utf8');
        return;
    }

    fs.createReadStream(CSV_FILE)
        .pipe(csv({ separator: ',' }))
        .on('data', (data) => results.push(data))
        .on('end', () => {
            console.log(`📄 Leídos ${results.length} registros.`);
            
            // Asegurar que existe la carpeta de salida
            if (!fs.existsSync(OUTPUT_DIR)) {
                fs.mkdirSync(OUTPUT_DIR, { recursive: true });
            }
            
            const index = {};
            
            results.forEach((row, i) => {
                const slug = toSlug(row.Label);
                
                // Procesar imágenes
                let images = [];
                if (row.Images && row.Images.trim()) {
                    images = row.Images.split(';').map(img => img.trim());
                } else {
                    images = [`/images/products/${slug}-0.webp`];
                }
                
                // Procesar características
                let features = [];
                if (row.Features && row.Features.trim()) {
                    features = row.Features.split(';').map(f => f.trim());
                }
                
                // Crear el objeto del producto
                const product = {
                    Category: row.Category.trim(),
                    SubCategory: row.SubCategory.trim(),
                    Label: row.Label.trim(),
                    Images: images,
                    Description: row.Description ? row.Description.replace(/\\n/g, '\n') : '',
                    Price: row.Price.trim(),
                    Stock: parseInt(row.Stock) || 0,
                    Features: features,
                    Date: new Date().toISOString(),
                    Update: new Date().toISOString()
                };
                
                // Guardar archivo individual
                const filePath = path.join(OUTPUT_DIR, `${slug}.json`);
                fs.writeFileSync(filePath, JSON.stringify(product, null, 2), 'utf8');
                console.log(`✅ ${slug}.json creado`);
                
                // Agregar al índice
                if (!index[product.Category]) index[product.Category] = {};
                if (!index[product.Category][product.SubCategory]) index[product.Category][product.SubCategory] = [];
                
                index[product.Category][product.SubCategory].push({
                    Label: product.Label,
                    Price: product.Price,
                    Features: product.Features,
                    Date: product.Date,
                    Update: product.Update
                });
            });
            
            // Guardar índice
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
