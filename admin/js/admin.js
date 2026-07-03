// ============================================================
// ADMIN.JS - Panel de Administración CINEMARKET
// ============================================================

// ===== VERIFICACIÓN DE SESIÓN =====
(function checkSession() {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const user = JSON.parse(adminUser);
        document.getElementById('adminName').textContent = user.name || user.username;
        document.getElementById('adminUsername').textContent = '@' + user.username;
        const avatar = document.getElementById('adminAvatar');
        const initials = (user.name || user.username).substring(0, 2).toUpperCase();
        avatar.textContent = initials;
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

// ===== VARIABLES GLOBALES =====
let products = [];
let categories = {};
let editingProduct = null;
let uploadedImages = [];

// ===== FUNCIÓN PARA CONVERTIR ACENTOS =====
function toEnglish(n) {
    var t = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "ü": "u", "ñ": "n", "Á": "A", "É": "E", "Í": "I",
        "Ó": "O", "Ú": "U", "Ü": "U", "Ñ": "N"
    };
    return n.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, function(match) {
        return t[match];
    });
}

// ===== FUNCIÓN CORREGIDA: CONVIERTE ACENTOS =====
function ToSlug(n) {
    if (!n) return "";
    var t = n.toLowerCase();
    t = toEnglish(t);  // Convertir acentos ANTES de eliminar caracteres especiales
    t = t.replace(/[^a-z0-9\s-]/g, "");
    t = t.replace(/ /g, "-");
    t = t.replace(/-+/g, "-");
    t = t.replace(/^-+/, "").replace(/-+$/, "");
    return t;
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 5000);
}

// ===== MODAL =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = '';
}

// ===== CARGAR PRODUCTOS =====
async function loadProducts() {
    try {
        const response = await fetch('../data/products-index.json?' + Date.now());
        const data = await response.json();
        categories = data;
        products = [];
        for (const category in data) {
            for (const subcategory in data[category]) {
                for (const product of data[category][subcategory]) {
                    products.push({
                        ...product,
                        category: category,
                        subcategory: subcategory
                    });
                }
            }
        }
        renderProductTable();
        updateStats();
        updateRecentProducts();
        document.getElementById('productCount').textContent = products.length;
    } catch (error) {
        showToast('Error al cargar los productos', 'error');
    }
}

// ===== RENDER TABLA =====
function renderProductTable() {
    const tbody = document.getElementById('productTableBody');
    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px; color: var(--text-muted);">
            <i class="fas fa-film" style="font-size:48px; display:block; margin-bottom:16px; opacity:0.3;"></i>
            No hay títulos en el catálogo. ¡Crea uno ahora!
        </td></tr>`;
        return;
    }
    tbody.innerHTML = products.map((p, index) => {
        const slug = ToSlug(p.Label);
        return `
        <tr>
            <td>
                <img src="../images/products/${slug}-0.webp" 
                     alt="${p.Label}" 
                     class="product-thumb"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2245%22 height=%2265%22><rect fill=%22%23141414%22 width=%2245%22 height=%2265%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22 font-size=%2212%22>?</text></svg>'">
            </td>
            <td><strong>${p.Label}</strong></td>
            <td><span style="color: var(--text-secondary);">${p.category}</span> / ${p.subcategory}</td>
            <td style="color: var(--text-secondary);">${p.Price}</td>
            <td>${p.Stock || 0}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-primary btn-sm" onclick="editProduct(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    const categoriesCount = Object.keys(categories).length;
    document.getElementById('totalCategories').textContent = categoriesCount;
    const totalStock = products.reduce((sum, p) => sum + (p.Stock || 0), 0);
    document.getElementById('totalStock').textContent = totalStock;
}

// ===== ÚLTIMOS PRODUCTOS =====
function updateRecentProducts() {
    const container = document.getElementById('recentProducts');
    const sorted = [...products].sort((a, b) => new Date(b.Update || b.Date) - new Date(a.Update || a.Date));
    const recent = sorted.slice(0, 5);
    if (!recent.length) {
        container.innerHTML = '<span style="color: var(--text-muted);">No hay títulos aún.</span>';
        return;
    }
    container.innerHTML = recent.map(p => {
        const slug = ToSlug(p.Label);
        return `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
            <img src="../images/products/${slug}-0.webp" 
                 style="width:32px; height:45px; object-fit:cover; border-radius:4px; background:rgba(255,255,255,0.03);"
                 onerror="this.style.display='none'">
            <span style="flex:1;">${p.Label}</span>
            <span style="color: var(--text-muted); font-size:13px;">${p.Price}</span>
        </div>
    `}).join('');
}

// ===== ABRIR FORMULARIO =====
function openProductForm(product = null) {
    editingProduct = product;
    uploadedImages = [];
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('imageUpload').value = '';

    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitProductBtn');

    if (product) {
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Título';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar';
        document.getElementById('productLabel').value = product.Label || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productSubcategory').value = product.subcategory || '';
        document.getElementById('productPrice').value = product.Price ? product.Price.replace(' CUP', '') : '';
        document.getElementById('productStock').value = product.Stock || 0;
        document.getElementById('productDescription').value = product.Description || '';
        document.getElementById('productFeatures').value = (product.Features || []).join('\n');
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Título';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Título';
        document.getElementById('productForm').reset();
    }

    populateCategorySelects();
    openModal('productModal');
}

function populateCategorySelects() {
    const catSelect = document.getElementById('productCategory');
    const subSelect = document.getElementById('productSubcategory');
    const currentCat = catSelect.value;
    const currentSub = subSelect.value;

    catSelect.innerHTML = '<option value="">Seleccionar...</option>';
    for (const cat in categories) {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    }
    if (currentCat) catSelect.value = currentCat;

    if (currentCat && categories[currentCat]) {
        subSelect.innerHTML = '<option value="">Seleccionar...</option>';
        for (const sub in categories[currentCat]) {
            subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        }
        if (currentSub) subSelect.value = currentSub;
    } else {
        subSelect.innerHTML = '<option value="">Primero selecciona una categoría</option>';
    }
}

document.getElementById('productCategory').addEventListener('change', function() {
    const subSelect = document.getElementById('productSubcategory');
    const cat = this.value;
    subSelect.innerHTML = '<option value="">Seleccionar...</option>';
    if (cat && categories[cat]) {
        for (const sub in categories[cat]) {
            subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        }
    }
});

// ===== SUBIR IMÁGENES =====
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const files = this.files;
    const container = document.getElementById('imagePreviewContainer');
    
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `
                <img src="${event.target.result}" alt="Vista previa">
                <button class="remove-image" onclick="removeImage(this, '${file.name}')">&times;</button>
            `;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
        uploadedImages.push(file);
    }
});

function removeImage(btn, fileName) {
    const item = btn.closest('.image-preview-item');
    item.remove();
    const index = uploadedImages.findIndex(f => f.name === fileName);
    if (index > -1) uploadedImages.splice(index, 1);
}

// ===== DRAG & DROP =====
const dropArea = document.querySelector('.file-upload-area');
if (dropArea) {
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    dropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        const files = e.dataTransfer.files;
        document.getElementById('imageUpload').files = files;
        document.getElementById('imageUpload').dispatchEvent(new Event('change'));
    });
}

// ===== GUARDAR PRODUCTO =====
async function saveProduct() {
    const label = document.getElementById('productLabel').value.trim();
    const category = document.getElementById('productCategory').value;
    const subcategory = document.getElementById('productSubcategory').value;
    const price = document.getElementById('productPrice').value.trim();
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    const description = document.getElementById('productDescription').value.trim();
    const features = document.getElementById('productFeatures').value
        .split('\n')
        .filter(f => f.trim());

    if (!label || !category || !subcategory || !price) {
        showToast('Completa todos los campos obligatorios.', 'warning');
        return;
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
        showToast('Ingresa un precio válido.', 'warning');
        return;
    }

    const slug = ToSlug(label);
    const now = new Date().toISOString();

    const productData = {
        Category: category,
        SubCategory: subcategory,
        Label: label,
        Images: uploadedImages.length > 0 ? 
            uploadedImages.map((_, i) => `/images/products/${slug}-${i}.webp`) :
            [`/images/products/${slug}-0.webp`],
        Description: description,
        Price: `${parseFloat(price).toFixed(2)} CUP`,
        Stock: stock,
        Features: features,
        Date: editingProduct ? editingProduct.Date : now,
        Update: now
    };

    try {
        const saveResponse = await fetch('../data/save-product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, product: productData })
        });

        if (!saveResponse.ok) {
            const error = await saveResponse.json();
            throw new Error(error.error || 'Error al guardar');
        }

        if (uploadedImages.length > 0) {
            const formData = new FormData();
            uploadedImages.forEach((file, i) => {
                const ext = file.name.split('.').pop();
                formData.append(`images[]`, file, `${slug}-${i}.webp`);
            });
            const uploadResponse = await fetch('../data/upload-images.php', {
                method: 'POST',
                body: formData
            });
            if (!uploadResponse.ok) throw new Error('Error al subir imágenes');
        }

        showToast(`"${label}" guardado exitosamente`, 'success');
        closeModal('productModal');
        await loadProducts();
        showView('products');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== EDITAR PRODUCTO =====
function editProduct(index) {
    const product = products[index];
    openProductForm(product);
}

// ===== ELIMINAR PRODUCTO =====
async function deleteProduct(index) {
    const product = products[index];
    if (!confirm(`¿Eliminar "${product.Label}" definitivamente?`)) return;

    try {
        const response = await fetch('../data/delete-product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: ToSlug(product.Label) })
        });

        if (!response.ok) throw new Error('Error al eliminar');
        showToast(`"${product.Label}" eliminado`, 'success');
        await loadProducts();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== CERRAR SESIÓN =====
function logout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// ===== NAVEGACIÓN =====
function showView(view) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(`view-${view}`).style.display = 'block';
    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar nav a[data-view="${view}"]`);
    if (activeLink) activeLink.classList.add('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    showView('dashboard');

    document.getElementById('createProductBtn').addEventListener('click', () => openProductForm(null));
    document.getElementById('submitProductBtn').addEventListener('click', saveProduct);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
});
