// ===== PANEL DE ADMINISTRACIÓN =====
// Versión visualizadora + redirección al CMS para acciones de escritura

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

// ===== ABRIR FORMULARIO DE EDICIÓN (redirige al CMS) =====
function openEditForm(slug) {
    const product = adminProducts.find(p => ToSlug(p.Label) === slug);
    if (!product) return;
    currentProductId = slug;
    editingProduct = product;
    
    // Redirigir al CMS en una nueva pestaña
    window.open('/admin/#/collections/productos/entries/' + slug, '_blank');
}

// ===== ABRIR FORMULARIO PARA NUEVO PRODUCTO (redirige al CMS) =====
function openNewProductForm() {
    // Redirigir al CMS en una nueva pestaña
    window.open('/admin/#/collections/productos/new', '_blank');
}

// ===== CERRAR FORMULARIO =====
function closeForm() {
    document.getElementById('admin-form').classList.remove('active');
}

// ===== ELIMINAR PRODUCTO (redirige al CMS) =====
function deleteProduct(slug) {
    if (!confirm(`¿Estás seguro de que quieres eliminar este producto?\nSe abrirá el CMS para que confirmes la eliminación.`)) return;
    // Redirigir al CMS en una nueva pestaña
    window.open('/admin/#/collections/productos/entries/' + slug, '_blank');
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
