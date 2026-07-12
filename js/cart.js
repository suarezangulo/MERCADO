// ===== FUNCIÓN PARA AGREGAR PRODUCTO AL CARRITO (DESDE LA VISTA) =====
function addCartItem(n, t, i) {
    if (n == null || t == null || i == null) return !1;
    let e = document.createElement("tr");
    e.setAttribute("class", "table_row");
    
    // Guardar datos completos del producto en data attributes
    e.setAttribute("data-product-id", i.slug);
    e.setAttribute("data-product-label", i.Label);
    e.setAttribute("data-product-type", i.Type || '');
    e.setAttribute("data-total-episodes", i.Episodes || 0);
    e.setAttribute("data-price-per-episode", i.PricePerEpisode || 0);
    e.setAttribute("data-base-price", i.Price || 0);
    
    if (t.range) {
        e.setAttribute("data-range-from", t.range.from || 1);
        e.setAttribute("data-range-to", t.range.to || i.Episodes || 0);
        e.setAttribute("data-range", JSON.stringify(t.range));
    } else {
        e.setAttribute("data-range-from", 1);
        e.setAttribute("data-range-to", i.Episodes || 0);
    }
    
    if (t.price) {
        e.setAttribute("data-current-price", t.price);
    } else {
        e.setAttribute("data-current-price", i.Price || 0);
    }
    
    let r = document.createElement("td");
    r.setAttribute("class", "column-1");
    let u = document.createElement("div");
    u.setAttribute("class", "how-itemcart1");
    u.addEventListener("click", () => removeCartItemFromView(i.slug, $(e)));
    let h = document.createElement("img");
    h.setAttribute("alt", "imagen del artículo");
    h.setAttribute("loading", "lazy");

    // ===== RESOLUCIÓN DE IMAGEN =====
    var imagesArray = [];
    if (i.Images) {
        if (Array.isArray(i.Images)) {
            imagesArray = i.Images;
        } else {
            imagesArray = i.Images.split(';').map(img => img.trim());
        }
    }
    var firstImage = imagesArray.length > 0 ? imagesArray[0] : null;
    var baseName = firstImage ? firstImage.replace(/\.[^.]+$/, '') : i.slug + "-0";
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

    // ===== COLUMNA 2: NOMBRE + SELECTOR DE CAPÍTULOS =====
    r = document.createElement("td");
    r.setAttribute("class", "column-2");
    
    var nameContainer = document.createElement("div");
    nameContainer.style.display = 'flex';
    nameContainer.style.flexDirection = 'column';
    nameContainer.style.gap = '8px';
    
    var aElement = document.createElement("a");
    aElement.setAttribute("class", "cl2");
    aElement.setAttribute("href", "product.html?id=" + i.slug);
    var displayName = i.Label;
    if (t.range && i.Type === 'episode') {
        displayName += ' (Capítulos ' + t.range.from + '-' + t.range.to + ')';
    }
    aElement.textContent = displayName;
    nameContainer.appendChild(aElement);
    
    // ===== SELECTOR DE CAPÍTULOS (solo si es tipo "episode" y tiene más de 1 episodio) =====
    var totalEpisodes = parseInt(i.Episodes) || 0;
    if (i.Type === 'episode' && totalEpisodes > 1) {
        var rangeFrom = t.range ? parseInt(t.range.from) : 1;
        var rangeTo = t.range ? parseInt(t.range.to) : totalEpisodes;
        
        var episodeSelector = document.createElement("div");
        episodeSelector.className = 'cart-episode-selector';
        episodeSelector.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; background: rgba(255,255,255,0.03); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);';
        
        var labelFrom = document.createElement("span");
        labelFrom.textContent = 'Desde';
        labelFrom.style.cssText = 'color: #888; font-size: 12px;';
        episodeSelector.appendChild(labelFrom);
        
        var inputFrom = document.createElement("input");
        inputFrom.type = 'number';
        inputFrom.min = 1;
        inputFrom.max = totalEpisodes;
        inputFrom.value = rangeFrom;
        inputFrom.className = 'cart-episode-from';
        inputFrom.style.cssText = 'width: 50px; padding: 4px 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; text-align: center; font-size: 13px;';
        episodeSelector.appendChild(inputFrom);
        
        var labelTo = document.createElement("span");
        labelTo.textContent = 'Hasta';
        labelTo.style.cssText = 'color: #888; font-size: 12px;';
        episodeSelector.appendChild(labelTo);
        
        var inputTo = document.createElement("input");
        inputTo.type = 'number';
        inputTo.min = 1;
        inputTo.max = totalEpisodes;
        inputTo.value = rangeTo;
        inputTo.className = 'cart-episode-to';
        inputTo.style.cssText = 'width: 50px; padding: 4px 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; text-align: center; font-size: 13px;';
        episodeSelector.appendChild(inputTo);
        
        var countDisplay = document.createElement("span");
        var count = rangeTo - rangeFrom + 1;
        countDisplay.textContent = count + ' capítulos';
        countDisplay.className = 'cart-episode-count';
        countDisplay.style.cssText = 'color: #1E90FF; font-size: 12px; font-weight: 600; margin-left: 4px;';
        episodeSelector.appendChild(countDisplay);
        
        // Eventos para actualizar precio en tiempo real
        function updateEpisodePrice(row) {
            var from = parseInt(row.find('.cart-episode-from').val()) || 1;
            var to = parseInt(row.find('.cart-episode-to').val()) || 1;
            var total = parseInt(row.data('total-episodes')) || 0;
            
            if (from < 1) from = 1;
            if (to > total) to = total;
            if (from > to) from = to;
            if (to < from) to = from;
            
            row.find('.cart-episode-from').val(from);
            row.find('.cart-episode-to').val(to);
            
            var count = to - from + 1;
            var pricePerEpisode = parseFloat(row.data('price-per-episode')) || 0;
            var totalPrice = count * pricePerEpisode;
            
            // Si no hay precio por episodio, calcular del precio base
            if (pricePerEpisode === 0) {
                var basePrice = parseFloat(row.data('base-price')) || 0;
                pricePerEpisode = basePrice / total;
                totalPrice = count * pricePerEpisode;
            }
            
            row.find('.cart-episode-count').text(count + ' capítulos');
            
            // Actualizar columna de precio y total
            var precioStr = totalPrice.toFixed(2);
            row.find('td:eq(2)').text(toMoneyStr(parseFloat(precioStr)));
            row.find('td:eq(3)').text(toMoneyStr(parseFloat(precioStr)));
            
            // Guardar en data
            row.data('current-price', totalPrice);
            row.data('range-from', from);
            row.data('range-to', to);
            
            // Actualizar el nombre
            var label = row.data('product-label') || '';
            var nameLink = row.find('td:eq(1) a');
            if (count > 0 && count < total) {
                nameLink.text(label + ' (Capítulos ' + from + '-' + to + ')');
            } else if (count === total) {
                nameLink.text(label + ' (Todos los capítulos)');
            } else {
                nameLink.text(label);
            }
            
            // Recalcular total general
            updateCartTotals(false);
        }
        
        inputFrom.addEventListener('change', function() {
            var row = $(this).closest('tr');
            updateEpisodePrice(row);
        });
        
        inputTo.addEventListener('change', function() {
            var row = $(this).closest('tr');
            updateEpisodePrice(row);
        });
        
        nameContainer.appendChild(episodeSelector);
    }
    
    r.appendChild(nameContainer);
    e.appendChild(r);

    // ===== COLUMNA 3: PRECIO =====
    r = document.createElement("td");
    r.setAttribute("class", "column-3");
    var currentPrice = parseFloat(e.getAttribute('data-current-price')) || 0;
    r.textContent = toMoneyStr(currentPrice);
    e.setAttribute("data-current-price", currentPrice);
    e.appendChild(r);

    // ===== COLUMNA 4: TOTAL =====
    r = document.createElement("td");
    r.setAttribute("class", "column-4");
    r.textContent = toMoneyStr(currentPrice);
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
    n.textContent = "Total";
    t.appendChild(n);
    i.append(t);

    let r = getCart();
    
    if (!r.items || r.items.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.setAttribute("colspan", "4");
        cell.setAttribute("class", "stext-102 cl6 p-t-20 p-b-20 txt-center");
        cell.textContent = "No hay productos en tu cesta";
        row.appendChild(cell);
        i.append(row);
        updateCartTotals(false);
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

    updateCartTotals(false);
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

    $(".table-shopping-cart tbody tr").each(function() {
        let $row = $(this);
        
        // Obtener el precio actual (puede venir del selector de capítulos)
        let currentPrice = parseFloat($row.data('current-price')) || 0;
        
        // Si no tiene current-price, usar el precio de la columna
        if (currentPrice === 0) {
            var priceText = $row.find("td:eq(2)").text().replace(/[^0-9.]/g, '');
            currentPrice = parseFloat(priceText) || 0;
        }
        
        let subtotal = currentPrice;
        totalCUP += subtotal;
        
        // Actualizar columna total (columna 4, índice 3)
        $row.find("td:eq(3)").text(toMoneyStr(subtotal));
        
        // Obtener productId
        let productId = $row.data('product-id') || $row.find("td:eq(1) a").attr("href").split("=")[1];
        
        // Obtener rango actualizado
        let rangeFrom = parseInt($row.data('range-from')) || 1;
        let rangeTo = parseInt($row.data('range-to')) || 0;
        let totalEpisodes = parseInt($row.data('total-episodes')) || 0;
        
        let itemData = { 
            productId: productId, 
            qty: "1" 
        };
        
        if (rangeTo > 0 && rangeFrom <= rangeTo) {
            itemData.range = { from: rangeFrom, to: rangeTo };
            itemData.price = currentPrice;
        }
        
        itemsActualizados.items.push(itemData);
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
    updateCartTotals(false);
}

function removeCartItem(n, t) {
    n.items = n.items.filter(function(n) {
        return n.productId !== t;
    });
    addStorage("cart", n);
    updateCartTotals(false);
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

    $(".table-shopping-cart tbody tr").each(function() {
        let $row = $(this);
        let nombre = $row.find("td:eq(1) a").text();
        let valorNumerico = parseFloat($row.data('current-price')) || 0;
        
        // Si no tiene current-price, usar el precio de la columna
        if (valorNumerico === 0) {
            var priceText = $row.find("td:eq(2)").text().replace(/[^0-9.]/g, '');
            valorNumerico = parseFloat(priceText) || 0;
        }
        
        let cantidad = 1;
        let subtotal = valorNumerico * cantidad;

        productos.push({ nombre: nombre, cantidad: cantidad, precioUnitario: valorNumerico, subtotal: subtotal });
        totalCUP += subtotal;
        let slug = $row.data('product-id') || $row.find("td:eq(1) a").attr("href").split("=")[1];
        items.push({ id: slug, name: nombre, quantity: cantidad, price: valorNumerico, currency: 'CUP' });
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
