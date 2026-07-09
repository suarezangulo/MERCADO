// ===== FUNCIÓN PARA AGREGAR PRODUCTO AL CARRITO (DESDE LA VISTA) =====
function addCartItem(n, t, i) {
    if (n == null || t == null || i == null) return !1;
    let e = document.createElement("tr");
    e.setAttribute("class", "table_row");
    let r = document.createElement("td");
    r.setAttribute("class", "column-1");
    let u = document.createElement("div");
    u.setAttribute("class", "how-itemcart1");
    u.addEventListener("click", () => removeCartItemFromView(i.slug, $(e)));
    let h = document.createElement("img");
    h.setAttribute("alt", "imagen del artículo");
    h.setAttribute("loading", "lazy");
    var baseName = i.slug + "-0";
    var extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    h.setAttribute("src", getPlaceholderImage(i.Label));
    resolveImageUrl(baseName, extensions, function(url) {
        if (url) {
            h.setAttribute("src", url);
        }
    });
    u.appendChild(h);
    r.appendChild(u);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-2");
    aElement = document.createElement("a");
    aElement.setAttribute("class", "cl2");
    aElement.setAttribute("href", "product.html?id=" + i.slug);
    // Mostrar el rango de capítulos si existe
    var displayName = i.Label;
    if (t.range) {
        displayName += ' (Capítulos ' + t.range.from + '-' + t.range.to + ')';
    }
    aElement.textContent = displayName;
    r.appendChild(aElement);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-3");
    // Usar el precio calculado si existe, sino el precio base
    var precioStr = t.price ? t.price : i.Price;
    var valorNumerico = parseFloat(precioStr) || 0;
    r.textContent = toMoneyStr(valorNumerico);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-4");
    u = document.createElement("div");
    u.setAttribute("class", "wrap-num-product flex-w m-l-auto m-r-0");
    let o = document.createElement("div");
    o.setAttribute("class", "btn-num-product-down cl8 hov-btn3 trans-04 flex-c-m");
    let s = document.createElement("i");
    s.setAttribute("class", "fs-16 zmdi zmdi-minus");
    o.appendChild(s);
    u.appendChild(o);
    let f = document.createElement("input");
    f.setAttribute("class", "mtext-104 cl3 txt-center num-product");
    f.setAttribute("type", "number");
    f.setAttribute("name", "num-" + i.slug);
    f.setAttribute("value", t.qty);
    f.setAttribute("min", 0);
    f.setAttribute("max", 99);
    f.setAttribute("price", precioStr);
    f.setAttribute("label", displayName);
    // Guardar el rango en el atributo data-range para usarlo al actualizar
    if (t.range) {
        f.setAttribute("data-range", JSON.stringify(t.range));
    }
    f.addEventListener("input", () => updateCartTotals());
    u.appendChild(f);
    o = document.createElement("div");
    o.setAttribute("class", "btn-num-product-up cl8 hov-btn3 trans-04 flex-c-m");
    s = document.createElement("i");
    s.setAttribute("class", "fs-16 zmdi zmdi-plus");
    o.appendChild(s);
    u.appendChild(o);
    r.appendChild(u);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-5");
    let subtotal = valorNumerico * t.qty;
    r.textContent = toMoneyStr(subtotal);
    e.appendChild(r);
    n.append(e);
    return !0;
}

function cargarProductSlugs(callback) {
    $.getJSON("./data/products-index.json", function(t) {
        if (t != null) {
            productSlugs = [];
            for (let n in t) {
                let i = t[n];
                for (let n in i) {
                    let t = i[n];
                    for (let n of t) {
                        let slug = ToSlug(n.Label);
                        n.slug = slug;
                        productSlugs[slug] = n;
                    }
                }
            }
            if (callback) callback();
        }
    }).fail(function() {
        setTimeout(function() {
            cargarProductSlugs(callback);
        }, 2000);
    });
}

function updateCart() {
    let i = $(".table-shopping-cart");
    i.empty();
    
    let t = document.createElement("tr");
    t.setAttribute("class", "table_head");
    let n = document.createElement("th");
    n.setAttribute("class", "column-1");
    n.textContent = "Artículo";
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-2");
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-3");
    n.textContent = "Precio";
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-4");
    n.textContent = "Cantidad";
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-5");
    n.textContent = "Total";
    t.appendChild(n);
    i.append(t);

    let r = getCart();
    
    if (!r.items || r.items.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.setAttribute("colspan", "5");
        cell.setAttribute("class", "stext-102 cl6 p-t-20 p-b-20 txt-center");
        cell.textContent = "No hay productos en tu cesta";
        row.appendChild(cell);
        i.append(row);
        updateCartTotals(!1);
        return;
    }

    if (!productSlugs || Object.keys(productSlugs).length === 0) {
        cargarProductSlugs(function() {
            updateCart();
        });
        return;
    }

    let itemsNoEncontrados = [];
    for (let item of r.items) {
        if (productSlugs[item.productId]) {
            addCartItem(i, item, productSlugs[item.productId]);
        } else {
            itemsNoEncontrados.push(item.productId);
        }
    }
    for (let id of itemsNoEncontrados) {
        removeCartItem(r, id);
    }

    $(".btn-num-product-down").on("click", function() {
        let input = $(this).next();
        var val = Number(input.val());
        if (val > 0) {
            input.val(val - 1).change();
            updateCartTotals();
        }
    });
    $(".btn-num-product-up").on("click", function() {
        let input = $(this).prev();
        var val = Number(input.val());
        if (val < 99) {
            input.val(val + 1).change();
            updateCartTotals();
        }
    });
    updateCartTotals(!1);
}

function clearCart() {
    let n = getCart();
    n.items = [];
    addStorage("cart", n);
    updateCart();
}

function updateCartTotals(guardarEnStorage = true) {
    let itemsActualizados = { items: [] };
    let totalCUP = 0;

    $(".num-product").each(function(index, elemento) {
        let productId = $(elemento).attr("name").substring(4);
        let cantidad = parseFloat($(elemento).val()) || 0;
        let precioStr = $(elemento).attr("price");
        let valorNumerico = parseFloat(precioStr) || 0;
        let subtotalOriginal = valorNumerico * cantidad;

        totalCUP += subtotalOriginal;

        // Guardar el rango si existe
        let rangeAttr = $(elemento).attr("data-range");
        let itemData = { productId: productId, qty: cantidad };
        if (rangeAttr) {
            itemData.range = JSON.parse(rangeAttr);
            itemData.price = valorNumerico;
        }
        itemsActualizados.items.push(itemData);

        let celdaTotalProducto = $(this).parent().parent().next();
        celdaTotalProducto.text(toMoneyStr(subtotalOriginal));
    });

    let totalText = toMoneyStr(totalCUP);
    $("span.mtext-110.cl2").css("white-space", "pre-line").text(totalText);

    if (guardarEnStorage) {
        addStorage("cart", itemsActualizados);
    }
}

function removeCartItemFromView(n, t) {
    let i = getCart();
    t.remove();
    removeCartItem(i, n);
}

function removeCartItem(n, t) {
    n.items = n.items.filter(function(n) {
        return n.productId !== t;
    });
    addStorage("cart", n);
    updateCartTotals(!1);
}

function mostrarInfoPago(metodo) {
    var paymentInfo = $('#paymentInfo');
    var paymentDetails = $('#paymentDetails');
    
    var methods = window.paymentMethods || {};
    var methodData = methods[metodo];
    
    if (!methodData) {
        paymentInfo.hide();
        return;
    }
    
    var html = '';
    switch(metodo) {
        case 'Transfermobil':
            html = `<div style="line-height: 1.8;">
                <strong>📱 Transfermóvil</strong><br>
                Teléfono: <strong>${methodData.phone}</strong><br>
                Banco: <strong>${methodData.bank || 'Cualquier banco'}</strong><br>
                ${methodData.qrCode ? `<img src="${methodData.qrCode}" alt="Código QR Transfermóvil" style="max-width: 150px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px; padding: 5px; background: #fff;">` : ''}
            </div>`;
            break;
        case 'EnZona':
            html = `<div style="line-height: 1.8;">
                <strong>📱 EnZona</strong><br>
                Teléfono: <strong>${methodData.phone}</strong><br>
                ${methodData.qrCode ? `<img src="${methodData.qrCode}" alt="Código QR EnZona" style="max-width: 150px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px; padding: 5px; background: #fff;">` : ''}
            </div>`;
            break;
        case 'Efectivo':
            html = `<div style="line-height: 1.8;">
                <strong>💵 Efectivo</strong><br>
                <span style="color: #888; font-size: 12px;">Paga en efectivo al momento de recibir el pedido.</span>
            </div>`;
            break;
        default:
            html = `<span style="color: #888;">Selecciona un método de pago</span>`;
    }
    
    paymentDetails.html(html);
    paymentInfo.show();
}

function sendOrder() {
    var metodoPago = $('#paymentMethod').val();
    var nombreMetodo = $('#paymentMethod option:selected').text().trim();
    
    let productos = [];
    let totalCUP = 0;
    let items = [];

    $(".num-product").each(function(index, elemento) {
        let nombre = $(elemento).attr("label");
        let cantidad = parseFloat($(elemento).val());
        if (cantidad > 0) {
            let precioStr = $(elemento).attr("price");
            let valorNumerico = parseFloat(precioStr) || 0;
            let subtotal = valorNumerico * cantidad;

            productos.push({ nombre: nombre, cantidad: cantidad, precioUnitario: valorNumerico, subtotal: subtotal });
            totalCUP += subtotal;
            let slug = $(elemento).attr("name").substring(4);
            items.push({ id: slug, name: nombre, quantity: cantidad, price: valorNumerico, currency: 'CUP' });
        }
    });

    let mensaje = "📦 *NUEVO PEDIDO*\n------------------------------\n\n";
    if (productos.length > 0) {
        mensaje += "💰 *Productos en CUP*\n";
        productos.forEach(function(p) {
            mensaje += "   " + p.cantidad + "x " + p.nombre + " de CUP$ " + p.precioUnitario.toFixed(2) + "  → *CUP$ " + p.subtotal.toFixed(2) + "*\n";
        });
        mensaje += "\n";
    }
    mensaje += "------------------------------\n*RESUMEN DEL PEDIDO*\n💰 Total en CUP: *$ " + totalCUP.toFixed(2) + "*\n\n*Método de pago:* " + nombreMetodo + "\n\n";

    var methods = window.paymentMethods || {};
    var methodData = methods[metodoPago];
    if (methodData) {
        var infoPago = '';
        switch(metodoPago) {
            case 'Transfermobil': infoPago = `Teléfono: ${methodData.phone} | Banco: ${methodData.bank || 'Cualquier banco'}`; break;
            case 'EnZona': infoPago = `Teléfono: ${methodData.phone}`; break;
            case 'Efectivo': infoPago = `Paga al recibir el pedido.`; break;
        }
        if (infoPago) mensaje += "*Datos para el pago:* " + infoPago + "\n\n";
    }

    mensaje += "*Momento del pago:* En el momento de la entrega.\n*Envío:* Acordar al realizar la orden. Las entregas se realizan en el día.\n\n¡Gracias por tu compra!";

    let urlWhatsApp = "https://wa.me/+" + contactCell + "?text=" + encodeURIComponent(mensaje);
    window.open(urlWhatsApp);
}

var productSlugs = [];

(function(n) {
    "use strict";
    
    $.getJSON("./data/manifest.json", function(data) {
        if (data.PaymentMethods) {
            window.paymentMethods = data.PaymentMethods;
        }
    });
    
    cargarProductSlugs(function() {
        updateCart();
    });

    n("button.pointer").on("click", function(e) {
        e.preventDefault();
        sendOrder();
    });

    n(".clearcart").on("click", function() {
        clearCart();
    });

    window.addEventListener("storage", function(e) {
        if (e.key === "cart") {
            if (productSlugs && Object.keys(productSlugs).length > 0) {
                updateCart();
            } else {
                cargarProductSlugs(function() {
                    updateCart();
                });
            }
        }
    });
    
    $(document).ready(function() {
        $('#paymentMethod').on('change', function() {
            mostrarInfoPago($(this).val());
        });
        var metodoInicial = $('#paymentMethod').val();
        if (metodoInicial) mostrarInfoPago(metodoInicial);
    });
})(jQuery);
