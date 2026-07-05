// ===== FUNCIONES GENERALES =====

// ===== CACHÉ DE IMÁGENES =====
var imageCache = {};

// ===== FUNCIÓN UNIVERSAL PARA RESOLVER UNA IMAGEN (con fallback de extensiones) =====
function resolveImageUrl(baseName, extensions, callback) {
    if (!baseName) return callback(null);
    if (imageCache[baseName]) {
        callback(imageCache[baseName]);
        return;
    }
    const extList = extensions || ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    let index = 0;
    
    function tryNext() {
        if (index >= extList.length) {
            imageCache[baseName] = null;
            callback(null);
            return;
        }
        const ext = extList[index];
        const url = './images/products/' + baseName + '.' + ext;
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

// ===== FUNCIÓN PARA GENERAR PLACEHOLDER =====
function getPlaceholderImage(label) {
    return 'data:image/svg+xml,' + 
        '%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400"%3E' +
        '%3Crect fill="%23141414" width="300" height="400"/%3E' +
        '%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="24"%3E?%3C/text%3E' +
        '%3C/svg%3E';
}

function splitTitle(n) {
    var t = n.split(" ");
    var i = t.length;
    var r = Math.round(i / 2);
    var u = t.slice(0, r).join(" ");
    var f = t.slice(r).join(" ");
    return i === 1 ? [n, ""] : [u, f];
}

function addToCart(n, t, i, r) {
    i = i || 1;
    r = r || false;
    var u = getCart();
    var f = false;
    var e = u.items.findIndex(function(item) { return item.productId === n; });
    if (e !== -1) {
        if (r) {
            u.items.splice(e, 1);
            f = true;
        } else {
            u.items[e] = { productId: n, qty: i };
        }
    } else {
        u.items.push({ productId: n, qty: i.toString() });
        if (typeof googleAnalyticsId !== 'undefined' && googleAnalyticsId !== null && googleAnalyticsId.length > 0) {
            gtag("event", "add_to_cart", { items: [{ id: n, name: t, quantity: i }] });
        }
    }
    addStorage("cart", u);
    updateCartQty();
    if (f) {
        swal(t, "¡Fue eliminado de la carta!", "error");
    } else {
        swal(t, "¡Fue adicionado a la carta!", "success");
    }
    return f;
}

function ToSlug(n) {
    if (!n) return "";
    var t = n.toLowerCase();
    t = toEnglish(t);
    t = t.replace(/[^a-z0-9\s-]/g, "");
    t = t.replace(/ /g, "-");
    t = t.replace(/-+/g, "-");
    t = t.replace(/^-+/, "").replace(/-+$/, "");
    if (t.length > 50) {
        var h = stringToHash(t);
        t = t.substring(0, 50) + "-" + h;
    }
    return t;
}

function stringToHash(n) {
    var t = 0;
    if (!n) return t.toString();
    for (var i = 0; i < n.length; i++) {
        var r = n.charCodeAt(i);
        t = ((t << 5) - t + r) & 2147483647;
    }
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var result = "";
    while (t > 0) {
        result = chars[t % 36] + result;
        t = Math.floor(t / 36);
    }
    return result;
}

function spanishFormat(n) {
    return n;
}

// ===== FUNCIÓN NORMALIZAR CORREGIDA =====
function normalizeText(n) {
    if (n && n.trim().length > 0) {
        n = toEnglish(n);
        // Eliminar caracteres no permitidos (solo letras, números, espacios y guiones)
        n = n.replace(/[^a-z0-9\s-]/g, "");
        // Reemplazar espacios por guiones
        n = n.replace(/\s+/g, "-");
        // Eliminar guiones duplicados
        n = n.replace(/-+/g, "-");
        // Eliminar guiones al inicio y final
        n = n.replace(/^-+/, "").replace(/-+$/, "");
        return n.toLowerCase();
    }
    return "";
}

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

function getFilterValues(n, t) {
    var parts = n.split(" ");
    var filtered = parts.filter(function(item) {
        return item.startsWith(t);
    });
    var values = filtered.map(function(item) {
        var splitted = item.split("-");
        return splitted.slice(1).join("-");
    });
    return values.length > 0 ? values : [];
}

function toMoneyStr(valor) {
    if (valor == null || isNaN(valor)) valor = 0;
    return "CUP$ " + valor.toFixed(2);
}

// ===== FUNCIÓN PARA AGREGAR TARJETA DE PRODUCTO (CORREGIDA) =====
function addProductCardBase(container, product, extraClass, mode) {
    extraClass = extraClass || "";
    mode = mode || 1;
    var div = document.createElement("div");
    var baseClass = "col-sm-6 col-md-4 col-lg-3 p-b-60 isotope-item";
    if (mode == 2) {
        baseClass = "item-slick2 p-l-15 p-r-15 p-t-15 p-b-15";
    }
    div.setAttribute("class", baseClass + extraClass);

    // Asignar precio real para ordenamiento
    var precioNumerico = parseFloat(product.Price) || 0;
    div.setAttribute("data-price", product.Price);
    div.setAttribute("data-price-usd", precioNumerico);
    
    if (product.Update) {
        var d = new Date(product.Update);
        var g = d.getTime();
        div.setAttribute("data-update", g);
    }

    var block = document.createElement("div");
    var blockClass = "block2";
    var not1 = getNot(not1Template, product);
    if (not1 != null && not1.length > 0) {
        blockClass += " not1";
        block.setAttribute("data-not1", not1);
    }
    var not2 = getNot(not2Template, product);
    if (not2 != null && not2.length > 0) {
        blockClass += " not2";
        block.setAttribute("data-not2", not2);
    }
    block.setAttribute("class", blockClass);

    var slug = ToSlug(product.Label);
    var link = document.createElement("a");
    link.setAttribute("class", "stext-104 cl3 hov-cl1 trans-04 js-name-b2");
    link.setAttribute("href", "product.html?id=" + slug);

    var pic = document.createElement("div");
    pic.setAttribute("class", "block2-pic hov-img0");
    var img = document.createElement("img");
    img.setAttribute("alt", "imagen");
    img.setAttribute("data-slug", slug);
    img.setAttribute("data-index", "0");
    img.setAttribute("src", getPlaceholderImage(product.Label));
    pic.appendChild(img);
    
    (function(imgEl, productSlug, idx) {
        var baseName = productSlug + "-" + idx;
        var extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        resolveImageUrl(baseName, extensions, function(url) {
            if (url) {
                imgEl.setAttribute('src', url);
                imgEl.classList.add('loaded');
            }
        });
    })(img, slug, 0);
    
    link.appendChild(pic);
    block.appendChild(link);

    var txt = document.createElement("div");
    txt.setAttribute("class", "block2-txt flex-w flex-t p-t-14");

    var child1 = document.createElement("div");
    child1.setAttribute("class", "block2-txt-child1 flex-col-l");
    
    var nameLink = document.createElement("a");
    nameLink.setAttribute("class", "stext-104 cl2 hov-cl1 trans-04 js-name-b2");
    nameLink.setAttribute("href", "product.html?id=" + slug);
    nameLink.setAttribute("style", "display: block; margin-bottom: 8px; font-size: 16px; font-weight: 600;");
    nameLink.textContent = spanishFormat(product.Label);
    child1.appendChild(nameLink);

    var featuresText = "";
    if (product.Features != null) {
        featuresText = spanishFormat(product.Features.join(", "));
    }
    var featuresSpan = document.createElement("span");
    featuresSpan.setAttribute("class", "cl4 stext-111");
    featuresSpan.setAttribute("style", "display: block; margin-bottom: 10px; line-height: 1.4; font-size: 13px;");
    featuresSpan.textContent = featuresText;
    child1.appendChild(featuresSpan);

    var precioFormateado = toMoneyStr(precioNumerico);
    var precioContainer = document.createElement("div");
    precioContainer.setAttribute("class", "p-t-6");
    precioContainer.setAttribute("style", "line-height: 1.3; margin-top: 4px;");
    var precioPrincipal = document.createElement("span");
    precioPrincipal.setAttribute("class", "stext-105 cl2");
    precioPrincipal.setAttribute("style", "font-weight: bold; font-size: 20px;");
    precioPrincipal.textContent = precioFormateado;
    precioContainer.appendChild(precioPrincipal);
    child1.appendChild(precioContainer);

    txt.appendChild(child1);

    var child2 = document.createElement("div");
    child2.setAttribute("class", "block2-txt-child2 flex-r p-t-3");
    var inCartFlag = inCart(slug);
    var cartBtn = document.createElement("a");
    cartBtn.setAttribute("class", "mica-btn-icon " + (inCartFlag ? "in-cart" : ""));
    cartBtn.setAttribute("href", "#");
    cartBtn.setAttribute("aria-label", "Agregar al carrito");
    cartBtn.setAttribute("style", "width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(26,26,26,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); color: #ccc; font-size: 18px; cursor: pointer; transition: all 0.3s ease;");
    var icon = document.createElement("i");
    icon.setAttribute("class", inCartFlag ? "zmdi zmdi-shopping-cart" : "zmdi zmdi-shopping-cart-plus");
    cartBtn.appendChild(icon);
    
    $(cartBtn).on("mouseenter", function() {
        $(this).css({ background: 'rgba(30,144,255,0.4)', color: '#fff', 'border-color': 'rgba(30,144,255,0.6)' });
    }).on("mouseleave", function() {
        if (!$(this).hasClass('in-cart')) {
            $(this).css({ background: 'rgba(26,26,26,0.6)', color: '#ccc', 'border-color': 'rgba(255,255,255,0.1)' });
        } else {
            $(this).css({ background: 'rgba(30,144,255,0.3)', color: '#fff', 'border-color': 'rgba(30,144,255,0.4)' });
        }
    });
    
    child2.appendChild(cartBtn);
    txt.appendChild(child2);

    block.appendChild(txt);
    div.appendChild(block);
    container.append(div);

    $(cartBtn).on("click", function(e) {
        e.preventDefault();
        var label = $(this).parent().parent().find(".js-name-b2").html();
        var wasRemoved = addToCart(slug, label, 1, true);
        updateAddCartIcon($(this), !wasRemoved);
        updateCartQty();
        var $icon = $(this).find(".zmdi");
        $icon.css("transform", "scale(1.3)");
        setTimeout(function() {
            $icon.css("transform", "scale(1)");
        }, 200);
    });
}

function getStorage(key) {
    var item = localStorage.getItem(key);
    return item != null && item.length > 0 ? JSON.parse(item) : null;
}

function addStorage(key, value) {
    var str = JSON.stringify(value);
    localStorage.setItem(key, str);
}

function updateCartQty() {
    var cart = getStorage("cart");
    var total = 0;
    if (cart != null && cart.items != null && cart.items.length > 0) {
        total = cart.items.reduce(function(acc, item) {
            return acc + parseInt(item.qty, 10);
        }, 0);
    }
    $(".js-show-cart").each(function() {
        $(this).attr("data-notify", total);
    });
}

function getCart() {
    var cart = getStorage("cart");
    if (cart == null) cart = { items: [] };
    if (cart.items == null) cart.items = [];
    cart.items = cart.items.filter(function(item) {
        return typeof item.productId === "string" && typeof item.qty === "string";
    });
    return cart;
}

function inCart(productId) {
    var cart = getCart();
    var index = cart.items.findIndex(function(item) {
        return item.productId === productId;
    });
    return index !== -1;
}

function updateAddCartIcons() {
    $(".btn-addwish-b2, .js-addcart").each(function() {
        var label = $(this).parent().parent().find(".js-name-b2").html();
        var slug = ToSlug(label);
        var exists = inCart(slug);
        updateAddCartIcon($(this), exists);
    });
}

function updateAddCartIcon(element, inCartFlag) {
    var icon = element.find(".zmdi");
    if (inCartFlag) {
        icon.removeClass("zmdi-shopping-cart-plus");
        icon.addClass("zmdi-shopping-cart");
        element.addClass("in-cart");
        element.css({ background: 'rgba(30,144,255,0.3)', color: '#fff', 'border-color': 'rgba(30,144,255,0.4)' });
    } else {
        icon.removeClass("zmdi-shopping-cart");
        icon.addClass("zmdi-shopping-cart-plus");
        element.removeClass("in-cart");
        element.css({ background: 'rgba(26,26,26,0.6)', color: '#ccc', 'border-color': 'rgba(255,255,255,0.1)' });
    }
}

function getNot(template, product) {
    if (template == null || template.length === 0) return "";
    var regex = /{([^}]*)}/;
    var match = regex.exec(template);
    while (match) {
        var key = match[1];
        var value = evaluateNot(key, product);
        template = template.slice(0, match.index) + value + template.slice(match.index + match[0].length);
        match = regex.exec(template);
    }
    return template;
}

function evaluateNot(expression, product) {
    var context = {
        discount: (product.Discount != null && product.Discount > 0) ? "- " + product.Discount.toLocaleString("en-US", { style: "currency", currency: "CUP", minimumFractionDigits: 0 }) : "",
        status: product.Def === true ? productDefStatus : productStatus,
        category: normalizeText(product.Category),
        subcategory: normalizeText(product.SubCategory)
    };
    var quotedRegex = /'([^}]*)'/;
    var quotedMatch = quotedRegex.exec(expression);
    var index = 0;
    var placeholders = {};
    while (quotedMatch) {
        index++;
        placeholders["[" + index + "]"] = quotedMatch[1];
        expression = expression.slice(0, quotedMatch.index) + "[" + index + "]" + expression.slice(quotedMatch.index + quotedMatch[0].length);
        quotedMatch = quotedRegex.exec(expression);
    }
    var parts = expression.split("?");
    if (parts.length > 1) {
        var base = context[parts[0]];
        var conditions = parts[1].split(":");
        if (conditions.length !== 2) return parts[1];
        if (base == null || base.length === 0 || base === 0) return context[conditions[1]];
        return context[conditions[0]];
    }
    return context[parts[0]];
}

function prepareWhatsapp() {
    var btn = $("<div class='whatsapp-btn'></div>");
    btn.html("<img src='images/icons/whatsapp_logo.png' alt='WhatsApp'>");
    btn.click(function() {
        if (typeof contactCell !== 'undefined' && contactCell !== null && contactCell > 0) {
            var text = "";
            if (typeof whatsappMessage !== 'undefined' && whatsappMessage !== null && whatsappMessage.length > 0) {
                text = "?text=" + encodeURIComponent(whatsappMessage);
            }
            window.open("https://wa.me/+" + contactCell + text, "_blank");
        }
    });
    $("body").append(btn);
}

var contactCell = "";
var contactEmail = "";
var productStatus = "";
var productDefStatus = "";
var not1Template = "";
var not2Template = "";
var whatsappMessage = "¡Hola! Me interesa saber más sobre tus productos/servicios. ¿Podrías ayudarme?";
var googleAnalyticsId = "";

(function($) {
    "use strict";
    var loadingStarted = false;
    $(".animsition").animsition({
        inClass: "fade-in",
        outClass: "fade-out",
        inDuration: 1500,
        outDuration: 800,
        linkElement: ".animsition-link",
        loading: true,
        loadingParentElement: "html",
        loadingClass: "animsition-loading-1",
        loadingInner: '<div class="loader05"></div><p id="loading-text" style="margin-top: 40px; text-align: center;">cargando, por favor espere!</p>',
        timeout: false,
        timeoutCountdown: 5000,
        onLoadEvent: true,
        browser: ["animation-duration", "-webkit-animation-duration"],
        overlay: false,
        overlayClass: "animsition-overlay-slide",
        overlayParentElement: "html",
        transition: function(url) {
            window.location.href = url;
        }
    }).one("animsition.inStart", function() {
        loadingStarted = true;
    });

    var steps = ["categorías", "subcategorías", "características", "detalles", "precios", "imágenes", "combos", "ofertas"];
    var stepIndex = 0;
    var progress = 0;
    var interval = setInterval(function() {
        if (loadingStarted) clearInterval(interval);
        if (stepIndex >= steps.length) {
            $("#loading-text").text("La carga está tardando más de lo usual. Por favor, recarga la página.");
        } else if (progress < 100) {
            progress++;
            $("#loading-text").text("cargando " + steps[stepIndex] + ": " + progress + "%");
        } else {
            stepIndex++;
            progress = 0;
        }
    }, 100);

    $.getJSON("./data/manifest.json", function(data) {
        if (data != null) {
            var titleParts = splitTitle(data.Title.toUpperCase());
            $(".storet1").text(titleParts[0]);
            $(".storet2").text(titleParts[1]);
            contactCell = data.Cell;
            contactEmail = data.Email;
            not1Template = data.Not1;
            not2Template = data.Not2;
            productStatus = data.ProductStatus;
            productDefStatus = data.ProductDefStatus;
            googleAnalyticsId = data.GoogleAnalyticsId;
            if (data.Warranty != null && data.Warranty.length > 0) {
                $("#warrantyText").html(data.Warranty.replace(/\n/g, "<br>"));
            }
            $(".headnotification").text(data.HeadNotification);
            $(".foot").text(data.Foot);
            if (data.CartPayMethod != null && data.CartPayMethod.length > 0) {
                $(".paymethod").html(data.CartPayMethod.replace(/\n/g, "<br>"));
            }
            if (data.CartShipping != null && data.CartShipping.length > 0) {
                var shippingText = data.CartShipping.replace(/\n/g, "<br>");
                $(".shipping").html(shippingText);
                $("#shippingText").html(shippingText);
            }
        }
    });

    updateCartQty();
    prepareWhatsapp();
    
    // Redirección de carrito desactivada (ya se usa onclick en HTML)
    // $(".js-show-cart").click(function() {
    //     window.location.replace("./cart.html");
    // });
})(jQuery);
