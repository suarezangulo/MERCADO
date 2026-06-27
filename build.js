const fs = require('fs');
const path = require('path');

// Ruta de la carpeta de productos
const productsDir = path.join(__dirname, 'data', 'products');
// Ruta del archivo de índice
const indexFile = path.join(__dirname, 'data', 'products-index.json');

// Leer todos los archivos de la carpeta
fs.readdir(productsDir, (err, files) => {
  if (err) {
    console.error('Error al leer la carpeta de productos:', err);
    process.exit(1);
  }

  const index = { Productos: {} };

  // Procesar cada archivo
  files.forEach(file => {
    if (!file.endsWith('.json')) return;

    const filePath = path.join(productsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const product = JSON.parse(content);

      // Validar que tenga los campos necesarios
      if (!product.Category || !product.SubCategory || !product.Label) {
        console.warn(`⚠️ El archivo ${file} no tiene Category, SubCategory o Label. Se omite.`);
        return;
      }

      // Crear la estructura en el índice
      const category = product.Category;
      const subCategory = product.SubCategory;

      if (!index.Productos[category]) {
        index.Productos[category] = {};
      }
      if (!index.Productos[category][subCategory]) {
        index.Productos[category][subCategory] = [];
      }

      // Extraer solo los campos que necesitas en el índice
      const entry = {
        Price: product.Price,
        Features: product.Features || [],
        Date: product.Date,
        Update: product.Update,
        Label: product.Label
      };

      index.Productos[category][subCategory].push(entry);
    } catch (error) {
      console.error(`❌ Error al procesar ${file}:`, error);
    }
  });

  // Ordenar productos por fecha (más reciente primero) dentro de cada subcategoría
  for (const category in index.Productos) {
    for (const subCategory in index.Productos[category]) {
      index.Productos[category][subCategory].sort((a, b) => {
        return new Date(b.Update) - new Date(a.Update);
      });
    }
  }

  // Escribir el archivo de índice
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf8');
  console.log('✅ products-index.json generado correctamente.');
});
