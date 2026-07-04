// ============================================================
// UTILS.JS - Funciones compartidas (carrito, slug, etc.)
// ============================================================

// ===== CONFIGURACIÓN GLOBAL =====
var contactCell = '';
var contactEmail = '';
var productStatus = '';
var productDefStatus = '';
var not1Template = '';
var not2Template = '';
var googleAnalyticsId = '';
var whatsappMessage = '¡Hola! Me interesa saber más sobre tus productos.';

// ===== SPLIT TITLE =====
function splitTitle(n) {
    var t = n.split(' ');
    var i = t.length;
    var r = Math.round(i / 2);
    var u = t.slice(0, r).join(' ');
    var f = t.slice(r).join(' ');
    return i === 1 ? [n, ''] : [u, f];
}

// ===== SLUG (con conversión de acentos) =====
function ToSlug(n) {
    if (!n) return '';
    var map = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ü': 'u', 'ñ': 'n', 'Á': 'A', 'É': 'E', 'Í': 'I',
        'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N'
    };
    var t = n.toLowerCase();
    t = t.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, function(char) { return map[char] || char; });
    t = t.replace(/[^a-z0-9\s-]/g, '');
    t = t.replace(/\s+/g, '-');
    t = t.replace(/-+/g, '-');
    t = t.replace(/^-+/, '').replace(/-+$/, '');
    return t;
}

// ===== NORMALIZE =====
function normalizeText(n) {
    if (!n) return '';
    var map = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ü': 'u', 'ñ': 'n', 'Á': 'A', 'É': 'E', 'Í': 'I',
        'Ó': 'O', 'Ú': 'U', 'Ü': 'U', 'Ñ': 'N'
    };
    var t = n.toLowerCase();
    t = t.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, function(char) { return map[char] || char; });
    t = t.replace(/[^a-z0-9\s-]/g, '');
    t = t.replace(/\s+/g, '-');
    t = t.replace(/-+/g, '-');
    t = t.replace(/^-+/, '').replace(/-+$/, '');
    return t;
}

// ===== SPANISH FORMAT =====
function spanishFormat(n) { return n; }

// ===== TO MONEY STRING =====
function toMoneyStr(valor) {
    if (isNaN(valor) || valor === null) valor = 0;
    return 'CUP$ ' + valor.toFixed(2);
}

// ===== CARRITO =====
function getCart() {
    var cart = localStorage.getItem('cart');
    if (!cart) return { items: [] };
    try { return JSON.parse(cart); } catch(e) { return { items: [] }; }
}

function addStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function addToCart(productId, label, quantity, removeIfExists) {
    quantity = quantity || 1;
    removeIfExists = removeIfExists || false;
    var cart = getCart();
    var existingIndex = -1;
    for (var i = 0; i < cart.items.length; i++) {
        if (cart.items[i].productId === productId) {
            existingIndex = i;
            break;
        }
    }
    if (existingIndex !== -1) {
        if (removeIfExists) {
            cart.items.splice(existingIndex, 1);
            addStorage('cart', cart);
            updateCartQty();
            return true; // se eliminó
        } else {
            cart.items[existingIndex].qty = quantity;
        }
    } else {
        cart.items.push({ productId: productId, qty: quantity.toString() });
        if (googleAnalyticsId && window.gtag) {
            gtag('event', 'add_to_cart', { items: [{ id: productId, name: label, quantity: quantity }] });
        }
    }
    addStorage('cart', cart);
    updateCartQty();
    return false; // se agregó
}

function inCart(productId) {
    var cart = getCart();
    for (var i = 0; i < cart.items.length; i++) {
        if (cart.items[i].productId === productId) return true;
    }
    return false;
}

function updateCartQty() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.items.length; i++) {
        total += parseInt(cart.items[i].qty) || 0;
    }
    $('.cart-icon').attr('data-notify', total);
}

// ===== GET NOT (para badges) =====
function getNot(template, product) {
    if (!template) return '';
    var result = template;
    var regex = /{([^}]*)}/g;
    var match;
    while ((match = regex.exec(template)) !== null) {
        var expr = match[1];
        var value = evaluateExpression(expr, product);
        result = result.replace(match[0], value);
    }
    return result;
}

function evaluateExpression(expr, product) {
    if (expr === 'status') return product.Def ? productDefStatus : productStatus;
    if (expr === 'discount') return product.Discount ? '-' + product.Discount + '%' : '';
    return '';
}

// ===== PREPARAR WHATSAPP =====
function prepareWhatsapp() {
    var btn = $('<div class="whatsapp-btn"></div>');
    btn.html('<img src="images/icons/whatsapp_logo.png" alt="WhatsApp">');
    btn.on('click', function() {
        if (contactCell) {
            var msg = whatsappMessage || '¡Hola!';
            window.open('https://wa.me/+' + contactCell + '?text=' + encodeURIComponent(msg), '_blank');
        }
    });
    $('body').append(btn);
}

// ===== INICIALIZACIÓN =====
$(document).ready(function() {
    $.getJSON('data/manifest.json', function(data) {
        if (data) {
            contactCell = data.Cell || '';
            contactEmail = data.Email || '';
            productStatus = data.ProductStatus || '';
            productDefStatus = data.ProductDefStatus || '';
            not1Template = data.Not1 || '';
            not2Template = data.Not2 || '';
            googleAnalyticsId = data.GoogleAnalyticsId || '';
            whatsappMessage = data.HeadNotification || '¡Hola! Me interesa saber más sobre tus productos.';

            var titleParts = splitTitle(data.Title || 'CINEMARKET');
            $('.logo__cine').text(titleParts[0] || 'CINE');
            $('.logo__market').text(titleParts[1] || 'MARKET');
            $('.topbar__text').text(data.HeadNotification || '');
        }
    });

    prepareWhatsapp();
    updateCartQty();
});
