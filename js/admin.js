// ===== GUARDAR PRODUCTO (redirige al CMS) =====
async function saveProduct() {
    // Si es edición, redirige a la entrada del CMS
    if (currentProductId) {
        window.location.href = '/admin/#/collections/productos/entries/' + currentProductId;
    } else {
        // Si es nuevo, redirige a nueva entrada
        window.location.href = '/admin/#/collections/productos/new';
    }
}

// ===== ELIMINAR PRODUCTO (redirige al CMS para eliminar) =====
async function deleteProduct(slug) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? La acción se realizará en el CMS.')) return;
    // Redirigir al CMS para que el usuario elimine manualmente
    window.location.href = '/admin/#/collections/productos/entries/' + slug;
}
