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
    
    // Determinar rango de capítulos
    var totalEpisodes = parseInt(i.Episodes) || 0;
    var rangeFrom = 1;
    var rangeTo = totalEpisodes;
    var currentPrice = parseFloat(i.Price) || 0;
    
    if (t.range) {
        rangeFrom = parseInt(t.range.from) || 1;
        rangeTo = parseInt(t.range.to) || totalEpisodes;
        if (t.price) {
            currentPrice = parseFloat(t.price) || currentPrice;
        }
    }
    
    // Validar rango
    if (rangeFrom < 1) rangeFrom = 1;
    if (rangeTo > totalEpisodes) rangeTo = totalEpisodes;
    if (rangeFrom > rangeTo) rangeFrom = rangeTo;
    
    e.setAttribute("data-range-from", rangeFrom);
    e.setAttribute("data-range-to", rangeTo);
    e.setAttribute("data-current-price", currentPrice);
    
    // ===== COLUMNA 1: IMAGEN =====
    let r = document.createElement("td");
    r.setAttribute("class", "column-1");
    let u = document.createElement("div");
    u.setAttribute("class", "how-itemcart1");
    u.addEventListener("click", () => removeCartItemFromView(i.slug, $(e)));
    let h = document.createElement("img");
    h.setAttribute("alt", "imagen del artículo");
    h.setAttribute("loading", "lazy");

    // Resolución de imagen
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
    
    // Mostrar nombre con rango
    var displayName = i.Label;
    if (i.Type === 'episode' && totalEpisodes > 1) {
        if (rangeFrom === 1 && rangeTo === totalEpisodes) {
            displayName += ' (Todos los capítulos)';
        } else {
            displayName += ' (Capítulos ' + rangeFrom + '-' + rangeTo + ')';
        }
    }
    aElement.textContent = displayName;
    nameContainer.appendChild(aElement);
    
    // ===== SELECTOR DE CAPÍTULOS (solo si es tipo "episode" y tiene más de 1 episodio) =====
    if (i.Type === 'episode' && totalEpisodes > 1) {
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
        
        // Función para actualizar precio al cambiar rango
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
                if (total > 0) {
                    pricePerEpisode = basePrice / total;
                    totalPrice = count * pricePerEpisode;
                } else {
                    totalPrice = basePrice;
                }
            }
            
            row.find('.cart-episode-count').text(count + ' capítulos');
            
            // Actualizar columnas de precio y total
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
            if (count === total) {
                nameLink.text(label + ' (Todos los capítulos)');
            } else {
                nameLink.text(label + ' (Capítulos ' + from + '-' + to + ')');
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
    r.textContent = toMoneyStr(currentPrice);
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
    let table = $(".table-shopping-cart");
    table.empty();
    
    // Cabecera
    let header = document.createElement("tr");
    header.setAttribute("class", "table_head");
    let th1 = document.createElement("th");
    th1.setAttribute("class", "column-1");
    th1.textContent = "Artículo";
    header.appendChild(th1);
    let th2 = document.createElement("th");
    th2.setAttribute("class", "column-2");
    header.appendChild(th2);
    let th3 = document.createElement("th");
    th3.setAttribute("class", "column-3");
    th3.textContent = "Precio";
    header.appendChild(th3);
    let th4 = document.createElement("th");
    th4.setAttribute("class", "column-4");
    th4.textContent = "Total";
    header.appendChild(th4);
    table.append(header);

    let cart = getCart();
    
    if (!cart.items || cart.items.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.setAttribute("colspan", "4");
        cell.setAttribute("class", "stext-102 cl6 p-t-20 p-b-20 txt-center");
        cell.textContent = "No hay productos en tu cesta";
        row.appendChild(cell);
        table.append(row);
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
    for (let item of cart.items) {
        if (productSlugs[item.productId]) {
            addCartItem(table, item, productSlugs[item.productId]);
        } else {
            itemsNoEncontrados.push(item.productId);
        }
    }
    for (let id of itemsNoEncontrados) {
        removeCartItem(cart, id);
    }

    // Forzar actualización del total
    setTimeout(function() {
        updateCartTotals(false);
    }, 100);
}

function clearCart() {
    let cart = getCart();
    cart.items = [];
    addStorage("cart", cart);
    updateCart();
}

function updateCartTotals(guardarEnStorage = true) {
    let itemsActualizados = { items: [] };
    let totalCUP = 0;
    let hasItems = false;

    $(".table-shopping-cart tbody tr").each(function() {
        let $row = $(this);
        let productId = $row.data('product-id');
        
        // Saltar filas vacías o de mensaje
        if (!productId) return;
        
        hasItems = true;
        
        // Obtener el precio actual desde data-current-price
        let currentPrice = parseFloat($row.data('current-price')) || 0;
        
        // Si no tiene current-price, intentar obtener de la columna de precio
        if (currentPrice === 0) {
            var priceText = $row.find("td:eq(2)").text().replace(/[^0-9.]/g, '');
            currentPrice = parseFloat(priceText) || 0;
            $row.data('current-price', currentPrice);
        }
        
        let subtotal = currentPrice;
        totalCUP += subtotal;
        
        // Actualizar columna total (columna 4, índice 3)
        $row.find("td:eq(3)").text(toMoneyStr(subtotal));
        
        // Obtener rango actual
        let rangeFrom = parseInt($row.data('range-from')) || 1;
        let rangeTo = parseInt($row.data('range-to')) || 0;
        
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

    // Mostrar total
    let totalText = toMoneyStr(totalCUP);
    $("span.mtext-110.cl2").css("white-space", "pre-line").text(totalText);
    
    // Si no hay items, mostrar 0.00
    if (!hasItems) {
        $("span.mtext-110.cl2").css("white-space", "pre-line").text("CUP$ 0.00");
    }

    if (guardarEnStorage) {
        addStorage("cart", itemsActualizados);
    }
}

function removeCartItemFromView(productId, rowElement) {
    let cart = getCart();
    rowElement.remove();
    removeCartItem(cart, productId);
    // Recalcular total después de eliminar
    setTimeout(function() {
        updateCartTotals(false);
    }, 50);
}

function removeCartItem(cart, productId) {
    cart.items = cart.items.filter(function(item) {
        return item.productId !== productId;
    });
    addStorage("cart", cart);
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

    $(".table-shopping-cart tbody tr").each(function() {
        let $row = $(this);
        let productId = $row.data('product-id');
        if (!productId) return;
        
        let nombre = $row.find("td:eq(1) a").text();
        let valorNumerico = parseFloat($row.data('current-price')) || 0;
        
        // Si no tiene current-price, usar el precio de la columna
        if (valorNumerico === 0) {
            var priceText = $row.find("td:eq(2)").text().replace(/[^0-9.]/g, '');
            valorNumerico = parseFloat(priceText) || 0;
        }
        
        let cantidad = 1;
        let subtotal = valorNumerico * cantidad;

        productos.push({ 
            nombre: nombre, 
            cantidad: cantidad, 
            precioUnitario: valorNumerico, 
            subtotal: subtotal 
        });
        totalCUP += subtotal;
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
