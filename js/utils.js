// ===== TASA DE CAMBIO (global) =====
var TASA_CAMBIO = parseFloat(localStorage.getItem('tasaCambio')) || 685; // 1 USD = 685 CUP

// ===== MONEDA PREFERIDA DEL USUARIO =====
function getMonedaPreferida() {
    return localStorage.getItem('monedaPreferida') || 'USD';
}

// ===== CAMBIO DE MONEDA SIN RECARGAR LA PÁGINA =====
function setMonedaPreferida(moneda) {
    localStorage.setItem('monedaPreferida', moneda);
    $('.currency-selector a').removeClass('active');
    $('#moneda-' + moneda.toLowerCase()).addClass('active');
    $('#moneda-' + moneda.toLowerCase() + '-movil').addClass('active');
    if (typeof updateCart === 'function') {
        updateCart();
        return;
    }
    location.reload();
}

function splitTitle(n) {
    const t = n.split(" "),
        i = t.length,
        r = Math.round(i / 2),
        u = t.slice(0, r).join(" "),
        f = t.slice(r).join(" ");
    return i === 1 ? [n, ""] : [u, f];
}

function addToCart(n, t, i = 1, r = false) {
    let u = getCart(),
        f = !1;
    const e = u.items.findIndex(t => t.productId === n);
    if (e !== -1) {
        if (r) {
            u.items.splice(e, 1);
            f = !0;
        } else {
            u.items[e] = { productId: n, qty: i };
        }
    } else {
        u.items.push({ productId: n, qty: i.toString() });
        if (googleAnalyticsId != null && googleAnalyticsId.length > 0) {
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
    let t = n.toLowerCase();
    t = t.replace(/[^a-z0-9\s-]/g, "");
    t = t.replace(/ /g, "-");
    t = t.replace(/-+/g, "-");
    t = t.replace(/^-+/, "").replace(/-+$/, "");
    if (t.length > 50) {
        const n = stringToHash(t);
        t = `${t.substring(0, 50)}-${n}`;
    }
    return t;
}

function stringToHash(n) {
    let t = 0;
    if (!n) return t.toString();
    for (let i = 0; i < n.length; i++) {
        const r = n.charCodeAt(i);
        t = ((t << 5) - t + r) & 2147483647;
    }
    let i = "";
    while (t > 0) {
        i = chars[t % 36] + i;
        t = Math.floor(t / 36);
    }
    return i;
}

function spanishFormat(n) {
    const t = {
        "á": String.fromCharCode(225),
        "é": String.fromCharCode(233),
        "í": String.fromCharCode(237),
        "ó": String.fromCharCode(243),
        "ú": String.fromCharCode(250),
        "ñ": String.fromCharCode(241),
        "Á": String.fromCharCode(193),
        "É": String.fromCharCode(201),
        "Í": String.fromCharCode(205),
        "Ó": String.fromCharCode(211),
        "Ú": String.fromCharCode(218),
        "Ñ": String.fromCharCode(209)
    };
    for (const i in t) {
        n = n.replace(new RegExp(i, "g"), t[i]);
    }
    return n;
}

function normalizeText(n) {
    return n && n.trim().length > 0 ? (n = toEnglish(n), n = n.replace(/[^\w-]/g, "_"), n.toLowerCase()) : "";
}

function toEnglish(n) {
    var t = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
        "Á": "A",
        "É": "E",
        "Í": "I",
        "Ó": "O",
        "Ú": "U",
        "Ü": "U",
        "Ñ": "N"
    };
    return n.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, function(n) {
        return t[n];
    });
}

function getFilterValues(n, t) {
    var r = n.split(" "),
        u = r.filter(function(n) {
            return n.startsWith(t);
        }),
        i = u.map(function(n) {
            let t = n.split("-");
            return t = t.slice(1), t.join("-");
        });
    return i.length > 0 ? i : [];
}

function toMoneyStr(valor, moneda = null) {
    if (valor == null || isNaN(valor)) valor = 0;
    if (!moneda) {
        moneda = getMonedaPreferida();
    }
    const prefijo = moneda === 'CUP' ? 'CUP$ ' : 'USD$ ';
    return prefijo + valor.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function addProductCardBase(n, t, i = "", r = 1) {
    let h = document.createElement("div"),
        w = "col-sm-6 col-md-4 col-lg-3 p-b-60 isotope-item";
    if (r == 2) {
        w = "item-slick2 p-l-15 p-r-15 p-t-15 p-b-15";
    }
    h.setAttribute("class", w + i);

    if (t.Price) {
        h.setAttribute("data-price", t.Price);
    }
    let precioOriginal = t.Price || "0.00 USD";
    let partes = precioOriginal.split(' ');
    let valorNumerico = parseFloat(partes[0]) || 0;
    let moneda = partes[1] || 'USD';
    let valorUSD = moneda === 'CUP' ? (valorNumerico / TASA_CAMBIO) : valorNumerico;
    h.setAttribute("data-price-usd", valorUSD.toFixed(4));
    if (t.Update) {
        var d = new Date(t.Update);
        var g = d.getTime();
        h.setAttribute("data-update", g);
    }

    let s = document.createElement("div"),
        l = "block2",
        a = getNot(not1Template, t);
    if (a != null && a.length > 0) {
        l += " not1";
        s.setAttribute("data-not1", a);
    }
    let v = getNot(not2Template, t);
    if (v != null && v.length > 0) {
        l += " not2";
        s.setAttribute("data-not2", v);
    }
    s.setAttribute("class", l);
    const c = ToSlug(t.Label);
    let u = document.createElement("a");
    u.setAttribute("class", "stext-104 cl3 hov-cl1 trans-04 js-name-b2");
    u.setAttribute("href", "product.html?id=" + c);
    let e = document.createElement("div");
    e.setAttribute("class", "block2-pic hov-img0");
    let y = document.createElement("img");
    // ==== CAMBIO: Usar el campo Images del producto ====
    let imgSrc = t.Images && t.Images.length > 0 ? t.Images[0] : "./images/products/" + c + "-0.webp";
    y.setAttribute("data-src", imgSrc);
    y.setAttribute("alt", "imágen");
    e.appendChild(y);
    u.appendChild(e);
    s.appendChild(u);
    e = document.createElement("div");
    e.setAttribute("class", "block2-txt flex-w flex-t p-t-14");
    let f = document.createElement("div");
    f.setAttribute("class", "block2-txt-child1 flex-col-l ");
    u = document.createElement("a");
    u.setAttribute("class", "stext-104 cl3 hov-cl1 trans-04 js-name-b2");
    u.setAttribute("href", "product.html?id=" + c);
    u.textContent = spanishFormat(t.Label);
    f.appendChild(u);
    let b = "";
    if (t.Features != null) {
        b = spanishFormat(t.Features.join(", "));
    }
    let o = document.createElement("span");
    o.setAttribute("class", "cl4 stext-111");
    o.textContent = b;
    f.appendChild(o);

    let monedaPref = getMonedaPreferida();
    let valorOriginal = parseFloat(t.Price.split(' ')[0]) || 0;
    let monedaOriginal = t.Price.split(' ')[1] || 'USD';
    let valorEnMonedaPref, monedaMostrar, valorEquivalente, monedaEquivalente;

    if (monedaOriginal === monedaPref) {
        valorEnMonedaPref = valorOriginal;
        monedaMostrar = monedaPref;
        monedaEquivalente = monedaPref === 'CUP' ? 'USD' : 'CUP';
        let tasa = typeof TASA_CAMBIO !== 'undefined' ? TASA_CAMBIO : 24;
        valorEquivalente = monedaPref === 'CUP' ? (valorOriginal / tasa) : (valorOriginal * tasa);
    } else {
        let tasa = typeof TASA_CAMBIO !== 'undefined' ? TASA_CAMBIO : 24;
        if (monedaOriginal === 'CUP' && monedaPref === 'USD') {
            valorEnMonedaPref = valorOriginal / tasa;
            monedaMostrar = 'USD';
            valorEquivalente = valorOriginal;
            monedaEquivalente = 'CUP';
        } else if (monedaOriginal === 'USD' && monedaPref === 'CUP') {
            valorEnMonedaPref = valorOriginal * tasa;
            monedaMostrar = 'CUP';
            valorEquivalente = valorOriginal;
            monedaEquivalente = 'USD';
        }
    }

    let precioFormateado = toMoneyStr(valorEnMonedaPref, monedaMostrar);
    let equivalenteFormateado = toMoneyStr(valorEquivalente, monedaEquivalente);

    let precioContainer = document.createElement("div");
    precioContainer.setAttribute("class", "p-t-6");
    precioContainer.setAttribute("style", "line-height: 1.3;");

    let precioPrincipal = document.createElement("span");
    precioPrincipal.setAttribute("class", "stext-105 cl2");
    precioPrincipal.setAttribute("style", "font-weight: bold; font-size: 20px;");
    precioPrincipal.textContent = precioFormateado;
    precioContainer.appendChild(precioPrincipal);

    let precioEquivalente = document.createElement("span");
    precioEquivalente.setAttribute("style", "display: block; font-size: 12px; color: #888; font-weight: normal; margin-top: 2px;");
    precioEquivalente.textContent = `≈ ${equivalenteFormateado}`;
    precioContainer.appendChild(precioEquivalente);

    f.appendChild(precioContainer);

    e.appendChild(f);
    f = document.createElement("div");
    f.setAttribute("class", "block2-txt-child2 flex-r p-t-3");
    let k = inCart(c),
        tt = k ? "cl1" : "cl4";
    u = document.createElement("a");
    u.setAttribute("class", "btn-addwish-b2 dis-block pos-relative js-addcart icon-add-cart hov-cl1 trans-04 " + tt);
    u.setAttribute("href", "#");
    let p = document.createElement("i");
    p.setAttribute("class", k ? "zmdi zmdi-shopping-cart" : "zmdi zmdi-shopping-cart-plus");
    p.setAttribute("style", "vertical-align: top;");
    u.appendChild(p);
    f.appendChild(u);
    e.appendChild(f);
    s.appendChild(e);
    h.appendChild(s);
    n.append(h);

    $(u).each(function() {
        var n = $(this).parent().parent().find(".js-name-b2").html();
        $(this).on("click", function(t) {
            t.preventDefault();
            let i = addToCart(c, n, 1, true);
            updateAddCartIcon($(this), !i);
            updateCartQty();
            var $icon = $(this).find(".zmdi");
            $icon.css("transform", "scale(1.3)");
            setTimeout(function() {
                $icon.css("transform", "scale(1)");
            }, 200);
        });
    });
}

function getStorage(n) {
    let t = localStorage.getItem(n);
    return t != null && t.length > 0 ? JSON.parse(t) : null;
}

function addStorage(n, t) {
    let i = JSON.stringify(t);
    localStorage.setItem(n, i);
}

function updateCartQty() {
    let n = getStorage("cart"),
        t = 0;
    if (n != null && n.items != null && n.items.length > 0) {
        t = n.items.reduce((n, t) => n + parseInt(t.qty, 10), 0);
    }
    $(".js-show-cart").each(function() {
        $(this).attr("data-notify", t);
    });
}

function getCart() {
    let n = getStorage("cart");
    if (n == null) n = { items: [] };
    if (n.items == null) n.items = [];
    n.items = n.items.filter(n => typeof n.productId == "string" && typeof n.qty == "string");
    return n;
}

function inCart(n) {
    let t = getCart();
    const i = t.items.findIndex(t => t.productId === n);
    return i !== -1;
}

function updateAddCartIcons() {
    $(".btn-addwish-b2,js-addcart").each(function() {
        let n = $(this).parent().parent().find(".js-name-b2").html(),
            t = ToSlug(n),
            i = inCart(t);
        updateAddCartIcon($(this), i);
    });
}

function updateAddCartIcon(n, t) {
    let i = n.find(".zmdi");
    if (t) {
        i.removeClass("zmdi-shopping-cart-plus");
        i.addClass("zmdi-shopping-cart");
        n.removeClass("cl4");
        n.addClass("cl1");
    } else {
        i.removeClass("zmdi-shopping-cart");
        i.addClass("zmdi-shopping-cart-plus");
        n.removeClass("cl1");
        n.addClass("cl4");
    }
}

function getNot(n, t) {
    if (n == null || n.length == 0) return "";
    const r = /{([^}]*)}/;
    let i = r.exec(n);
    while (i) {
        const u = i[1],
            f = eval(u, t);
        n = n.slice(0, i.index) + f + n.slice(i.index + i[0].length);
        i = r.exec(n);
    }
    return n;
}

function eval(n, t) {
    let i = [];
    i.discount = t.Discount != null && t.Discount > 0 ? "- " + t.Discount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }) : "";
    i.status = t.Def == true ? productDefStatus : productStatus;
    i.category = normalizeText(t.Category);
    i.subcategory = normalizeText(t.SubCategory);
    const o = /'([^}]*)'/;
    let r = o.exec(n),
        f = 0;
    while (r) {
        f++;
        i["[" + f + "]"] = r[1];
        n = n.slice(0, r.index) + "[" + f + "]" + n.slice(r.index + r[0].length);
        r = o.exec(n);
    }
    const u = n.split("?");
    if (u.length > 1) {
        var e = i[u[0]];
        const n = u[1].split(":");
        if (n.length != 2) return u[1];
        if (e == null || e.length == 0 || e == 0) return i[n[1]];
        return i[n[0]];
    }
    return i[u];
}

// ===== BOTÓN FLOTANTE DE WHATSAPP =====
function prepareWhatsapp() {
    var n = $("<div class='whatsapp-btn'></div>");
    n.html("<img src='images/icons/whatsapp_logo.png' alt='WhatsApp'>");
    n.click(function() {
        if (contactCell != null && contactCell > 0) {
            let n = "";
            if (whatsappMessage != null && whatsappMessage.length > 0) {
                n = "?text=" + encodeURIComponent(whatsappMessage);
            }
            window.open("https://wa.me/+" + contactCell + n, "_blank");
        }
    });
    $("body").append(n);
}

// ===== BOTÓN FLOTANTE DE ADMINISTRACIÓN CON IMAGEN =====
function prepareAdminButton() {
    // Evitar duplicados
    if ($('.admin-floating-btn').length > 0) {
        console.log('✅ Botón de administración ya existe');
        return;
    }

    console.log('🔨 Creando botón flotante de administración con imagen...');

    var $btn = $("<div class='admin-floating-btn'></div>");
    
    // Crear elemento img para la tuerca
    var $imgGear = $("<img>", {
        src: "images/icons/tuerca.png",
        alt: "Panel de Administración",
        style: "width: 32px; height: 32px; display: block;"
    });
    
    // Crear elemento img para el usuario (check) - usaremos un SVG simple como fallback
    var userSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <polyline points="16 11 18 13 22 9"/>
    </svg>`;

    // Guardar referencias
    $btn.data('imgGear', $imgGear);
    $btn.data('userSvg', userSvg);

    // Configuración inicial
    $btn.append($imgGear.clone());
    $btn.attr('title', 'Panel de Administración');

    // Estilos en línea
    $btn.css({
        position: 'fixed',
        bottom: '130px', // Justo encima del botón de WhatsApp
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: 'rgba(113, 127, 224, 0.85)',
        border: '2px solid rgba(255,255,255,0.8)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '10000',
        transition: 'all 0.3s ease',
        textDecoration: 'none',
        opacity: '1',
        visibility: 'visible',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
    });

    // Efecto hover
    $btn.on('mouseenter', function() {
        $(this).css({
            transform: 'scale(1.1)',
            boxShadow: '0 6px 30px rgba(0, 0, 0, 0.4)'
        });
    });
    $btn.on('mouseleave', function() {
        $(this).css({
            transform: 'scale(1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        });
    });

    // Lógica de autenticación
    $btn.on('click', function() {
        if (window.netlifyIdentity) {
            var user = window.netlifyIdentity.currentUser();
            if (user) {
                window.location.href = '/admin/';
            } else {
                window.netlifyIdentity.open('login');
                window.netlifyIdentity.on('login', function() {
                    window.location.href = '/admin/';
                });
            }
        } else {
            window.location.href = '/admin/';
        }
    });

    // Añadir al body
    $('body').append($btn);
    console.log('✅ Botón de administración añadido al DOM');

    // Actualizar estado según la sesión
    function updateAdminButtonState() {
        if (window.netlifyIdentity) {
            var user = window.netlifyIdentity.currentUser();
            if (user) {
                // Sesión abierta: verde translúcido y icono de usuario (SVG)
                $btn.css('backgroundColor', 'rgba(40, 167, 69, 0.85)');
                $btn.empty();
                $btn.append(userSvg);
            } else {
                // Sesión cerrada: azul translúcido y tuerca (imagen)
                $btn.css('backgroundColor', 'rgba(113, 127, 224, 0.85)');
                $btn.empty();
                $btn.append($imgGear.clone());
            }
        }
    }

    if (window.netlifyIdentity) {
        updateAdminButtonState();
        window.netlifyIdentity.on('login', updateAdminButtonState);
        window.netlifyIdentity.on('logout', updateAdminButtonState);
    }
}

var contactCell = "",
    contactEmail = "",
    currency = "USD",
    productStatus = "",
    productDefStatus = "",
    not1Template = "",
    not2Template = "",
    whatsappMessage = "¡Hola! Me interesa saber más sobre tus productos/servicios. ¿Podrías ayudarme?",
    googleAnalyticsId = "";

(function(n) {
    var r = !1;
    n(".animsition").animsition({
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
        transition: function(n) {
            window.location.href = n;
        }
    }).one("animsition.inStart", function() {
        r = true;
    });
    var u = ["categorías", "subcategorías", "características", "detalles", "precios", "imágenes", "combos", "ofertas"],
        i = 0,
        t = 0,
        f = setInterval(function() {
            if (r) clearInterval(f);
            if (i >= u.length) {
                n("#loading-text").text("“La carga está tardando más de lo usual. Por favor, recarga la página.”");
            } else if (t < 100) {
                t++;
                n("#loading-text").text("cargando " + u[i] + ": " + t + "%");
            } else {
                i++;
                t = 0;
            }
        }, 100);
    n(".js-addcart-detail").each(function() {
        n(this).on("click", function(t) {
            t.preventDefault();
            let i = n(this).attr("product-id");
            if (i != null) {
                let r = 1,
                    u = n(this).parent().find('[name="num-product"]');
                if (u != null) r = u.val();
                addToCart(i, n(this).attr("product-label"), r);
            }
        });
    });
    n(".js-show-cart").click(function() {
        window.location.replace("./cart.html");
    });
    window.addEventListener("storage", function(n) {
        if (n.key === "cart") {
            updateCartQty();
            updateAddCartIcons();
        }
    });
    n.getJSON("./data/manifest.json", function(t) {
        if (t != null) {
            let r = splitTitle(t.Title.toUpperCase());
            n(".storet1").text(r[0]);
            n(".storet2").text(r[1]);
            contactCell = t.Cell;
            contactEmail = t.Email;
            currency = t.Currency;
            not1Template = t.Not1;
            not2Template = t.Not2;
            productStatus = t.ProductStatus;
            productDefStatus = t.ProductDefStatus;
            googleAnalyticsId = t.GoogleAnalyticsId;
            if (t.Warranty != null && t.Warranty.length > 0) {
                n("#warrantyText").html(t.Warranty.replace(/\n/g, "<br>"));
            }
            n(".currency").text(currency);
            n(".headnotification").text(t.HeadNotification);
            n(".foot").text(t.Foot);
            if (t.CartPayMethod != null && t.CartPayMethod.length > 0) {
                n(".paymethod").html(t.CartPayMethod.replace(/\n/g, "<br>"));
            }
            if (t.CartShipping != null && t.CartShipping.length > 0) {
                let i = t.CartShipping.replace(/\n/g, "<br>");
                n(".shipping").html(i);
                n("#shippingText").html(i);
            }
            const u = document.styleSheets;
            for (let n = 0; n < u.length; n++) {
                const i = u[n],
                    r = i.cssRules || i.rules;
                for (let n = 0; n < r.length; n++) {
                    const i = r[n];
                    if (i.style && i.style.backgroundColor === "rgb(34, 34, 34)") {
                        i.style.backgroundColor = "rgb(" + t.BackgroundColor + ")";
                    }
                }
            }
            if (googleAnalyticsId != null && googleAnalyticsId.length > 0) {
                var i = document.createElement("script");
                i.src = "https://www.googletagmanager.com/gtag/js?id=" + googleAnalyticsId;
                i.async = true;
                i.onload = function() {
                    window.dataLayer = window.dataLayer || [];
                    window.gtag = function() {
                        dataLayer.push(arguments);
                    };
                    gtag("js", new Date());
                    gtag("config", googleAnalyticsId, { cookie_domain: "auto", cookie_flags: "SameSite=None;Secure" });
                };
                document.head.appendChild(i);
            }
        }
    });
    n("input[name='search-product']").on("visible", function() {
        n(this).focus();
    });
    n(".js-show-search").click(function() {
        setTimeout(function() {
            n("input[name='search-product']").trigger("visible");
        }, 500);
    });
    updateCartQty();
    prepareWhatsapp();
    
    // Esperar un momento para asegurar que el DOM esté listo
    setTimeout(function() {
        prepareAdminButton();
    }, 500);
})(jQuery);

const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
