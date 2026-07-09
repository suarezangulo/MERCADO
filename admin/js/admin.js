// ============================================================
// ADMIN.JS - Panel de administración con GitHub API
// Versión con fallback universal de extensiones
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
let existingImages = [];
let imageCache = {}; // Cache de imágenes resueltas

// ===== FUNCIÓN UNIVERSAL PARA RESOLVER UNA IMAGEN (con fallback de extensiones) =====
function resolveImageUrl(baseName, extensions, callback) {
    if (!baseName) return callback(null);
    // Si ya está en caché, usarlo
    if (imageCache[baseName]) {
        callback(imageCache[baseName]);
        return;
    }
    // Extensiones por defecto si no se proporcionan
    const extList = extensions || ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    let index = 0;
    
    function tryNext() {
        if (index >= extList.length) {
            // No se encontró ninguna
            imageCache[baseName] = null;
            callback(null);
            return;
        }
        const ext = extList[index];
        const url = `../images/products/${baseName}.${ext}`;
        fetch(url, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    imageCache[baseName] = url;
                    callback(url);
                } else {
                    index++;
                    tryNext();
                }
            })
            .catch(() => {
                index++;
                tryNext();
            });
    }
    tryNext();
}

// ===== FUNCIONES DE GITHUB API =====
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

async function uploadImage(file, slug, index) {
    const token = getGitHubToken();
    if (!token) throw new Error('Token no disponible');
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

// ===== CARGAR PRODUCTOS =====
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

// ===== RENDER TABLA (con fallback universal) =====
function renderProductTable() {
    const tbody = document.getElementById('productTableBody');
    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px; color: var(--text-muted);">
            <i class="fas fa-film" style="font-size:48px; display:block; margin-bottom:16px; opacity:0.3;"></i>
            No hay títulos en el catálogo. ¡Crea uno ahora!
        </td></tr>`;
        return;
    }

    // Generar HTML inicial con placeholders
    let html = '';
    products.forEach((p, index) => {
        const slug = ToSlug(p.Label);
        const imagesList = p.Images ? p.Images.split(';').map(img => img.trim()) : [];
        let imageName = imagesList.length > 0 ? imagesList[0] : `${slug}-0.webp`;
        if (!imageName.includes('.')) {
            imageName = imageName + '.webp';
        }
        const baseName = imageName.replace(/\.[^.]+$/, '');
        const imgId = `img-${slug}-${index}`;
        
        html += `
        <tr data-index="${index}">
            <td>
                <img id="${imgId}" 
                     src="" 
                     alt="${p.Label}" 
                     class="product-thumb" 
                     style="display:none;">
                <div id="${imgId}-loading" style="width:45px; height:65px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:12px; border:1px dashed var(--border-color); border-radius:4px;">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            </td>
            <td><strong>${p.Label}</strong></td>
            <td><span style="color: var(--text-secondary);">${p.Category}</span> / ${p.SubCategory}</td>
            <td style="color: var(--text-secondary);">${p.Price}</td>
            <td>${p.Stock || 0}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-primary btn-sm edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    });
    tbody.innerHTML = html;

    // Asignar eventos a los botones
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (typeof editProduct === 'function') {
                editProduct(index);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (typeof deleteProduct === 'function') {
                deleteProduct(index);
            }
        });
    });

    // Resolver imágenes con fallback
    products.forEach((p, index) => {
        const slug = ToSlug(p.Label);
        const imagesList = p.Images ? p.Images.split(';').map(img => img.trim()) : [];
        let imageName = imagesList.length > 0 ? imagesList[0] : `${slug}-0.webp`;
        if (!imageName.includes('.')) {
            imageName = imageName + '.webp';
        }
        const baseName = imageName.replace(/\.[^.]+$/, '');
        const imgId = `img-${slug}-${index}`;
        const loadingId = `${imgId}-loading`;
        const imgElement = document.getElementById(imgId);
        const loadingElement = document.getElementById(loadingId);
        
        // Obtener extensiones posibles
        const extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        const csvExt = imageName.split('.').pop().toLowerCase();
        const orderedExtensions = [csvExt, ...extensions.filter(ext => ext !== csvExt)];
        
        resolveImageUrl(baseName, orderedExtensions, (url) => {
            if (loadingElement) loadingElement.style.display = 'none';
            if (imgElement) {
                imgElement.style.display = 'block';
                imgElement.src = url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="45" height="65"><rect fill="%23141414" width="45" height="65"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="12">?</text></svg>';
            }
        });
    });
}

// ===== FUNCIONES GLOBALES PARA BOTONES =====
window.editProduct = function(index) {
    console.log('editProduct llamado con índice:', index);
    const product = products[index];
    if (product) {
        openProductForm(product);
    } else {
        showToast('Producto no encontrado', 'error');
    }
};

window.deleteProduct = function(index) {
    const product = products[index];
    if (!product) return;
    if (!confirm(`¿Eliminar "${product.Label}" definitivamente?`)) return;

    (async function() {
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
    })();
};

// ===== ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    const categories = new Set(products.map(p => p.Category));
    document.getElementById('totalCategories').textContent = categories.size;
    const totalStock = products.reduce((sum, p) => sum + (parseInt(p.Stock) || 0), 0);
    document.getElementById('totalStock').textContent = totalStock;
}

// ===== ÚLTIMOS PRODUCTOS (con fallback universal de imágenes) =====
function updateRecentProducts() {
    const container = document.getElementById('recentProducts');
    const recent = products.slice(0, 5);
    if (!recent.length) {
        container.innerHTML = '<span style="color: var(--text-muted);">No hay títulos aún.</span>';
        return;
    }

    // Generar HTML con placeholders de carga
    let html = '';
    const items = [];
    recent.forEach((p, index) => {
        const slug = ToSlug(p.Label);
        const imagesList = p.Images ? p.Images.split(';').map(img => img.trim()) : [];
        const firstImage = imagesList.length > 0 ? imagesList[0].trim() : '';
        const baseName = firstImage ? firstImage.replace(/\.[^.]+$/, '') : `${slug}-0`;
        const imgId = `recent-img-${slug}-${index}`;
        const loadingId = `recent-loading-${slug}-${index}`;
        
        html += `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-color);">
            <div style="width:32px; height:45px; flex-shrink:0; position:relative;">
                <img id="${imgId}" 
                     src="" 
                     alt="${p.Label}" 
                     style="width:32px; height:45px; object-fit:cover; border-radius:4px; background:rgba(255,255,255,0.03); display:none;">
                <div id="${loadingId}" style="width:32px; height:45px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:12px; border:1px dashed var(--border-color); border-radius:4px; position:absolute; top:0; left:0;">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            </div>
            <span style="flex:1;">${p.Label}</span>
            <span style="color: var(--text-muted); font-size:13px;">${p.Price}</span>
        </div>
        `;
        items.push({ slug, baseName, imgId, loadingId });
    });
    container.innerHTML = html;

    // Resolver cada imagen con fallback de extensiones
    items.forEach(item => {
        const extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        // Si la imagen del CSV tiene extensión, ponerla primero
        const imagesList = recent.find(p => ToSlug(p.Label) === item.slug)?.Images || '';
        const firstImage = imagesList.split(';').map(img => img.trim())[0] || '';
        const csvExt = firstImage.includes('.') ? firstImage.split('.').pop().toLowerCase() : 'webp';
        const orderedExtensions = [csvExt, ...extensions.filter(ext => ext !== csvExt)];
        
        resolveImageUrl(item.baseName, orderedExtensions, (url) => {
            const img = document.getElementById(item.imgId);
            const loading = document.getElementById(item.loadingId);
            if (loading) loading.style.display = 'none';
            if (img) {
                img.style.display = 'block';
                if (url) {
                    img.src = url;
                } else {
                    // Mostrar placeholder "?" si no se encontró ninguna imagen
                    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="45"><rect fill="%23141414" width="32" height="45"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="10">?</text></svg>';
                }
            }
        });
    });
}

// ===== ABRIR FORMULARIO (con fallback de imágenes existentes) =====
function openProductForm(product = null) {
    editingProduct = product;
    uploadedImages = [];
    existingImages = [];
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
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
        document.getElementById('productDescription').value = product.Description || '';
        document.getElementById('productFeatures').value = (product.Features || '').split(';').join('\n');
        
        // Cargar imágenes existentes con fallback de extensiones
        const imagesList = product.Images ? product.Images.split(';').map(img => img.trim()) : [];
        existingImages = imagesList;
        
        // Mostrar un spinner mientras se resuelven las imágenes
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Cargando imágenes...</div>';
        
        // Resolver cada imagen y mostrarla cuando esté lista
        let resolvedCount = 0;
        imagesList.forEach((imgName, idx) => {
            const baseName = imgName.replace(/\.[^.]+$/, '');
            const extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
            const csvExt = imgName.split('.').pop().toLowerCase();
            const orderedExtensions = [csvExt, ...extensions.filter(ext => ext !== csvExt)];
            
            resolveImageUrl(baseName, orderedExtensions, (url) => {
                // Limpiar el spinner la primera vez que se resuelve una imagen
                if (resolvedCount === 0) {
                    container.innerHTML = '';
                }
                resolvedCount++;
                
                const div = document.createElement('div');
                div.className = 'image-preview-item';
                const img = document.createElement('img');
                img.alt = `Imagen ${idx+1}`;
                if (url) {
                    img.src = url;
                    console.log(`✅ Imagen resuelta: ${url}`);
                } else {
                    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect fill="%23141414" width="100" height="140"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="14">?</text></svg>';
                    console.warn(`❌ No se encontró imagen para: ${baseName}`);
                }
                div.appendChild(img);
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = function() {
                    removeExistingImage(idx);
                };
                div.appendChild(removeBtn);
                container.appendChild(div);
            });
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
    // Reconstruir previsualización (simplificado: recargar el modal)
    const product = editingProduct;
    if (product) {
        // Limpiar y volver a cargar
        const container = document.getElementById('imagePreviewContainer');
        container.innerHTML = '';
        // Volver a cargar las imágenes existentes (sin fallback, se resolverán de nuevo)
        existingImages.forEach((imgName, idx) => {
            const baseName = imgName.replace(/\.[^.]+$/, '');
            const extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
            const csvExt = imgName.split('.').pop().toLowerCase();
            const orderedExtensions = [csvExt, ...extensions.filter(ext => ext !== csvExt)];
            
            resolveImageUrl(baseName, orderedExtensions, (url) => {
                const div = document.createElement('div');
                div.className = 'image-preview-item';
                const img = document.createElement('img');
                img.alt = `Imagen ${idx+1}`;
                img.src = url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect fill="%23141414" width="100" height="140"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="14">?</text></svg>';
                div.appendChild(img);
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = function() {
                    removeExistingImage(idx);
                };
                div.appendChild(removeBtn);
                container.appendChild(div);
            });
        });
    }
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
    const uploadedNames = [];

    try {
        for (let i = 0; i < uploadedImages.length; i++) {
            const result = await uploadImage(uploadedImages[i], slug, existingImages.length + i);
            uploadedNames.push(result.fileName);
        }
    } catch (error) {
        showToast('Error al subir imágenes: ' + error.message, 'error');
        return;
    }

    const allImages = [...existingImages, ...uploadedNames];
    const imagesNames = allImages.join(';');

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

// ===== CERRAR SESIÓN (FUNCIÓN GLOBAL) =====
window.logout = function() {
    console.log('Cerrando sesión...');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('githubToken');
    window.location.href = 'login.html';
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando panel...');
    loadProducts();
    showView('dashboard');

    // Botón de nuevo producto
    const createBtn = document.getElementById('createProductBtn');
    if (createBtn) {
        createBtn.addEventListener('click', () => openProductForm(null));
    } else {
        console.warn('No se encontró #createProductBtn');
    }

    // Botón de guardar producto
    const submitBtn = document.getElementById('submitProductBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', saveProduct);
    } else {
        console.warn('No se encontró #submitProductBtn');
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', window.logout);
        console.log('Evento de logout asignado');
    } else {
        console.warn('No se encontró #logoutBtn');
    }

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

// ===== EXPONER FUNCIONES GLOBALMENTE (por si acaso) =====
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.logout = logout;
