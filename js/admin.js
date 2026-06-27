// ===== PANEL DE ADMINISTRACIÓN =====
// Variables globales
let adminProducts = [];
let editingProduct = null;
let currentProductId = null;

// ===== CARGAR PRODUCTOS =====
function loadAdminProducts() {
    showAdminLoading(true);
    
    $.getJSON("./data/products-index.json", function(data) {
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
    }).fail(function() {
        showAdminLoading(false);
        alert("Error al cargar los productos. Verifica que el archivo products-index.json exista.");
    });
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    const total = adminProducts.length;
    const low = adminProducts.filter(p => p.Stock > 0 && p.Stock < 10).length;
    const out = adminProducts.filter(p => p.Stock === 0).length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-low').textContent = low;
    document.getElementById('stat-out').textContent = out;
}

// ===== RENDERIZAR TABLA =====
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    
    if (adminProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>No hay productos</h4>
                        <p>Haz clic en "Nuevo Producto" para comenzar.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    adminProducts.forEach((product, index) => {
        const slug = ToSlug(product.Label);
        const stock = product.Stock || 0;
        const stockClass = stock === 0 ? 'low' : stock < 10 ? 'medium' : 'high';
        const stockText = stock === 0 ? 'Agotado' : stock;
        let imgSrc = product.Images && product.Images.length > 0 ? product.Images[0] : "./images/products/" + slug + "-0.webp";
        
        html += `
            <tr>
                <td><img src="${imgSrc}" alt="${product.Label}" class="product-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22/%3E'"></td>
                <td class="product-name">${product.Label}</td>
                <td class="product-price">${product.Price || '0.00 CUP'}</td>
                <td><span class="product-stock ${stockClass}">${stockText}</span></td>
                <td>${product.SubCategory || '-'}</td>
                <td>
                    <div class="actions">
                        <button class="btn-edit" onclick="openEditForm('${slug}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${slug}')">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ===== EXPORTAR CSV =====
function exportProducts() {
    if (adminProducts.length === 0) {
        alert('No hay productos para exportar.');
        return;
    }
    
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

// ===== GUARDAR PRODUCTO =====
function saveProduct() {
    const label = document.getElementById('edit-label').value.trim();
    if (!label) {
        alert('El nombre del producto es obligatorio.');
        return;
    }
    
    const price = document.getElementById('edit-price').value.trim();
    if (!price || !/^\d+\.?\d* (CUP|USD)$/.test(price)) {
        alert('El precio debe tener el formato: número + espacio + CUP o USD (ej. 850.00 CUP)');
        return;
    }
    
    const productData = {
        Category: document.getElementById('edit-category').value,
        SubCategory: document.getElementById('edit-subcategory').value,
        Label: label,
        Description: document.getElementById('edit-description').value,
        Price: price,
        Stock: parseInt(document.getElementById('edit-stock').value) || 0,
        Features: document.getElementById('edit-features').value.split('\n').filter(f => f.trim() !== ''),
        Date: new Date().toISOString(),
        Update: new Date().toISOString(),
        Images: ['/images/products/' + ToSlug(label) + '-0.webp']
    };
    
    const btnSave = document.querySelector('.btn-save');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btnSave.disabled = true;
    
    setTimeout(function() {
        if (currentProductId) {
            const index = adminProducts.findIndex(p => ToSlug(p.Label) === currentProductId);
            if (index !== -1) {
                adminProducts[index] = productData;
                adminProducts[index]._category = productData.Category;
                adminProducts[index]._subcategory = productData.SubCategory;
            }
        } else {
            productData._category = productData.Category;
            productData._subcategory = productData.SubCategory;
            adminProducts.push(productData);
        }
        
        renderAdminTable();
        updateStats();
        closeForm();
        
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
        
        alert(currentProductId ? '✅ Producto actualizado correctamente.' : '✅ Producto creado correctamente.');
    }, 1000);
}

// ===== ELIMINAR PRODUCTO =====
function deleteProduct(slug) {
    if (!confirm(`¿Estás seguro de que quieres eliminar este producto?\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    const index = adminProducts.findIndex(p => ToSlug(p.Label) === slug);
    if (index === -1) return;
    
    adminProducts.splice(index, 1);
    renderAdminTable();
    updateStats();
    alert('🗑️ Producto eliminado correctamente.');
}

// ===== MOSTRAR/OCULTAR LOADING =====
function showAdminLoading(show) {
    const loading = document.getElementById('admin-loading');
    if (loading) {
        loading.classList.toggle('active', show);
    }
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
        if (e.key === 'Escape') {
            closeAdminPanel();
        }
    });
    
    $('#admin-panel').on('click', function(e) {
        if (e.target === this) {
            closeAdminPanel();
        }
    });
});
