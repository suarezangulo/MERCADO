// ============================================================
// ADMIN.JS - Panel de Administración de CINEMARKET
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
        document.getElementById('adminUsername').textContent = user.username;
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

// ===== VARIABLES GLOBALES =====
let products = [];
let categories = {};
let editingProduct = null;
let currentView = 'dashboard';

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
        <button class="close-toast" onclick="this.parentElement.remove()">&times;</button>
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
        const response = await fetch('../data/products-index.json');
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
    } catch (error) {
        showToast('Error al cargar los productos', 'error');
    }
}

// ===== RENDER TABLA =====
function renderProductTable() {
    const tbody = document.getElementById('productTableBody');
    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color: rgba(255,255,255,0.4);">
            <i class="fas fa-film" style="font-size:40px; display:block; margin-bottom:10px;"></i>
            No hay títulos en el catálogo. ¡Crea uno!
        </td></tr>`;
        return;
    }
    tbody.innerHTML = products.map((p, index) => `
        <tr>
            <td>
                <img src="../images/products/${ToSlug(p.Label)}-0.webp" 
                     alt="${p.Label}" 
                     class="product-thumb"
                     onerror="this.src='https://via.placeholder.com/50x70/1a1a2e/6c7ae0?text=?'">
            </td>
            <td><strong>${p.Label}</strong></td>
            <td>${p.category} / ${p.subcategory}</td>
            <td>${p.Price}</td>
            <td>${p.Stock || 0}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-primary btn-sm" onclick="editProduct(${index})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    const categoriesCount = Object.keys(categories).length;
    document.getElementById('totalCategories').textContent = categoriesCount;
    const totalStock = products.reduce((sum, p) => sum + (p.Stock || 0), 0);
    document.getElementById('totalStock').textContent = totalStock;
}

// ===== ABRIR MODAL DE CREACIÓN/EDICIÓN =====
function openProductForm(product = null) {
    editingProduct = product;
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitProductBtn');

    if (product) {
        title.textContent = 'Editar Título';
        submitBtn.textContent = 'Actualizar Título';
        // Llenar formulario
        document.getElementById('productLabel').value = product.Label || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productSubcategory').value = product.subcategory || '';
        document.getElementById('productPrice').value = product.Price ? product.Price.replace(' CUP', '') : '';
        document.getElementById('productStock').value = product.Stock || 0;
        document.getElementById('productDescription').value = product.Description || '';
        document.getElementById('productFeatures').value = (product.Features || []).join('\n');
    } else {
        title.textContent = 'Crear Nuevo Título';
        submitBtn.textContent = 'Guardar Título';
        document.getElementById('productForm').reset();
    }

    // Cargar categorías en selects
    populateCategorySelects();
    openModal('productModal');
}

function populateCategorySelects() {
    const catSelect = document.getElementById('productCategory');
    const subSelect = document.getElementById('productSubcategory');
    const currentCat = catSelect.value;
    const currentSub = subSelect.value;

    catSelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
    for (const cat in categories) {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    }
    if (currentCat) catSelect.value = currentCat;

    // Cargar subcategorías si hay categoría seleccionada
    if (currentCat && categories[currentCat]) {
        subSelect.innerHTML = '<option value="">Seleccionar subcategoría...</option>';
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
    subSelect.innerHTML = '<option value="">Seleccionar subcategoría...</option>';
    if (cat && categories[cat]) {
        for (const sub in categories[cat]) {
            subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        }
    }
});

// ===== SUBIR IMÁGENES =====
let uploadedImages = [];

document.getElementById('imageUpload').addEventListener('change', function(e) {
    const files = this.files;
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    uploadedImages = [];

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const div = document.createElement('div');
            div.style.cssText = 'position:relative; display:inline-block; margin:5px;';
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.cssText = 'width:100px; height:140px; object-fit:cover; border-radius:8px; border:2px solid rgba(255,255,255,0.1);';
            div.appendChild(img);
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.style.cssText = 'position:absolute; top:-8px; right:-8px; background:#e74c3c; color:#fff; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:16px;';
            removeBtn.onclick = function() {
                div.remove();
                const index = uploadedImages.indexOf(file);
                if (index > -1) uploadedImages.splice(index, 1);
            };
            div.appendChild(removeBtn);
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
        uploadedImages.push(file);
    }
});

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
        showToast('Por favor completa todos los campos obligatorios.', 'warning');
        return;
    }

    const slug = ToSlug(label);

    // Construir objeto del producto
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
        Date: new Date().toISOString(),
        Update: new Date().toISOString()
    };

    try {
        // Guardar archivo individual
        const saveResponse = await fetch('../data/save-product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, product: productData })
        });

        if (!saveResponse.ok) throw new Error('Error al guardar');

        // Subir imágenes
        if (uploadedImages.length > 0) {
            const formData = new FormData();
            uploadedImages.forEach((file, i) => {
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
    } catch (error) {
        showToast('Error al guardar: ' + error.message, 'error');
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
    if (!confirm(`¿Estás seguro de eliminar "${product.Label}"?`)) return;

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
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

// ===== CERRAR SESIÓN =====
function logout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// ===== FUNCIONES UTILITARIAS (copiadas de utils.js) =====
function ToSlug(n) {
    if (!n) return "";
    let t = n.toLowerCase();
    t = t.replace(/[^a-z0-9\s-]/g, "");
    t = t.replace(/ /g, "-");
    t = t.replace(/-+/g, "-");
    t = t.replace(/^-+/, "").replace(/-+$/, "");
    return t;
}

// ===== NAVEGACIÓN =====
function showView(view) {
    currentView = view;
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(`view-${view}`).style.display = 'block';
    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
    document.querySelector(`.sidebar nav a[data-view="${view}"]`)?.classList.add('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    showView('dashboard');

    // Eventos de botones
    document.getElementById('createProductBtn').addEventListener('click', () => openProductForm(null));
    document.getElementById('submitProductBtn').addEventListener('click', saveProduct);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
});
