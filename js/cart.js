// ===== FUNCIÓN PARA AGREGAR PRODUCTO AL CARRITO =====
function addCartItem(container, itemData, productData) {
    if (container == null || itemData == null || productData == null) return false;
    
    var row = document.createElement("tr");
    row.setAttribute("class", "table_row");
    
    // Guardar datos completos del producto en data attributes
    var totalEpisodes = parseInt(productData.Episodes) || 0;
    var basePrice = parseFloat(productData.Price) || 0;
    var pricePerEpisode = parseFloat(productData.PricePerEpisode) || 0;
    
    // Determinar rango de capítulos
    var rangeFrom = 1;
    var rangeTo = totalEpisodes;
    var currentPrice = basePrice;
    
    if (itemData.range) {
        rangeFrom = parseInt(itemData.range.from) || 1;
        rangeTo = parseInt(itemData.range.to) || totalEpisodes;
        if (itemData.price) {
            currentPrice = parseFloat(itemData.price) || basePrice;
        }
    }
    
    // Validar rango
    if (rangeFrom < 1) rangeFrom = 1;
    if (rangeTo > totalEpisodes) rangeTo = totalEpisodes;
    if (rangeFrom > rangeTo) rangeFrom = rangeTo;
    
    // Si es serie y tiene precio por episodio, recalcular
    if (productData.Type === 'episode' && totalEpisodes > 0 && pricePerEpisode > 0) {
        var count = rangeTo - rangeFrom + 1;
        currentPrice = count * pricePerEpisode;
    } else if (productData.Type === 'episode' && totalEpisodes > 0 && pricePerEpisode === 0) {
        // Si no tiene precio por episodio, calcular del precio base
        pricePerEpisode = basePrice / totalEpisodes;
        var count = rangeTo - rangeFrom + 1;
        currentPrice = count * pricePerEpisode;
    }
    
    // Guardar en data attributes
    row.setAttribute("data-product-id", productData.slug);
    row.setAttribute("data-product-label", productData.Label);
    row.setAttribute("data-product-type", productData.Type || '');
    row.setAttribute("data-total-episodes", totalEpisodes);
    row.setAttribute("data-price-per-episode", pricePerEpisode);
    row.setAttribute("data-base-price", basePrice);
    row.setAttribute("data-range-from", rangeFrom);
    row.setAttribute("data-range-to", rangeTo);
    row.setAttribute("data-current-price", currentPrice);
    
    // ===== COLUMNA 1: IMAGEN =====
    var tdImg = document.createElement("td");
    tdImg.setAttribute("class", "column-1");
    
    var imgContainer = document.createElement("div");
    imgContainer.setAttribute("class", "how-itemcart1");
    imgContainer.addEventListener("click", function() {
        removeCartItemFromView(productData.slug, $(row));
    });
    
    var img = document.createElement("img");
    img.setAttribute("alt", "imagen del artículo");
    img.setAttribute("loading", "lazy");
    
    // Resolución de imagen
    var imagesArray = [];
    if (productData.Images) {
        if (Array.isArray(productData.Images)) {
            imagesArray = productData.Images;
        } else {
            imagesArray = productData.Images.split(';').map(function(img) { return img.trim(); });
        }
    }
    var firstImage = imagesArray.length > 0 ? imagesArray[0] : null;
    var baseName = firstImage ? firstImage.replace(/\.[^.]+$/, '') : productData.slug + "-0";
    var extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    
    img.setAttribute("src", getPlaceholderImage(productData.Label));
    resolveImageUrl(baseName, extensions, function(url) {
        if (url) {
            img.setAttribute("src", url);
        }
    });
    
    imgContainer.appendChild(img);
    tdImg.appendChild(imgContainer);
    row.appendChild(tdImg);
    
    // ===== COLUMNA 2: NOMBRE + SELECTOR DE CAPÍTULOS =====
    var tdName = document.createElement("td");
    tdName.setAttribute("class", "column-2");
    
    var nameContainer = document.createElement("div");
    nameContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    
    var nameLink = document.createElement("a");
    nameLink.setAttribute("class", "cl2");
    nameLink.setAttribute("href", "product.html?id=" + productData.slug);
    
    // Mostrar nombre con rango
    var displayName = productData.Label;
    if (productData.Type === 'episode' && totalEpisodes > 1) {
        if (rangeFrom === 1 && rangeTo === totalEpisodes) {
            displayName += ' (Todos los capítulos)';
        } else {
            displayName += ' (Capítulos ' + rangeFrom + '-' + rangeTo + ')';
        }
    }
    nameLink.textContent = displayName;
    nameContainer.appendChild(nameLink);
    
    // ===== SELECTOR DE CAPÍTULOS (solo si es serie y tiene más de 1 episodio) =====
    if (productData.Type === 'episode' && totalEpisodes > 1) {
        var selectorDiv = document.createElement("div");
        selectorDiv.className = 'cart-episode-selector';
        selectorDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; background: rgba(255,255,255,0.03); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);';
        
        var labelFrom = document.createElement("span");
        labelFrom.textContent = 'Desde';
        labelFrom.style.cssText = 'color: #888; font-size: 12px;';
        selectorDiv.appendChild(labelFrom);
        
        var inputFrom = document.createElement("input");
        inputFrom.type = 'number';
        inputFrom.min = 1;
        inputFrom.max = totalEpisodes;
        inputFrom.value = rangeFrom;
        inputFrom.className = 'cart-episode-from';
        inputFrom.style.cssText = 'width: 50px; padding: 4px 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; text-align: center; font-size: 13px;';
        selectorDiv.appendChild(inputFrom);
        
        var labelTo = document.createElement("span");
        labelTo.textContent = 'Hasta';
        labelTo.style.cssText = 'color: #888; font-size: 12px;';
        selectorDiv.appendChild(labelTo);
        
        var inputTo = document.createElement("input");
        inputTo.type = 'number';
        inputTo.min = 1;
        inputTo.max = totalEpisodes;
        inputTo.value = rangeTo;
        inputTo.className = 'cart-episode-to';
        inputTo.style.cssText = 'width: 50px; padding: 4px 6px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; text-align: center; font-size: 13px;';
        selectorDiv.appendChild(inputTo);
        
        var countDisplay = document.createElement("span");
        var count = rangeTo - rangeFrom + 1;
        countDisplay.textContent = count + ' capítulos';
        countDisplay.className = 'cart-episode-count';
        countDisplay.style.cssText = 'color: #1E90FF; font-size: 12px; font-weight: 600; margin-left: 4px;';
        selectorDiv.appendChild(countDisplay);
        
        // Función para actualizar precio al cambiar rango
        function updateEpisodePrice(rowElement) {
            var from = parseInt($(rowElement).find('.cart-episode-from').val()) || 1;
            var to = parseInt($(rowElement).find('.cart-episode-to').val()) || 1;
            var total = parseInt($(rowElement).data('total-episodes')) || 0;
            
            if (from < 1) from = 1;
            if (to > total) to = total;
            if (from > to) from = to;
            if (to < from) to = from;
            
            $(rowElement).find('.cart-episode-from').val(from);
            $(rowElement).find('.cart-episode-to').val(to);
            
            var count = to - from + 1;
            var pricePerEp = parseFloat($(rowElement).data('price-per-episode')) || 0;
            var totalPrice = count * pricePerEp;
            
            // Si no hay precio por episodio, calcular del precio base
            if (pricePerEp === 0) {
                var basePrice = parseFloat($(rowElement).data('base-price')) || 0;
                if (total > 0) {
                    pricePerEp = basePrice / total;
                    totalPrice = count * pricePerEp;
                } else {
                    totalPrice = basePrice;
                }
            }
            
            $(rowElement).find('.cart-episode-count').text(count + ' capítulos');
            
            // Actualizar columnas de precio y total
            var precioStr = totalPrice.toFixed(2);
            $(rowElement).find('td:eq(2)').text(toMoneyStr(parseFloat(precioStr)));
            $(rowElement).find('td:eq(3)').text(toMoneyStr(parseFloat(precioStr)));
            
            // Guardar en data
            $(rowElement).data('current-price', totalPrice);
            $(rowElement).data('range-from', from);
            $(rowElement).data('range-to', to);
            
            // Actualizar el nombre
            var label = $(rowElement).data('product-label') || '';
            var nameLink = $(rowElement).find('td:eq(1) a');
            if (count === total) {
                nameLink.text(label + ' (Todos los capítulos)');
            } else {
                nameLink.text(label + ' (Capítulos ' + from + '-' + to + ')');
            }
            
            // Recalcular total general
            updateCartTotals(false);
        }
        
        // Eventos
        inputFrom.addEventListener('change', function() {
            var rowElement = $(this).closest('tr');
            updateEpisodePrice(rowElement);
        });
        
        inputTo.addEventListener('change', function() {
            var rowElement = $(this).closest('tr');
            updateEpisodePrice(rowElement);
        });
        
        nameContainer.appendChild(selectorDiv);
    }
    
    tdName.appendChild(nameContainer);
    row.appendChild(tdName);
    
    // ===== COLUMNA 3: PRECIO =====
    var tdPrice = document.createElement("td");
    tdPrice.setAttribute("class", "column-3");
    tdPrice.textContent = toMoneyStr(currentPrice);
    row.appendChild(tdPrice);
    
    // ===== COLUMNA 4: TOTAL =====
    var tdTotal = document.createElement("td");
    tdTotal.setAttribute("class", "column-4");
    tdTotal.textContent = toMoneyStr(currentPrice);
    row.appendChild(tdTotal);
    
    container.append(row);
    return true;
}

function cargarProductSlugs(callback) {
    $.getJSON("./data/products-index.json", function(data) {
        if (data != null) {
            productSlugs = [];
            for (var category in data) {
                var subcategories = data[category];
                for (var subcategory in subcategories) {
                    var products = subcategories[subcategory];
                    for (var i = 0; i < products.length; i++) {
                        var product = products[i];
                        var slug = ToSlug(product.Label);
                        product.slug = slug;
                        productSlugs[slug] = product;
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
    var table = $(".table-shopping-cart tbody");
    table.empty();
    
    // Cabecera
    var header = document.createElement("tr");
    header.setAttribute("class", "table_head");
    
    var th1 = document.createElement("th");
    th1.setAttribute("class", "column-1");
    th1.textContent = "Artículo";
    header.appendChild(th1);
    
    var th2 = document.createElement("th");
    th2.setAttribute("class", "column-2");
    header.appendChild(th2);
    
    var th3 = document.createElement("th");
    th3.setAttribute("class", "column-3");
    th3.textContent = "Precio";
    header.appendChild(th3);
    
    var th4 = document.createElement("th");
    th4.setAttribute("class", "column-4");
    th4.textContent = "Total";
    header.appendChild(th4);
    
    table.append(header);
    
    var cart = getCart();
    
    if (!cart.items || cart.items.length === 0) {
        var emptyRow = document.createElement("tr");
        var emptyCell = document.createElement("td");
        emptyCell.setAttribute("colspan", "4");
        emptyCell.setAttribute("class", "stext-102 cl6 p-t-20 p-b-20 txt-center");
        emptyCell.textContent = "No hay productos en tu cesta";
        emptyRow.appendChild(emptyCell);
        table.append(emptyRow);
        updateCartTotals(false);
        return;
    }
    
    if (!productSlugs || Object.keys(productSlugs).length === 0) {
        cargarProductSlugs(function() {
            updateCart();
        });
        return;
    }
    
    var itemsNoEncontrados = [];
    for (var i = 0; i < cart.items.length; i++) {
        var item = cart.items[i];
        if (productSlugs[item.productId]) {
            addCartItem(table, item, productSlugs[item.productId]);
        } else {
            itemsNoEncontrados.push(item.productId);
        }
    }
    
    for (var j = 0; j < itemsNoEncontrados.length; j++) {
        removeCartItem(cart, itemsNoEncontrados[j]);
    }
    
    // Forzar actualización del total después de renderizar
    setTimeout(function() {
        updateCartTotals(true);
    }, 50);
}

function clearCart() {
    var cart = getCart();
    cart.items = [];
    addStorage("cart", cart);
    updateCart();
}

function updateCartTotals(guardarEnStorage) {
    if (guardarEnStorage === undefined) guardarEnStorage = true;
    
    var itemsActualizados = { items: [] };
    var totalCUP = 0;
    var hasItems = false;
    
    $(".table-shopping-cart tbody tr").each(function() {
        var $row = $(this);
        var productId = $row.data('product-id');
        
        // Saltar filas vacías o de mensaje
        if (!productId) return;
        
        hasItems = true;
        
        // Obtener el precio actual
        var currentPrice = parseFloat($row.data('current-price')) || 0;
        
        // Si no tiene current-price, intentar obtener de la columna de precio
        if (currentPrice === 0) {
            var priceText = $row.find("td:eq(2)").text().replace(/[^0-9.]/g, '');
            currentPrice = parseFloat(priceText) || 0;
            $row.data('current-price', currentPrice);
        }
        
        var subtotal = currentPrice;
        totalCUP += subtotal;
        
        // Actualizar columna total (columna 4, índice 3)
        $row.find("td:eq(3)").text(toMoneyStr(subtotal));
        
        // Obtener rango actual
        var rangeFrom = parseInt($row.data('range-from')) || 1;
        var rangeTo = parseInt($row.data('range-to')) || 0;
        
        var itemData = {
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
    var totalText = toMoneyStr(totalCUP);
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
    var cart = getCart();
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
            html = '<div style="line-height: 1.8;">' +
                '<strong>📱 Transfermóvil</strong><br>' +
                'Teléfono: <strong>' + methodData.phone + '</strong><br>' +
                'Banco: <strong>' + (methodData.bank || 'Cualquier banco') + '</strong><br>' +
                (methodData.qrCode ? '<img src="' + methodData.qrCode + '" alt="Código QR Transfermóvil" style="max-width: 150px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px; padding: 5px; background: #fff;">' : '') +
            '</div>';
            break;
        case 'EnZona':
            html = '<div style="line-height: 1.8;">' +
                '<strong>📱 EnZona</strong><br>' +
                'Teléfono: <strong>' + methodData.phone + '</strong><br>' +
                (methodData.qrCode ? '<img src="' + methodData.qrCode + '" alt="Código QR EnZona" style="max-width: 150px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px; padding: 5px; background: #fff;">' : '') +
            '</div>';
            break;
        case 'Efectivo':
            html = '<div style="line-height: 1.8;">' +
                '<strong>💵 Efectivo</strong><br>' +
                '<span style="color: #888; font-size: 12px;">Paga en efectivo al momento de recibir el pedido.</span>' +
            '</div>';
            break;
        default:
            html = '<span style="color: #888;">Selecciona un método de pago</span>';
    }
    
    paymentDetails.html(html);
    paymentInfo.show();
}

function sendOrder() {
    var metodoPago = $('#paymentMethod').val();
    var nombreMetodo = $('#paymentMethod option:selected').text().trim();
    
    var productos = [];
    var totalCUP = 0;
    
    $(".table-shopping-cart tbody tr").each(function() {
        var $row = $(this);
        var productId = $row.data('product-id');
        if (!productId) return;
        
        var nombre = $row.find("td:eq(1) a").text();
        var valorNumerico = parseFloat($row.data('current-price')) || 0;
        
        // Si no tiene current-price, usar el precio de la columna
        if (valorNumerico === 0) {
            var priceText = $row.find("td:eq(2)").text().replace(/[^0-9.]/g, '');
            valorNumerico = parseFloat(priceText) || 0;
        }
        
        var cantidad = 1;
        var subtotal = valorNumerico * cantidad;
        
        productos.push({
            nombre: nombre,
            cantidad: cantidad,
            precioUnitario: valorNumerico,
            subtotal: subtotal
        });
        totalCUP += subtotal;
    });
    
    var mensaje = "📦 *NUEVO PEDIDO*\n------------------------------\n\n";
    if (productos.length > 0) {
        mensaje += "💰 *Productos en CUP*\n";
        for (var i = 0; i < productos.length; i++) {
            var p = productos[i];
            mensaje += "   " + p.cantidad + "x " + p.nombre + " de CUP$ " + p.precioUnitario.toFixed(2) + "  → *CUP$ " + p.subtotal.toFixed(2) + "*\n";
        }
        mensaje += "\n";
    }
    mensaje += "------------------------------\n*RESUMEN DEL PEDIDO*\n💰 Total en CUP: *$ " + totalCUP.toFixed(2) + "*\n\n*Método de pago:* " + nombreMetodo + "\n\n";
    
    var methods = window.paymentMethods || {};
    var methodData = methods[metodoPago];
    if (methodData) {
        var infoPago = '';
        switch(metodoPago) {
            case 'Transfermobil': infoPago = 'Teléfono: ' + methodData.phone + ' | Banco: ' + (methodData.bank || 'Cualquier banco'); break;
            case 'EnZona': infoPago = 'Teléfono: ' + methodData.phone; break;
            case 'Efectivo': infoPago = 'Paga al recibir el pedido.'; break;
        }
        if (infoPago) mensaje += "*Datos para el pago:* " + infoPago + "\n\n";
    }
    
    mensaje += "*Momento del pago:* En el momento de la entrega.\n*Envío:* Acordar al realizar la orden. Las entregas se realizan en el día.\n\n¡Gracias por tu compra!";
    
    var urlWhatsApp = "https://wa.me/+" + contactCell + "?text=" + encodeURIComponent(mensaje);
    window.open(urlWhatsApp);
}

var productSlugs = [];

(function($) {
    "use strict";
    
    $.getJSON("./data/manifest.json", function(data) {
        if (data.PaymentMethods) {
            window.paymentMethods = data.PaymentMethods;
        }
    });
    
    cargarProductSlugs(function() {
        updateCart();
    });
    
    $("button.pointer").on("click", function(e) {
        e.preventDefault();
        sendOrder();
    });
    
    $(".clearcart").on("click", function() {
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
