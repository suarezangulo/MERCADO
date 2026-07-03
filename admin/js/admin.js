// ============================================================
// ADMIN.JS - Panel de administración con GitHub API (UTF-8 corregido)
// ============================================================

// ===== VERIFICACIÓN DE SESIÓN Y TOKEN =====
(function checkSession() {
    const adminUser = sessionStorage.getItem('adminUser');
    const githubToken = sessionStorage.getItem('githubToken');
    if (!adminUser || !githubToken) {
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

// ===== OBTENER TOKEN =====
function getGitHubToken() {
    return sessionStorage.getItem('githubToken');
}

// ===== CONFIGURACIÓN DE GITHUB =====
const REPO_OWNER = 'suarezangulo';
const REPO_NAME = 'MERCADO';
const CSV_PATH = 'data/catalogo.csv';

// ===== VARIABLES GLOBALES =====
let products = [];
let editingProduct = null;
let uploadedImages = [];

// ===== FUNCIONES DE GITHUB API (con soporte UTF-8) =====

// Obtener el contenido actual del CSV (con soporte UTF-8)
async function fetchCSV() {
    const token = getGitHubToken();
    if (!token) throw new Error('Token no disponible');
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CSV_PATH}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (!response.ok) throw new Error('Error al obtener CSV');
    const data = await response.json();
    
    // Decodificar correctamente UTF-8 desde Base64
    const binaryString = atob(data.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder('utf-8').decode(bytes);
    
    return { content, sha: data.sha };
}

// Actualizar el CSV en GitHub (con codificación UTF-8)
async function updateCSV(csvContent) {
    const token = getGitHubToken();
    if (!token) throw new Error('Token no disponible');
    const { sha } = await fetchCSV();
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CSV_PATH}`;
    
    // Codificar a Base64 con UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(csvContent);
    const base64 = btoa(String.fromCharCode(...data));
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: 'Actualizar catálogo desde panel de administración',
            content: base64,
            sha: sha
        })
    });
    if (!response.ok) throw new Error('Error al actualizar CSV');
    return await response.json();
}

// Subir imagen a GitHub
async function uploadImage(file, slug, index) {
    const token = getGitHubToken();
    if (!token) throw new Error('Token no disponible');
    const fileName = `${slug}-${index}.webp`;
    const path = `images/products/${fileName}`;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
    // Leer archivo y convertirlo a base64
    const reader = new FileReader();
    const fileData = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: `Subir imagen: ${fileName}`,
            content: fileData
        })
    });
    if (!response.ok) throw new Error(`Error al subir imagen ${fileName}`);
    return await response.json();
}

// ===== CARGAR PRODUCTOS DESDE EL CSV =====
async function loadProducts() {
    try {
        const { content } = await fetchCSV();
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            products = [];
            renderProductTable();
            updateStats();
            updateRecentProducts();
            document.getElementById('productCount').textContent = 0;
            return;
        }
        const headers = lines[0].split(',').map(h => h.trim());
        products = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index] || '';
            });
            products.push(product);
        }
        renderProductTable();
        updateStats();
        updateRecentProducts();
        document.getElementById('productCount').textContent = products.length;
    } catch (error) {
        showToast('Error al cargar productos: ' + error.message, 'error');
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
            <td><span style="color: var(--text-secondary);">${p.Category}</span> / ${p.SubCategory}</td>
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
    const categories = new Set(products.map(p => p.Category));
    document.getElementById('totalCategories').textContent = categories.size;
    const totalStock = products.reduce((sum, p) => sum + (parseInt(p.Stock) || 0), 0);
    document.getElementById('totalStock').textContent = totalStock;
}

// ===== ÚLTIMOS PRODUCTOS =====
function updateRecentProducts() {
    const container = document.getElementById('recentProducts');
    const recent = products.slice(0, 5);
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
        document.getElementById('productCategory').value = product.Category || '';
        document.getElementById('productSubcategory').value = product.SubCategory || '';
        document.getElementById('productPrice').value = product.Price ? product.Price.replace(' CUP', '') : '';
        document.getElementById('productStock').value = product.Stock || 0;
        document.getElementById('productDescription').value = product.Description || '';
        document.getElementById('productFeatures').value = (product.Features || '').split(';').join('\n');
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

    const categories = [...new Set(products.map(p => p.Category))];
    catSelect.innerHTML = '<option value="">Seleccionar...</option>';
    categories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    if (currentCat) catSelect.value = currentCat;

    if (currentCat) {
        const subs = [...new Set(products.filter(p => p.Category === currentCat).map(p => p.SubCategory))];
        subSelect.innerHTML = '<option value="">Seleccionar...</option>';
        subs.forEach(sub => {
            subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
        if (currentSub) subSelect.value = currentSub;
    } else {
        subSelect.innerHTML = '<option value="">Primero selecciona una categoría</option>';
    }
}

document.getElementById('productCategory').addEventListener('change', function() {
    const subSelect = document.getElementById('productSubcategory');
    const cat = this.value;
    if (cat) {
        const subs = [...new Set(products.filter(p => p.Category === cat).map(p => p.SubCategory))];
        subSelect.innerHTML = '<option value="">Seleccionar...</option>';
        subs.forEach(sub => {
            subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
    } else {
        subSelect.innerHTML = '<option value="">Primero selecciona una categoría</option>';
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
        .filter(f => f.trim())
        .join(';');

    if (!label || !category || !subcategory || !price) {
        showToast('Completa todos los campos obligatorios.', 'warning');
        return;
    }

    const slug = ToSlug(label);

    // Subir imágenes a GitHub
    try {
        for (let i = 0; i < uploadedImages.length; i++) {
            await uploadImage(uploadedImages[i], slug, i);
        }
    } catch (error) {
        showToast('Error al subir imágenes: ' + error.message, 'error');
        return;
    }

    // Construir la línea del CSV
    const imagesNames = uploadedImages.length > 0 ? 
        uploadedImages.map((_, i) => `${slug}-${i}.webp`).join(';') :
        `${slug}-0.webp`;
    const csvRow = [
        category,
        subcategory,
        label,
        `${parseFloat(price).toFixed(2)} CUP`,
        stock,
        description,
        features,
        imagesNames
    ].join(',');

    // Leer CSV actual
    try {
        const { content } = await fetchCSV();
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0];
        let bodyLines = lines.slice(1);

        if (editingProduct) {
            const index = bodyLines.findIndex(line => line.includes(editingProduct.Label));
            if (index > -1) {
                bodyLines[index] = csvRow;
            } else {
                bodyLines.push(csvRow);
            }
        } else {
            bodyLines.push(csvRow);
        }

        const newCSV = [headers, ...bodyLines].join('\n');
        await updateCSV(newCSV);
        showToast(`"${label}" guardado exitosamente`, 'success');
        closeModal('productModal');
        await loadProducts();
        showView('products');
    } catch (error) {
        showToast('Error al guardar: ' + error.message, 'error');
    }
}

// ===== ELIMINAR PRODUCTO =====
async function deleteProduct(index) {
    const product = products[index];
    if (!confirm(`¿Eliminar "${product.Label}" definitivamente?`)) return;

    try {
        const { content } = await fetchCSV();
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0];
        let bodyLines = lines.slice(1);

        bodyLines = bodyLines.filter(line => !line.includes(product.Label));
        const newCSV = [headers, ...bodyLines].join('\n');
        await updateCSV(newCSV);
        showToast(`"${product.Label}" eliminado`, 'success');
        await loadProducts();
    } catch (error) {
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

// ===== FUNCIONES UTILITARIAS =====
function ToSlug(n) {
    if (!n) return "";
    const map = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ü': 'u', 'ñ': 'n', 'Á': 'A', 'É': 'E', 'Í': 'I',
        'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N'
    };
    let t = n.toLowerCase();
    t = t.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, char => map[char] || char);
    t = t.replace(/[^a-z0-9\s-]/g, "");
    t = t.replace(/ /g, "-");
    t = t.replace(/-+/g, "-");
    t = t.replace(/^-+/, "").replace(/-+$/, "");
    return t;
}

// ===== TOAST =====
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

// ===== NAVEGACIÓN =====
function showView(view) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById(`view-${view}`).style.display = 'block';
    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar nav a[data-view="${view}"]`);
    if (activeLink) activeLink.classList.add('active');
}

// ===== CERRAR SESIÓN =====
function logout() {
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('githubToken');
    window.location.href = 'login.html';
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
