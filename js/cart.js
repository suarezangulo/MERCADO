// ===== FUNCIÓN AUXILIAR: convertir valor a moneda preferida =====
function convertirAMonedaPreferida(valor, monedaOriginal) {
    var monedaPref = getMonedaPreferida();
    var tasa = typeof TASA_CAMBIO !== 'undefined' ? TASA_CAMBIO : 685;
    var resultado;
    if (monedaOriginal === monedaPref) {
        resultado = valor;
    } else if (monedaOriginal === 'CUP' && monedaPref === 'USD') {
        resultado = valor / tasa;
    } else if (monedaOriginal === 'USD' && monedaPref === 'CUP') {
        resultado = valor * tasa;
    } else {
        resultado = valor;
    }
    return resultado;
}

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
    h.setAttribute("src", "./images/products/" + i.slug + "-0.webp");
    h.setAttribute("alt", "imagen del artículo");
    h.setAttribute("loading", "lazy");
    u.appendChild(h);
    r.appendChild(u);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-2");
    aElement = document.createElement("a");
    aElement.setAttribute("class", "cl3");
    aElement.setAttribute("href", "product.html?id=" + i.slug);
    aElement.textContent = i.Label;
    r.appendChild(aElement);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-3");
    let partesPrecio = i.Price.split(' ');
    let valorPrecio = parseFloat(partesPrecio[0]);
    let monedaOriginal = partesPrecio[1] || 'USD';
    let valorConvertido = convertirAMonedaPreferida(valorPrecio, monedaOriginal);
    r.textContent = toMoneyStr(valorConvertido);
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
    f.setAttribute("price", i.Price);
    f.setAttribute("label", i.Label);
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
    let subtotalOriginal = valorPrecio * t.qty;
    let subtotalConvertido = convertirAMonedaPreferida(subtotalOriginal, monedaOriginal);
    r.textContent = toMoneyStr(subtotalConvertido);
    e.appendChild(r);
    n.append(e);
    return !0;
}

function cargarProductSlugs(callback) {
    console.log('Cargando productSlugs...');
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
            console.log('productSlugs cargado:', Object.keys(productSlugs).length, 'productos');
            if (callback) callback();
        } else {
            console.error('Error: products-index.json no encontrado');
        }
    }).fail(function() {
        console.error('Error al cargar products-index.json');
        setTimeout(function() {
            cargarProductSlugs(callback);
        }, 2000);
    });
}

function updateCart() {
    console.log('updateCart ejecutado');
    let i = $(".table-shopping-cart");
    i.empty();
    
    let t = document.createElement("tr");
    t.setAttribute("class", "table_head");
    let n = document.createElement("th");
    n.setAttribute("class", "column-1");
    n.textContent = spanishFormat("Articulo");
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
    console.log('Items en carrito:', r.items);
    
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
        console.log('productSlugs vacío, cargando...');
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
            console.warn('Producto no encontrado:', item.productId);
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
    let totalUSD = 0;

    $(".num-product").each(function(index, elemento) {
        let productId = $(elemento).attr("name").substring(4);
        let cantidad = parseFloat($(elemento).val()) || 0;
        let precioStr = $(elemento).attr("price");
        let partes = precioStr.split(' ');
        let valorNumerico = parseFloat(partes[0]);
        let moneda = partes[1] || 'USD';
        let subtotalOriginal = valorNumerico * cantidad;

        if (moneda === 'CUP') {
            totalCUP += subtotalOriginal;
        } else {
            totalUSD += subtotalOriginal;
        }

        itemsActualizados.items.push({ productId: productId, qty: cantidad });
        let celdaTotalProducto = $(this).parent().parent().next();
        let subtotalConvertido = convertirAMonedaPreferida(subtotalOriginal, moneda);
        celdaTotalProducto.text(toMoneyStr(subtotalConvertido));
    });

    let monedaPref = getMonedaPreferida();
    let tasa = typeof TASA_CAMBIO !== 'undefined' ? TASA_CAMBIO : 685;
    
    let totalGeneralConvertido = 0;
    if (monedaPref === 'CUP') {
        totalGeneralConvertido = totalCUP + (totalUSD * tasa);
    } else {
        totalGeneralConvertido = totalUSD + (totalCUP / tasa);
    }

    let totalText = toMoneyStr(totalGeneralConvertido, monedaPref);
    
    let otraMoneda = monedaPref === 'CUP' ? 'USD' : 'CUP';
    let totalEquivalente;
    if (monedaPref === 'CUP') {
        totalEquivalente = totalGeneralConvertido / tasa;
    } else {
        totalEquivalente = totalGeneralConvertido * tasa;
    }
    
    if (totalEquivalente > 0) {
        totalText += '\n≈ ' + toMoneyStr(totalEquivalente, otraMoneda);
    }

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

// ===== MOSTRAR INFORMACIÓN DE PAGO SEGÚN MÉTODO SELECCIONADO =====
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
                <span style="color: #888; font-size: 12px; display: block; margin-top: 5px;">Escanea el código QR para pagar por Transfermóvil.</span>
            </div>`;
            break;
        case 'EnZona':
            html = `<div style="line-height: 1.8;">
                <strong>📱 EnZona</strong><br>
                Teléfono: <strong>${methodData.phone}</strong><br>
                ${methodData.qrCode ? `<img src="${methodData.qrCode}" alt="Código QR EnZona" style="max-width: 150px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px; padding: 5px; background: #fff;">` : ''}
                <span style="color: #888; font-size: 12px; display: block; margin-top: 5px;">Escanea el código QR o paga con el número de teléfono.</span>
            </div>`;
            break;
        case 'Zelle':
            html = `<div style="line-height: 1.8;">
                <strong>💳 Zelle</strong><br>
                Email: <strong>${methodData.email}</strong><br>
                Teléfono: <strong>${methodData.phone}</strong><br>
                <span style="color: #888; font-size: 12px;">Envía el pago por Zelle y confirma por WhatsApp.</span>
            </div>`;
            break;
        case 'PayPal':
            html = `<div style="line-height: 1.8;">
                <strong>💳 PayPal</strong><br>
                Email: <strong>${methodData.email}</strong><br>
                <span style="color: #888; font-size: 12px;">Envía el pago por PayPal y confirma por WhatsApp.</span>
            </div>`;
            break;
        case 'CashApp':
            html = `<div style="line-height: 1.8;">
                <strong>💳 CashApp</strong><br>
                Tag: <strong>${methodData.tag}</strong><br>
                <span style="color: #888; font-size: 12px;">Envía el pago por CashApp y confirma por WhatsApp.</span>
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

// ===== FUNCIÓN MODIFICADA: Envía pedido con método de pago =====
function sendOrder() {
    var metodoPago = $('#paymentMethod').val();
    var nombreMetodo = $('#paymentMethod option:selected').text().trim();
    
    let productosCUP = [];
    let productosUSD = [];
    let totalCUP = 0;
    let totalUSD = 0;
    let items = [];

    $(".num-product").each(function(index, elemento) {
        let nombre = $(elemento).attr("label");
        let cantidad = parseFloat($(elemento).val());
        if (cantidad > 0) {
            let precioStr = $(elemento).attr("price");
            let partes = precioStr.split(' ');
            let valorNumerico = parseFloat(partes[0]);
            let moneda = partes[1] || 'USD';
            let subtotal = valorNumerico * cantidad;

            let producto = {
                nombre: nombre,
                cantidad: cantidad,
                precioUnitario: valorNumerico,
                subtotal: subtotal
            };

            if (moneda === 'CUP') {
                productosCUP.push(producto);
                totalCUP += subtotal;
            } else {
                productosUSD.push(producto);
                totalUSD += subtotal;
            }

            items.push({
                id: ToSlug(nombre),
                name: nombre,
                quantity: cantidad,
                price: valorNumerico,
                currency: moneda
            });
        }
    });

    let mensaje = "📦 *NUEVO PEDIDO*\n";
    mensaje += "------------------------------\n\n";

    if (productosCUP.length > 0) {
        mensaje += "💰 *Productos en CUP*\n";
        productosCUP.forEach(function(p) {
            let subtotalStr = 'CUP$ ' + p.subtotal.toFixed(2);
            mensaje += "   " + p.cantidad + "x " + p.nombre + " de CUP$ " + p.precioUnitario.toFixed(2) + "  → *" + subtotalStr + "*\n";
        });
        mensaje += "\n";
    }

    if (productosUSD.length > 0) {
        mensaje += "💵 *Productos en USD*\n";
        productosUSD.forEach(function(p) {
            let subtotalStr = 'USD$ ' + p.subtotal.toFixed(2);
            mensaje += "   " + p.cantidad + "x " + p.nombre + " de USD$ " + p.precioUnitario.toFixed(2) + " → *" + subtotalStr + "*\n";
        });
        mensaje += "\n";
    }

    mensaje += "------------------------------\n";
    mensaje += "*RESUMEN DEL PEDIDO*\n";
    if (totalCUP > 0) {
        mensaje += "💰 Total en CUP: *$ " + totalCUP.toFixed(2) + "*\n";
    }
    if (totalUSD > 0) {
        mensaje += "💵 Total en USD: *$ " + totalUSD.toFixed(2) + "*\n";
    }
    mensaje += "\n";

    mensaje += "*Método de pago:* " + nombreMetodo + "\n\n";

    var methods = window.paymentMethods || {};
    var methodData = methods[metodoPago];
    if (methodData) {
        var infoPago = '';
        switch(metodoPago) {
            case 'Transfermobil':
                infoPago = `Teléfono: ${methodData.phone} | Banco: ${methodData.bank || 'Cualquier banco'}`;
                break;
            case 'EnZona':
                infoPago = `Teléfono: ${methodData.phone}`;
                break;
            case 'Zelle':
                infoPago = `Email: ${methodData.email} | Teléfono: ${methodData.phone}`;
                break;
            case 'PayPal':
                infoPago = `Email: ${methodData.email}`;
                break;
            case 'CashApp':
                infoPago = `Tag: ${methodData.tag}`;
                break;
            case 'Efectivo':
                infoPago = `Paga al recibir el pedido.`;
                break;
        }
        if (infoPago) {
            mensaje += "*Datos para el pago:* " + infoPago + "\n\n";
        }
    }

    mensaje += "*Momento del pago:* En el momento de la entrega.\n";
    mensaje += "*Envío:* Acordar al realizar la orden. Las entregas se realizan en el día.\n\n";
    mensaje += "¡Gracias por tu compra!";

    let urlWhatsApp = "https://wa.me/+" + contactCell + "?text=" + encodeURIComponent(mensaje);
    window.open(urlWhatsApp);

    if (googleAnalyticsId != null && googleAnalyticsId.length > 0 && items.length > 0) {
        const TASA_CAMBIO_GA = 24;
        let totalGeneralUSD = totalUSD + (totalCUP / TASA_CAMBIO_GA);
        gtag("event", "purchase", {
            transaction_id: "trans_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            value: totalGeneralUSD,
            currency: "USD",
            items: items
        });
    }
}

var productSlugs = [];

// ===== INICIALIZACIÓN =====
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
            var metodo = $(this).val();
            mostrarInfoPago(metodo);
        });
        
        var metodoInicial = $('#paymentMethod').val();
        if (metodoInicial) {
            mostrarInfoPago(metodoInicial);
        }
    });
})(jQuery);
