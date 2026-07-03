// ============================================================
// ADMIN.JS - Panel de administración con GitHub API
// Soporte para imágenes con cualquier extensión
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
let existingImages = []; // Para almacenar las imágenes existentes al editar

// ===== FUNCIONES DE GITHUB API (con soporte UTF-8 y BOM) =====

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
    
    const binaryString = atob(data.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    let content = new TextDecoder('utf-8').decode(bytes);
    
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    return { content, sha: data.sha };
}

async function updateCSV(csvContent) {
    const token = getGitHubToken();
    if (!token) throw new Error('Token no disponible');
    const { sha } = await fetchCSV();
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CSV_PATH}`;
    
    const contentWithBOM = '\uFEFF' + csvContent;
    const encoder = new TextEncoder();
    const data = encoder.encode(contentWithBOM);
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

// ===== SUBIR IMAGEN CON EXTENSIÓN ORIGINAL =====
async function uploadImage(file, slug, index) {
    const token = getGitHubToken();
    if (!token) throw new Error('Token no disponible');
    // Obtener la extensión del archivo original
    const extension = file.name.split('.').pop();
    const fileName = `${slug}-${index}.${extension}`;
    const path = `images/products/${fileName}`;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    
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
    return { fileName, extension };
}

// ===== CARGAR PRODUCTOS DESDE EL CSV =====
async function loadProducts() {
    try {
        const { content } = await fetchCSV();
        if (!content.trim()) {
            products = [];
            renderProductTable();
            updateStats();
            updateRecentProducts();
            document.getElementById('productCount').textContent = 0;
            return;
        }
        
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
            const values = parseCSVLine(lines[i]);
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

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (insideQuotes) {
            if (char === '"' && line[i+1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                insideQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                insideQuotes = true;
            } else if (char === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

// ===== RENDER TABLA (con fallback de extensiones) =====
function renderProductTable() {
    const tbody = document.getElementById('productTableBody');
    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px; color: var(--text-muted);">
            <i class="fas fa-film" style="font-size:48px; display:block; margin-bottom:16px; opacity:0.3;"></i>
            No hay títulos en el catálogo. ¡Crea uno ahora!
        </td></tr>`;
        return;
    }
    
    // Definir la función de fallback globalmente (una sola vez)
    if (typeof window.tryNextExtension === 'undefined') {
        window.tryNextExtension = function(imgId, basePath, extensions, currentIndex) {
            const img = document.getElementById(imgId);
            if (!img) return;
            const nextIndex = currentIndex + 1;
            if (nextIndex >= extensions.length) {
                // Si se agotaron todas las extensiones, mostrar placeholder
                img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="45" height="65"><rect fill="%23141414" width="45" height="65"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="12">?</text></svg>';
                return;
            }
            const nextExt = extensions[nextIndex];
            img.src = basePath + '.' + nextExt;
        };
    }
    
    tbody.innerHTML = products.map((p, index) => {
        const slug = ToSlug(p.Label);
        const imagesList = p.Images ? p.Images.split(';').map(img => img.trim()) : [];
        let imageName = imagesList.length > 0 ? imagesList[0] : `${slug}-0.webp`;
        
        // Si el nombre de la imagen no tiene extensión, asumimos webp
        if (!imageName.includes('.')) {
            imageName = imageName + '.webp';
        }
        
        // Extraer el nombre base (sin extensión)
        const baseName = imageName.replace(/\.[^.]+$/, '');
        const basePath = `../images/products/${baseName}`;
        
        // Extensiones a probar en orden de prioridad
        const extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        // Obtener la extensión del CSV
        const csvExt = imageName.split('.').pop().toLowerCase();
        // Colocar la extensión del CSV al principio para que se intente primero
        const orderedExtensions = [csvExt, ...extensions.filter(ext => ext !== csvExt)];
        
        // Generar un ID único para cada imagen
        const imgId = `img-${slug}-${index}`;
        
        // Construir el HTML de la fila
        return `
        <tr>
            <td>
                <img id="${imgId}" 
                     src="../images/products/${imageName}" 
                     alt="${p.Label}" 
                     class="product-thumb" 
                     onerror="tryNextExtension('${imgId}', '${basePath}', ${JSON.stringify(orderedExtensions)}, ${orderedExtensions.indexOf(csvExt)})">
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
        const imagesList = p.Images ? p.Images.split(';') : [];
        const firstImage = imagesList.length > 0 ? imagesList[0].trim() : '';
        const imagePath = firstImage ? `../images/products/${firstImage}` : '';
        return `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
            ${imagePath ? `<img src="${imagePath}" style="width:32px; height:45px; object-fit:cover; border-radius:4px; background:rgba(255,255,255,0.03);" onerror="this.style.display='none'">` :
            `<span style="width:32px; height:45px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:12px; border:1px dashed var(--border-color); border-radius:4px;">?</span>`}
            <span style="flex:1;">${p.Label}</span>
            <span style="color: var(--text-muted); font-size:13px;">${p.Price}</span>
        </div>
    `}).join('');
}

// ===== ABRIR FORMULARIO (con previsualización de imágenes existentes) =====
function openProductForm(product = null) {
    editingProduct = product;
    uploadedImages = [];
    existingImages = [];
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
        
        // Cargar imágenes existentes para previsualización
        const imagesList = product.Images ? product.Images.split(';').map(img => img.trim()) : [];
        existingImages = imagesList;
        const container = document.getElementById('imagePreviewContainer');
        imagesList.forEach((imgName, index) => {
            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `
                <img src="../images/products/${imgName}" alt="Imagen existente">
                <button class="remove-image" onclick="removeExistingImage(${index})">&times;</button>
            `;
            container.appendChild(div);
        });
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Título';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Título';
        document.getElementById('productForm').reset();
    }

    populateCategorySelects();
    openModal('productModal');
}

function removeExistingImage(index) {
    existingImages.splice(index, 1);
    // Reconstruir previsualización
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    existingImages.forEach((imgName, i) => {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `
            <img src="../images/products/${imgName}" alt="Imagen existente">
            <button class="remove-image" onclick="removeExistingImage(${i})">&times;</button>
        `;
        container.appendChild(div);
    });
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

// ===== SUBIR IMÁGENES (previsualización) =====
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
                <button class="remove-image" onclick="removeNewImage(this, '${file.name}')">&times;</button>
            `;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
        uploadedImages.push(file);
    }
});

function removeNewImage(btn, fileName) {
    const item = btn.closest('.image-preview-item');
    item.remove();
    const index = uploadedImages.findIndex(f => f.name === fileName);
    if (index > -1) uploadedImages.splice(index, 1);
}

// ===== GUARDAR PRODUCTO (con extensión dinámica) =====
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
    const uploadedNames = [];

    // Subir nuevas imágenes a GitHub
    try {
        for (let i = 0; i < uploadedImages.length; i++) {
            const result = await uploadImage(uploadedImages[i], slug, existingImages.length + i);
            uploadedNames.push(result.fileName);
        }
    } catch (error) {
        showToast('Error al subir imágenes: ' + error.message, 'error');
        return;
    }

    // Combinar imágenes existentes + nuevas
    const allImages = [...existingImages, ...uploadedNames];
    const imagesNames = allImages.join(';');

    // Escapar descripción y características
    const escapedDescription = description.includes(',') ? `"${description}"` : description;
    const escapedFeatures = features.includes(',') ? `"${features}"` : features;
    
    const csvRow = [
        category,
        subcategory,
        label,
        `${parseFloat(price).toFixed(2)} CUP`,
        stock,
        escapedDescription,
        escapedFeatures,
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
