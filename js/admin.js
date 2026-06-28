// ===== PANEL DE ADMINISTRACIÓN (Netlify Functions) =====
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
    if (s.length > 50) s = s.substring(0, 50);
    return s;
}

// ===== LLAMADAS A LAS SERVERLESS FUNCTIONS =====
async function getFileSha(filePath) {
    try {
        const res = await fetch('/.netlify/functions/get-sha', {
            method: 'POST',
            body: JSON.stringify({ filePath })
        });
        const data = await res.json();
        return data.sha;
    } catch (e) {
        console.error('Error get-sha:', e);
        return null;
    }
}

async function saveFileToRepo(filePath, content, message, sha = null) {
    try {
        const res = await fetch('/.netlify/functions/save-product', {
            method: 'POST',
            body: JSON.stringify({ filePath, content, message, sha })
        });
        if (!res.ok) {
            const err = await res.json();
            alert('Error al guardar: ' + JSON.stringify(err));
            return false;
        }
        return true;
    } catch (e) {
        console.error('Error save-file:', e);
        alert('Error de conexión al guardar.');
        return false;
    }
}

async function deleteFileFromRepo(filePath, sha, message) {
    try {
        const res = await fetch('/.netlify/functions/delete-product', {
            method: 'DELETE',
            body: JSON.stringify({ filePath, message, sha })
        });
        if (!res.ok) {
            const err = await res.json();
            alert('Error al eliminar: ' + JSON.stringify(err));
            return false;
        }
        return true;
    } catch (e) {
        console.error('Error delete-file:', e);
        alert('Error de conexión al eliminar.');
        return false;
    }
}

async function updateProductsIndex(product, oldSlug = null) {
    try {
        const res = await fetch('/.netlify/functions/update-index', {
            method: 'POST',
            body: JSON.stringify({ product, oldSlug })
        });
        if (!res.ok) {
            const err = await res.json();
            alert('Error al actualizar índice: ' + JSON.stringify(err));
            return false;
        }
        return true;
    } catch (e) {
        console.error('Error update-index:', e);
        return false;
    }
}

// ===== CARGAR PRODUCTOS =====
function loadAdminProducts() {
    showAdminLoading(true);
    fetch("../data/products-index.json?t=" + new Date().getTime(), { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } })
    .then(r => r.json())
    .then(data => {
        adminProducts = [];
        for (let cat in data) for (let sub in data[cat]) for (let p of data[cat][sub]) { p._category = cat; p._subcategory = sub; adminProducts.push(p); }
        renderAdminTable(); updateStats(); showAdminLoading(false);
    })
    .catch(e => { console.error(e); showAdminLoading(false); alert("Error al cargar productos."); });
}

function updateStats() {
    document.getElementById('stat-total').textContent = adminProducts.length;
    document.getElementById('stat-low').textContent = adminProducts.filter(p => (p.Stock||0) > 0 && (p.Stock||0) < 10).length;
    document.getElementById('stat-out').textContent = adminProducts.filter(p => (p.Stock||0) === 0).length;
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    if (adminProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-box-open"></i><h4>No hay productos</h4><p>Haz clic en "Nuevo Producto".</p></div></td></tr>`;
        return;
    }
    let html = '';
    adminProducts.forEach(p => {
        const slug = ToSlug(p.Label);
        const stock = p.Stock || 0;
        const stockClass = stock === 0 ? 'low' : stock < 10 ? 'medium' : 'high';
        const stockText = stock === 0 ? 'Agotado' : stock;
        const imgSrc = p.Images && p.Images.length > 0 ? p.Images[0] : "./images/products/" + slug + "-0.webp";
        html += `<tr>
            <td><img src="${imgSrc}" alt="${p.Label}" class="product-img" onerror="this.style.display='none'"></td>
            <td class="product-name">${p.Label}</td>
            <td class="product-price">${p.Price || '0.00 CUP'}</td>
            <td><span class="product-stock ${stockClass}">${stockText}</span></td>
            <td>${p.SubCategory || '-'}</td>
            <td><div class="actions">
                <button class="btn-edit" onclick="openEditForm('${slug}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-delete" onclick="deleteProduct('${slug}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </div></td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function exportProducts() {
    if (adminProducts.length === 0) { alert('No hay productos.'); return; }
    let csv = 'Producto,Subcategoría,Precio,Stock,Características\n';
    adminProducts.forEach(p => csv += `"${p.Label}","${p.SubCategory||''}","${p.Price||''}",${p.Stock||0},"${(p.Features||[]).join('; ')}"\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'productos.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
}

// ===== GESTOR DE IMÁGENES =====
window.selectedImages = [];

function renderCurrentImages() {
    const container = document.getElementById('currentImages');
    if (!container) return;
    if (window.selectedImages.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 14px;">No hay imágenes seleccionadas.</span>';
        return;
    }
    container.innerHTML = window.selectedImages.map((img, i) => `
        <div class="image-item">
            <img src="${img}" onerror="this.style.display='none'">
            <button class="remove-btn" onclick="removeImage(${i})">×</button>
        </div>
    `).join('');
}

function addManualImage() {
    const input = document.getElementById('manualImagePath');
    const paths = input.value.split(',').map(s => s.trim()).filter(s => s);
    paths.forEach(path => { if (!window.selectedImages.includes(path)) window.selectedImages.push(path); });
    input.value = '';
    renderCurrentImages();
}

function removeImage(index) {
    window.selectedImages.splice(index, 1);
    renderCurrentImages();
}

function openEditForm(slug) {
    const product = adminProducts.find(p => ToSlug(p.Label) === slug);
    if (!product) return;
    currentProductId = slug; editingProduct = product;
    document.getElementById('edit-category').value = product._category || 'Productos';
    document.getElementById('edit-subcategory').value = product.SubCategory || 'Confituras';
    document.getElementById('edit-label').value = product.Label || '';
    document.getElementById('edit-description').value = product.Description || '';
    document.getElementById('edit-price').value = product.Price || '';
    document.getElementById('edit-stock').value = product.Stock || 0;
    document.getElementById('edit-features').value = (product.Features || []).join('\n');
    window.selectedImages = product.Images ? [...product.Images] : [];
    renderCurrentImages();
    document.getElementById('admin-form').classList.add('active');
    document.getElementById('admin-form-title').textContent = '✏️ Editar Producto';
    document.getElementById('admin-form').scrollIntoView({ behavior: 'smooth' });
}

function openNewProductForm() {
    currentProductId = null; editingProduct = null;
    document.getElementById('edit-category').value = 'Productos';
    document.getElementById('edit-subcategory').value = 'Confituras';
    document.getElementById('edit-label').value = '';
    document.getElementById('edit-description').value = '';
    document.getElementById('edit-price').value = '';
    document.getElementById('edit-stock').value = '0';
    document.getElementById('edit-features').value = '';
    window.selectedImages = [];
    renderCurrentImages();
    document.getElementById('admin-form').classList.add('active');
    document.getElementById('admin-form-title').textContent = '➕ Nuevo Producto';
    document.getElementById('admin-form').scrollIntoView({ behavior: 'smooth' });
}

function closeForm() { document.getElementById('admin-form').classList.remove('active'); }

async function saveProduct() {
    const label = document.getElementById('edit-label').value.trim();
    if (!label) { alert('El nombre es obligatorio.'); return; }
    const price = document.getElementById('edit-price').value.trim();
    if (!price || !/^\d+\.?\d* (CUP|USD)$/.test(price)) { alert('Formato de precio incorrecto.'); return; }
    const category = document.getElementById('edit-category').value.trim() || 'Productos';
    const subcategory = document.getElementById('edit-subcategory').value.trim() || 'Confituras';
    const images = window.selectedImages && window.selectedImages.length > 0 ? window.selectedImages : ['/images/products/' + ToSlug(label) + '-0.webp'];

    const productData = {
        Category: category, SubCategory: subcategory, Label: label,
        Description: document.getElementById('edit-description').value,
        Price: price, Stock: parseInt(document.getElementById('edit-stock').value) || 0,
        Features: document.getElementById('edit-features').value.split('\n').filter(f => f.trim() !== ''),
        Date: new Date().toISOString(), Update: new Date().toISOString(), Images: images
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
        let sha = null;
        if (!isNew) sha = await getFileSha(filePath);
        const success = await saveFileToRepo(filePath, content, 'Guardar ' + label, sha);
        if (!success) { btnSave.innerHTML = originalText; btnSave.disabled = false; return; }

        if (!isNew && currentProductId !== slug) {
            const oldSha = await getFileSha('data/products/' + currentProductId + '.json');
            if (oldSha) await deleteFileFromRepo('data/products/' + currentProductId + '.json', oldSha, 'Eliminar antiguo');
        }

        await updateProductsIndex(productData, (!isNew && currentProductId !== slug) ? currentProductId : null);

        if (isNew) { productData._category = category; productData._subcategory = subcategory; adminProducts.push(productData); }
        else { const idx = adminProducts.findIndex(p => ToSlug(p.Label) === currentProductId); if (idx !== -1) { adminProducts[idx] = productData; adminProducts[idx]._category = category; adminProducts[idx]._subcategory = subcategory; } }

        renderAdminTable(); updateStats(); closeForm();
        btnSave.innerHTML = originalText; btnSave.disabled = false;
        alert(isNew ? '✅ Producto creado.' : '✅ Producto actualizado.');
        loadAdminProducts();
    } catch (e) { console.error(e); btnSave.innerHTML = originalText; btnSave.disabled = false; alert('Error inesperado.'); }
}

async function deleteProduct(slug) {
    if (!confirm('¿Eliminar este producto?')) return;
    const product = adminProducts.find(p => ToSlug(p.Label) === slug);
    if (!product) return;
    const sha = await getFileSha('data/products/' + slug + '.json');
    if (!sha) { alert('No se pudo obtener el archivo.'); return; }
    const success = await deleteFileFromRepo('data/products/' + slug + '.json', sha, 'Eliminar ' + product.Label);
    if (!success) { alert('Error al eliminar.'); return; }
    await updateProductsIndex({ Category: product._category, SubCategory: product._subcategory, Label: product.Label }, slug);
    const idx = adminProducts.findIndex(p => ToSlug(p.Label) === slug);
    if (idx !== -1) adminProducts.splice(idx, 1);
    renderAdminTable(); updateStats();
    alert('🗑️ Producto eliminado.');
    loadAdminProducts();
}

function showAdminLoading(show) { const el = document.getElementById('admin-loading'); if (el) el.classList.toggle('active', show); }

function openAdminPanel() { document.getElementById('admin-panel').classList.add('active'); document.body.style.overflow = 'hidden'; loadAdminProducts(); }
function closeAdminPanel() { document.getElementById('admin-panel').classList.remove('active'); closeForm(); document.body.style.overflow = ''; }

$(document).ready(function() {
    $(document).on('keydown', e => { if (e.key === 'Escape') closeAdminPanel(); });
    $('#admin-panel').on('click', function(e) { if (e.target === this) closeAdminPanel(); });
    renderCurrentImages();
});
