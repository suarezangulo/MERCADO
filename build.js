const fs = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, 'data', 'products');
const indexFile = path.join(__dirname, 'data', 'products-index.json');

console.log('📂 Leyendo productos de:', productsDir);

if (!fs.existsSync(productsDir)) {
  console.error('❌ La carpeta data/products no existe.');
  process.exit(1);
}

const files = fs.readdirSync(productsDir);
console.log(`📄 Encontrados ${files.length} archivos en data/products/`);

const index = { Productos: {} };
let processedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.json')) {
    console.log(`⏩ Saltando ${file} (no es .json)`);
    return;
  }

  const filePath = path.join(productsDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const product = JSON.parse(content);

    // Validar campos obligatorios
    if (!product.Category || !product.SubCategory || !product.Label) {
      console.warn(`⚠️ ${file} -> Falta Category, SubCategory o Label.`);
      console.warn(`   Category: ${product.Category}, SubCategory: ${product.SubCategory}, Label: ${product.Label}`);
      return;
    }

    // Normalizar claves (por si tienen tildes o mayúsculas)
    const category = product.Category.trim();
    const subCategory = product.SubCategory.trim();

    if (!index.Productos[category]) {
      index.Productos[category] = {};
    }
    if (!index.Productos[category][subCategory]) {
      index.Productos[category][subCategory] = [];
    }

    const entry = {
      Price: product.Price || '0.00 USD',
      Features: product.Features || [],
      Date: product.Date || new Date().toISOString(),
      Update: product.Update || new Date().toISOString(),
      Label: product.Label
    };

    index.Productos[category][subCategory].push(entry);
    processedCount++;
    console.log(`✅ ${file} -> ${category} / ${subCategory} / ${product.Label}`);
  } catch (error) {
    console.error(`❌ Error al parsear ${file}:`, error.message);
  }
});

// Ordenar por fecha (más reciente primero)
for (const category in index.Productos) {
  for (const subCategory in index.Productos[category]) {
    index.Productos[category][subCategory].sort((a, b) => {
      return new Date(b.Update) - new Date(a.Update);
    });
  }
}

// Escribir el índice
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf8');
console.log(`✅ products-index.json generado con ${processedCount} productos procesados.`);
console.log('📊 Estructura:', JSON.stringify(index, null, 2).substring(0, 200) + '...');
