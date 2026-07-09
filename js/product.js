function buildBreadCrumb(n) {
    $container = $(".bread-crumb");
    $container.empty();
    var list = document.createElement("ul");
    list.setAttribute("class", "breadcrumb-list flex-w flex-m");
    addBreadCrumbItem(list, "Inicio", "./", false);
    if (n.Category) {
        let catUrl = "./?category=" + normalizeText(n.Category);
        addBreadCrumbItem(list, n.Category, catUrl, false);
    }
    if (n.SubCategory && n.SubCategory.length > 0) {
        let subUrl = "./?category=" + normalizeText(n.Category) + "&subcategory=" + normalizeText(n.SubCategory);
        addBreadCrumbItem(list, n.SubCategory, subUrl, false);
    }
    addBreadCrumbItem(list, n.Label, null, true);
    $container.append(list);
}

function addBreadCrumbItem(container, label, url, active) {
    var li = document.createElement("li");
    li.setAttribute("class", "breadcrumb-item");
    if (active) {
        var span = document.createElement("span");
        span.setAttribute("class", "breadcrumb-btn active");
        span.textContent = spanishFormat(label);
        li.appendChild(span);
    } else {
        var a = document.createElement("a");
        a.setAttribute("href", url);
        a.setAttribute("class", "breadcrumb-btn");
        a.textContent = spanishFormat(label);
        li.appendChild(a);
        var sep = document.createElement("span");
        sep.setAttribute("class", "breadcrumb-sep");
        sep.innerHTML = '<i class="fa fa-chevron-right"></i>';
        li.appendChild(sep);
    }
    container.appendChild(li);
}

function buildGallery(n) {
    var $galleryRow = $("#galleryRow");
    $galleryRow.empty();
    
    var imagesToProcess = [];
    if (n.Images && n.Images.length > 0) {
        imagesToProcess = n.Images;
    } else {
        var slug = ToSlug(n.Label);
        imagesToProcess = [slug + "-0.webp"];
    }
    
    var foundAny = false;
    var totalProcessed = 0;
    var resolvedUrls = [];
    
    imagesToProcess.forEach(function(imgName, idx) {
        var baseName = imgName.replace(/\.[^.]+$/, '');
        var extensions = ['webp', 'jpg', 'jpeg', 'png'];
        var csvExt = imgName.includes('.') ? imgName.split('.').pop().toLowerCase() : 'webp';
        var orderedExtensions = [csvExt].concat(extensions.filter(function(ext) { return ext !== csvExt; }));
        
        resolveImageUrl(baseName, orderedExtensions, function(url) {
            totalProcessed++;
            
            if (url) {
                foundAny = true;
                resolvedUrls.push(url);
                
                var galleryItem = document.createElement("div");
                galleryItem.setAttribute("class", "gallery-item");
                galleryItem.setAttribute("data-index", idx);
                var img = document.createElement("img");
                img.setAttribute("src", url);
                img.setAttribute("alt", n.Label + " - Imagen " + (idx + 1));
                img.setAttribute("loading", "lazy");
                img.onerror = function() { this.style.display = 'none'; };
                galleryItem.appendChild(img);
                
                $(galleryItem).on('click', function() {
                    var items = resolvedUrls.map(function(resolvedUrl) {
                        return { src: resolvedUrl };
                    });
                    $.magnificPopup.open({
                        items: items,
                        gallery: { enabled: true, navigateByImgClick: true, preload: [1, 1] },
                        type: 'image',
                        mainClass: 'mfp-fade',
                        removalDelay: 300
                    });
                });
                
                $galleryRow.append(galleryItem);
                
                if (idx === 0) {
                    $("#productHero").css("background-image", "url('" + url + "')");
                }
            }
            
            if (totalProcessed >= imagesToProcess.length && !foundAny) {
                var placeholder = getPlaceholderImage(n.Label);
                resolvedUrls.push(placeholder);
                $("#productHero").css("background-image", "url('" + placeholder + "')");
                
                var galleryItem = document.createElement("div");
                galleryItem.setAttribute("class", "gallery-item");
                var img = document.createElement("img");
                img.setAttribute("src", placeholder);
                img.setAttribute("alt", n.Label);
                galleryItem.appendChild(img);
                
                $(galleryItem).on('click', function() {
                    $.magnificPopup.open({
                        items: [{ src: placeholder }],
                        type: 'image',
                        mainClass: 'mfp-fade'
                    });
                });
                
                $galleryRow.append(galleryItem);
            }
        });
    });
}

function buildDetailsGrid(n) {
    var $grid = $("#detailsGrid");
    $grid.empty();
    
    var details = [];
    if (n.Features && n.Features.length > 0) {
        n.Features.forEach(function(feature) {
            var parts = feature.split(':');
            if (parts.length >= 2) {
                details.push({ label: parts[0].trim(), value: parts.slice(1).join(':').trim() });
            }
        });
    }
    details.push({ label: 'Precio', value: n.Price || '0.00 CUP' });
    // Mostrar precio por capítulo si existe
    if (n.PricePerEpisode) {
        details.push({ label: 'Precio por capítulo', value: n.PricePerEpisode });
    }
    details.push({ label: 'Categoría', value: n.Category + ' / ' + n.SubCategory });
    
    details.forEach(function(detail) {
        var item = document.createElement("div");
        item.setAttribute("class", "detail-item");
        item.innerHTML = '<h4>' + detail.label + '</h4><p>' + detail.value + '</p>';
        $grid.append(item);
    });
}

function buildFeatures(product) {
    const featuresContainer = $(".product-features");
    if (!featuresContainer.length) return;
    if (!product.Features || product.Features.length === 0) {
        featuresContainer.html('<p class="stext-102 cl6">Sin características.</p>');
        return;
    }
    let html = '<ul class="features-list" style="list-style: none; padding-left: 0; margin: 0;">';
    product.Features.forEach(function(feature) {
        html += '<li style="padding: 4px 0; list-style: disc; margin-left: 20px; font-family: Poppins-Regular; font-size: 14px; color: #ccc;">' + feature + '</li>';
    });
    html += '</ul>';
    featuresContainer.html(html);
}

function buildRelatedProducts(n) {
    if (n != null && n.Category != null && n.Category.length != 0 && n.SubCategory != null && n.SubCategory.length != 0) {
        $.getJSON("./data/products-index.json", function(t) {
            if (t != null) {
                let r = t[n.Category];
                if (r != null) {
                    let i = r[n.SubCategory];
                    if (i != null) {
                        i = getCiclon(i, n.Label);
                        if (i.length > 0) {
                            $container = $(".slick2");
                            i.forEach(function(t) {
                                t.Category = n.Category;
                                t.SubCategory = n.SubCategory;
                                addProductCardBase($container, t, "", 2);
                            });
                            $.getScript("./js/slick-custom.js", function() {});
                            var u = new LazyLoad({ elements_selector: "img[data-src]" });
                        } else {
                            $(".sec-relate-product").hide();
                        }
                    }
                }
            }
        });
    }
}

function getCiclon(n, t) {
    const u = [];
    if (n == null || n.length == 0) return u;
    let r = n.sort((n, t) => n.Price - t.Price),
        i = r.findIndex(n => n.Label === t);
    if (i < 0) return r;
    r.splice(i, 1);
    if (r.length === 0) return u;
    let f = -1, e = 12;
    while (r.length > 0 && e > 0) {
        i >= r.length ? i = r.length - 1 : i < 0 && (i = 0);
        u.push(r[i]);
        r.splice(i, 1);
        if (f == -1) i--;
        f *= -1;
        e--;
    }
    return u;
}

// ===== FUNCIÓN PARA CREAR EL SELECTOR DE CAPÍTULOS =====
function buildEpisodeSelector(product) {
    // Si no tiene capítulos, no hacemos nada
    if (!product.Type || product.Type !== 'episode') {
        // Ocultar el contenedor si existe
        $('#episodeSelectorContainer').hide();
        return;
    }

    const totalEpisodes = product.Episodes || 0;
    if (totalEpisodes <= 1) {
        $('#episodeSelectorContainer').hide();
        return;
    }

    // Obtener precio por capítulo: si existe PricePerEpisode, usarlo; si no, calcularlo
    let pricePerEpisode = 0;
    if (product.PricePerEpisode) {
        pricePerEpisode = parseFloat(product.PricePerEpisode) || 0;
    } else {
        // Si no hay precio por capítulo definido, calcularlo del precio total
        const totalPrice = parseFloat(product.Price) || 0;
        pricePerEpisode = totalPrice / totalEpisodes;
        // Redondear a 2 decimales
        pricePerEpisode = Math.round(pricePerEpisode * 100) / 100;
    }

    // Guardar precio por capítulo en el producto para usarlo luego
    product._pricePerEpisode = pricePerEpisode;

    // Crear el HTML del selector
    const container = $('#episodeSelectorContainer');
    container.show();
    container.html(`
        <div style="background: var(--mica-card); backdrop-filter: blur(16px); border-radius: var(--radius-lg); padding: 20px; border: 1px solid var(--border-mica); margin-top: 20px;">
            <h4 style="color: #fff; margin-bottom: 12px; font-weight: 600;">Seleccionar capítulos</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                <button id="selectAllEpisodes" class="mica-btn mica-btn-primary" style="padding: 6px 16px; font-size: 13px;">Todos</button>
                <span style="color: var(--text-secondary);">Desde</span>
                <input type="number" id="episodeFrom" value="1" min="1" max="${totalEpisodes}" style="width: 60px; padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-mica); border-radius: 6px; color: #fff; text-align: center;">
                <span style="color: var(--text-secondary);">Hasta</span>
                <input type="number" id="episodeTo" value="${totalEpisodes}" min="1" max="${totalEpisodes}" style="width: 60px; padding: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-mica); border-radius: 6px; color: #fff; text-align: center;">
                <span style="color: var(--text-secondary); margin-left: 8px;">Total: <span id="episodeCountDisplay" style="font-weight: 600; color: #fff;">${totalEpisodes}</span> capítulos</span>
                <span style="color: var(--text-secondary); margin-left: 8px;">Precio: <span id="episodePriceDisplay" style="font-weight: 700; color: var(--accent-blue);">${toMoneyStr(product.Price ? parseFloat(product.Price) : 0)}</span></span>
            </div>
        </div>
    `);

    // Guardar referencia al botón de agregar
    const $addBtn = $('.js-addcart-detail');
    let currentRange = { from: 1, to: totalEpisodes, total: totalEpisodes };

    // Función para actualizar el precio y el botón
    function updateEpisodeSelection() {
        let from = parseInt($('#episodeFrom').val()) || 1;
        let to = parseInt($('#episodeTo').val()) || totalEpisodes;
        // Validar límites
        if (from < 1) from = 1;
        if (to > totalEpisodes) to = totalEpisodes;
        if (from > to) {
            // Intercambiar si desde > hasta
            let temp = from;
            from = to;
            to = temp;
        }
        $('#episodeFrom').val(from);
        $('#episodeTo').val(to);

        const total = to - from + 1;
        currentRange = { from, to, total };
        const calculatedPrice = pricePerEpisode * total;

        // Actualizar display
        $('#episodeCountDisplay').text(total);
        $('#episodePriceDisplay').text(toMoneyStr(calculatedPrice));

        // Actualizar el botón "Agregar" con el precio calculado
        if ($addBtn.length) {
            // Guardar el precio calculado en el botón para usarlo al agregar
            $addBtn.data('calculated-price', calculatedPrice);
            $addBtn.data('range', currentRange);
            // Cambiar el texto del botón para mostrar el precio
            $addBtn.html(`<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar (${toMoneyStr(calculatedPrice)})`);
        }
    }

    // Eventos
    $('#episodeFrom, #episodeTo').on('input', function() {
        updateEpisodeSelection();
    });

    $('#selectAllEpisodes').on('click', function(e) {
        e.preventDefault();
        $('#episodeFrom').val(1);
        $('#episodeTo').val(totalEpisodes);
        updateEpisodeSelection();
    });

    // Inicializar
    updateEpisodeSelection();

    // Almacenar la selección para usarla en el evento click del botón
    $addBtn.data('has-episodes', true);
    $addBtn.data('range', currentRange);
    $addBtn.data('calculated-price', parseFloat(product.Price) || 0);
}

// ===== INICIALIZACIÓN =====
(function(n) {
    "use strict";
    n(document).ready(function() {
        var i = new URLSearchParams(window.location.search),
            t = i.get("id");
        if (!t) {
            $(".product-description-netflix").html("<p>Producto no encontrado.</p>");
            return;
        }
        n.getJSON("./data/products/" + t + ".json", function(i) {
            let r = spanishFormat(i.Label);
            document.title = r + " - CINEMARKET";
            n("head").append('<meta property="og:title" content="' + spanishFormat(r) + '">');
            
            var baseName = t + "-0";
            var extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
            resolveImageUrl(baseName, extensions, function(url) {
                if (url) {
                    n("head").append('<meta property="og:image" content="' + url + '">');
                }
            });
            
            whatsappMessage = 'Hola, me interesa el artículo "' + r + '" que vi en tu sitio web. ¿Podrías darme más información?';
            whatsappMessage = spanishFormat(whatsappMessage);

            buildBreadCrumb(i);
            buildGallery(i);
            buildDetailsGrid(i);
            buildFeatures(i);

            n(".product-label").text(r);
            n("#productCategoryBadge").text(i.Category);
            
            var yearText = "";
            if (i.Features) {
                var yearFeature = i.Features.find(function(f) { return f.toLowerCase().includes('año'); });
                if (yearFeature) {
                    yearText = yearFeature.split(':')[1] ? yearFeature.split(':')[1].trim() : "";
                }
            }
            n("#productYearBadge").text(yearText || "N/A");
            
            let precioStr = i.Price;
            let valorNumerico = parseFloat(precioStr) || 0;
            n("#productPriceBadge").text(toMoneyStr(valorNumerico));

            let desc = spanishFormat(i.Description || '');
            n("#productDescriptionNetflix").text(desc);

            // === NUEVO: Mostrar selector de capítulos si aplica ===
            buildEpisodeSelector(i);

            // === MODIFICAR EL BOTÓN PARA USAR LA SELECCIÓN DE CAPÍTULOS ===
            var $btn = n(".js-addcart-detail");
            $btn.attr("product-id", t);
            $btn.attr("product-label", r);

            // Si hay capítulos, el botón ya fue modificado por buildEpisodeSelector
            // pero necesitamos sobreescribir el click para usar la selección
            $btn.off('click').on('click', function(e) {
                e.preventDefault();
                if ($btn.prop('disabled')) return;

                // Verificar si tiene capítulos
                var hasEpisodes = $btn.data('has-episodes') || false;
                var qty = 1;
                var extraData = {};

                if (hasEpisodes) {
                    var range = $btn.data('range');
                    var calculatedPrice = $btn.data('calculated-price');
                    if (range && calculatedPrice !== undefined) {
                        extraData = {
                            range: range,
                            price: calculatedPrice
                        };
                    }
                }

                var wasRemoved = addToCart(t, r, qty, true, extraData);
                updateCartQty();
                
                if (wasRemoved) {
                    $btn.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar');
                    // Si tiene capítulos, restaurar el texto con el precio
                    if (hasEpisodes && $btn.data('calculated-price') !== undefined) {
                        let price = $btn.data('calculated-price');
                        $btn.html(`<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar (${toMoneyStr(price)})`);
                    }
                } else {
                    $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                    setTimeout(function() {
                        if (inCart(t)) {
                            $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                        } else {
                            $btn.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar');
                            // Si tiene capítulos, restaurar el texto con el precio
                            if (hasEpisodes && $btn.data('calculated-price') !== undefined) {
                                let price = $btn.data('calculated-price');
                                $btn.html(`<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar (${toMoneyStr(price)})`);
                            }
                        }
                    }, 2500);
                }
            });

            // Si el producto ya está en el carrito, marcar el botón
            if (inCart(t)) {
                // Verificar si el item tiene un rango específico
                var cart = getCart();
                var item = cart.items.find(item => item.productId === t);
                if (item && item.range) {
                    // Si tiene rango, mostramos el precio calculado
                    $btn.html(`<i class="zmdi zmdi-check"></i> Agregado ✓`);
                } else {
                    $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                }
            }

            buildRelatedProducts(i);
        }).fail(function() {
            $(".product-description-netflix").html("<p>Producto no disponible.</p>");
        });
    });
})(jQuery);
