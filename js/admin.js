// ===== PANEL DE ADMINISTRACIÓN =====
// Versión que usa funciones serverless de Netlify

let adminProducts = [];
let editingProduct = null;
let currentProductId = null;

// ===== FUNCIÓN ToSlug LOCAL =====
function ToSlug(str) {
    if (!str) return "";
    let s = str.toLowerCase();
    s = s.replace(/[^a-z0-9\s-]/g, "");
    s = s.replace(/ /g, "-");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-+/, "").replace(/-+$/, "");
    if (s.length > 50) {
        s = s.substring(0, 50);
    }
    return s;
}

// ===== GUARDAR PRODUCTO (usando función serverless) =====
async function saveProduct() {
    const label = document.getElementById('edit-label').value.trim();
    if (!label) { alert('El nombre del producto es obligatorio.'); return; }
    const price = document.getElementById('edit-price').value.trim();
    if (!price || !/^\d+\.?\d* (CUP|USD)$/.test(price)) {
        alert('El precio debe tener el formato: número + espacio + CUP o USD (ej. 850.00 CUP)');
        return;
    }
    const category = document.getElementById('edit-category').value.trim() || 'Productos';
    const subcategory = document.getElementById('edit-subcategory').value.trim() || 'Confituras';

    const images = window.selectedImages && Array.isArray(window.selectedImages) ? window.selectedImages : ['/images/products/' + ToSlug(label) + '-0.webp'];

    const productData = {
        Category: category,
        SubCategory: subcategory,
        Label: label,
        Description: document.getElementById('edit-description').value,
        Price: price,
        Stock: parseInt(document.getElementById('edit-stock').value) || 0,
        Features: document.getElementById('edit-features').value.split('\n').filter(f => f.trim() !== ''),
        Date: new Date().toISOString(),
        Update: new Date().toISOString(),
        Images: images
    };

    const btnSave = document.querySelector('.btn-save');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btnSave.disabled = true;

    try {
        const slug = ToSlug(label);
        const filePath = 'data/products/' + slug + '.json';
        const content = JSON.stringify(productData, null, 2);
        const isNew = !currentProductId;
        const message = isNew ? 'Crear producto: ' + label : 'Actualizar producto: ' + label;

        // Llamar a la función serverless de Netlify
        const response = await fetch('/.netlify/functions/save-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filePath: filePath,
                content: content,
                message: message,
                sha: null // La función serverless obtendrá el SHA automáticamente
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert('Error al guardar: ' + (result.error?.message || 'Error desconocido'));
            btnSave.innerHTML = originalText;
            btnSave.disabled = false;
            return;
        }

        // Actualizar lista en memoria
        if (isNew) {
            productData._category = category;
            productData._subcategory = subcategory;
            adminProducts.push(productData);
        } else {
            const index = adminProducts.findIndex(p => ToSlug(p.Label) === currentProductId);
            if (index !== -1) {
                adminProducts[index] = productData;
                adminProducts[index]._category = category;
                adminProducts[index]._subcategory = subcategory;
            }
        }

        renderAdminTable();
        updateStats();
        closeForm();
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
        alert(isNew ? '✅ Producto creado correctamente.' : '✅ Producto actualizado correctamente.');
        loadAdminProducts(); // Recargar lista
    } catch (error) {
        console.error('❌ Error en saveProduct:', error);
        alert('Error inesperado al guardar. Revisa la consola.');
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

// ===== ELIMINAR PRODUCTO (usando función serverless) =====
async function deleteProduct(slug) {
    if (!confirm(`¿Estás seguro de que quieres eliminar este producto?\nEsta acción no se puede deshacer.`)) return;
    const product = adminProducts.find(p => ToSlug(p.Label) === slug);
    if (!product) return;

    const filePath = 'data/products/' + slug + '.json';

    try {
        // Primero obtener el SHA del archivo (opcional, la función puede obtenerlo)
        const response = await fetch('/.netlify/functions/delete-product', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filePath: filePath,
                message: 'Eliminar producto: ' + product.Label,
                sha: null // La función serverless obtendrá el SHA automáticamente
            })
        });

        const result = await response.json();

        if (!response.ok) {
            alert('Error al eliminar: ' + (result.error?.message || 'Error desconocido'));
            return;
        }

        const index = adminProducts.findIndex(p => ToSlug(p.Label) === slug);
        if (index !== -1) adminProducts.splice(index, 1);
        renderAdminTable();
        updateStats();
        alert('🗑️ Producto eliminado correctamente.');
        loadAdminProducts();
    } catch (error) {
        console.error('❌ Error en deleteProduct:', error);
        alert('Error inesperado al eliminar. Revisa la consola.');
    }
}

// ===== CARGAR PRODUCTOS =====
function loadAdminProducts() {
    showAdminLoading(true);
    console.log("🔍 Cargando products-index.json...");
    
    const url = "../data/products-index.json?t=" + new Date().getTime();
    console.log("📡 URL solicitada:", url);
    
    fetch(url, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
    })
    .then(response => {
        console.log("📡 Respuesta HTTP:", response.status);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("✅ Datos recibidos:", data);
        adminProducts = [];
        for (let category in data) {
            for (let subcategory in data[category]) {
                for (let product of data[category][subcategory]) {
                    product._category = category;
                    product._subcategory = subcategory;
                    adminProducts.push(product);
                }
            }
        }
        renderAdminTable();
        updateStats();
        showAdminLoading(false);
    })
    .catch(error => {
        console.error("❌ Error:", error);
        showAdminLoading(false);
        alert("Error al cargar los productos. Verifica la consola para más detalles.");
    });
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    const total = adminProducts.length;
    const low = adminProducts.filter(p => (p.Stock || 0) > 0 && (p.Stock || 0) < 10).length;
    const out = adminProducts.filter(p => (p.Stock || 0) === 0).length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-low').textContent = low;
    document.getElementById('stat-out').textContent = out;
}

// ===== RENDERIZAR TABLA =====
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    if (adminProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-box-open"></i><h4>No hay productos</h4><p>Haz clic en "Nuevo Producto" para comenzar.</p></div></td></tr>`;
        return;
    }
    let html = '';
    adminProducts.forEach((product) => {
        const slug = ToSlug(product.Label);
        const stock = product.Stock || 0;
        const stockClass = stock === 0 ? 'low' : stock < 10 ? 'medium' : 'high';
        const stockText = stock === 0 ? 'Agotado' : stock;
        let imgSrc = product.Images && product.Images.length > 0 ? product.Images[0] : "./images/products/" + slug + "-0.webp";
        html += `<tr>
            <td><img src="${imgSrc}" alt="${product.Label}" class="product-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22/%3E'"></td>
            <td class="product-name">${product.Label}</td>
            <td class="product-price">${product.Price || '0.00 CUP'}</td>
            <td><span class="product-stock ${stockClass}">${stockText}</span></td>
            <td>${product.SubCategory || '-'}</td>
            <td>
                <div class="actions">
                    <button class="btn-edit" onclick="openEditForm('${slug}')"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-delete" onclick="deleteProduct('${slug}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ===== EXPORTAR CSV =====
function exportProducts() {
    if (adminProducts.length === 0) { alert('No hay productos para exportar.'); return; }
    let csv = 'Producto,Subcategoría,Precio,Stock,Características\n';
    adminProducts.forEach(p => {
        const features = (p.Features || []).join('; ');
        csv += `"${p.Label}","${p.SubCategory || ''}","${p.Price || ''}",${p.Stock || 0},"${features}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'productos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ===== ABRIR FORMULARIO DE EDICIÓN =====
function openEditForm(slug) {
    const product = adminProducts.find(p => ToSlug(p.Label) === slug);
    if (!product) return;
    currentProductId = slug;
    editingProduct = product;
    document.getElementById('edit-category').value = product._category || 'Productos';
    document.getElementById('edit-subcategory').value = product.SubCategory || 'Confituras';
    document.getElementById('edit-label').value = product.Label || '';
    document.getElementById('edit-description').value = product.Description || '';
    document.getElementById('edit-price').value = product.Price || '';
    document.getElementById('edit-stock').value = product.Stock || 0;
    document.getElementById('edit-features').value = (product.Features || []).join('\n');
    document.getElementById('admin-form').classList.add('active');
    document.getElementById('admin-form-title').textContent = '✏️ Editar Producto';
    document.getElementById('admin-form').scrollIntoView({ behavior: 'smooth' });
}

// ===== ABRIR FORMULARIO PARA NUEVO PRODUCTO =====
function openNewProductForm() {
    currentProductId = null;
    editingProduct = null;
    document.getElementById('edit-category').value = 'Productos';
    document.getElementById('edit-subcategory').value = 'Confituras';
    document.getElementById('edit-label').value = '';
    document.getElementById('edit-description').value = '';
    document.getElementById('edit-price').value = '';
    document.getElementById('edit-stock').value = '0';
    document.getElementById('edit-features').value = '';
    document.getElementById('admin-form').classList.add('active');
    document.getElementById('admin-form-title').textContent = '➕ Nuevo Producto';
    document.getElementById('admin-form').scrollIntoView({ behavior: 'smooth' });
}

// ===== CERRAR FORMULARIO =====
function closeForm() {
    document.getElementById('admin-form').classList.remove('active');
}

// ===== MOSTRAR/OCULTAR LOADING =====
function showAdminLoading(show) {
    const loading = document.getElementById('admin-loading');
    if (loading) loading.classList.toggle('active', show);
}

// ===== ABRIR/CERRAR PANEL =====
function openAdminPanel() {
    document.getElementById('admin-panel').classList.add('active');
    document.body.style.overflow = 'hidden';
    loadAdminProducts();
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.remove('active');
    closeForm();
    document.body.style.overflow = '';
}

// ===== INICIALIZAR =====
$(document).ready(function() {
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') closeAdminPanel();
    });
    $('#admin-panel').on('click', function(e) {
        if (e.target === this) closeAdminPanel();
    });
});
