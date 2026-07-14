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

// ===== FUNCIÓN PARA CONSTRUIR EL SELECTOR DE CAPÍTULOS =====
function buildEpisodeSelector(product, $btn) {
    console.log('🔍 buildEpisodeSelector llamado con producto:', product);
    console.log('🔍 Type:', product.Type, 'Episodes:', product.Episodes);
    
    if (product.Type !== "episode" || !product.Episodes || product.Episodes < 2) {
        console.log('❌ Producto NO tiene capítulos o no cumple condiciones.');
        return;
    }
    
    console.log('✅ Producto tiene capítulos. Construyendo selector...');
    var totalEpisodes = parseInt(product.Episodes);
    var pricePerEpisode = null;

    if (product.Features) {
        var priceFeature = product.Features.find(function(f) {
            return f.toLowerCase().includes('precio por capítulo') || f.toLowerCase().includes('costo por episodio');
        });
        if (priceFeature) {
            var match = priceFeature.match(/[0-9.]+/);
            if (match) pricePerEpisode = parseFloat(match[0]);
        }
    }

    if (pricePerEpisode === null || isNaN(pricePerEpisode)) {
        var totalPrice = parseFloat(product.Price) || 0;
        pricePerEpisode = totalPrice / totalEpisodes;
    }
    console.log('💰 Precio por capítulo:', pricePerEpisode);

    var container = document.getElementById('episodeSelectorContainer');
    if (!container) {
        console.log('🆘 Contenedor #episodeSelectorContainer no encontrado, creándolo...');
        container = document.createElement('div');
        container.id = 'episodeSelectorContainer';
        container.style.marginTop = '20px';
        var actions = document.querySelector('.product-actions');
        if (actions) {
            actions.parentNode.insertBefore(container, actions.nextSibling);
        } else {
            var infoCol = document.querySelector('.product-info-col');
            if (infoCol) infoCol.appendChild(container);
        }
    }

    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-mica); border-radius: 12px; padding: 15px 20px; backdrop-filter: blur(10px);">
            <label style="font-weight: 600; color: #fff; display: block; margin-bottom: 10px;">Seleccionar capítulos:</label>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <button id="selectAllEpisodes" class="mica-btn mica-btn-primary" style="padding: 4px 16px; font-size: 13px;">Todos</button>
                <span style="color: var(--text-secondary);">Desde</span>
                <input type="number" id="episodeFrom" value="1" min="1" max="${totalEpisodes}" style="width: 60px; padding: 6px 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-mica); border-radius: 6px; color: #fff; text-align: center;">
                <span style="color: var(--text-secondary);">Hasta</span>
                <input type="number" id="episodeTo" value="${totalEpisodes}" min="1" max="${totalEpisodes}" style="width: 60px; padding: 6px 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-mica); border-radius: 6px; color: #fff; text-align: center;">
                <span id="episodePriceDisplay" style="font-weight: bold; color: var(--accent-blue); margin-left: 10px;">${toMoneyStr(pricePerEpisode * totalEpisodes)}</span>
            </div>
            <div style="margin-top: 8px; font-size: 13px; color: var(--text-muted);">
                <span id="episodeCountDisplay">${totalEpisodes} capítulos</span>
            </div>
        </div>
    `;

    var currentRange = { from: 1, to: totalEpisodes, total: totalEpisodes };
    var currentPrice = pricePerEpisode * totalEpisodes;

    function updatePrice() {
        var from = parseInt(document.getElementById('episodeFrom').value) || 1;
        var to = parseInt(document.getElementById('episodeTo').value) || 1;

        if (from < 1) from = 1;
        if (to > totalEpisodes) to = totalEpisodes;
        if (from > to) from = to;
        if (to < from) to = from;

        document.getElementById('episodeFrom').value = from;
        document.getElementById('episodeTo').value = to;

        var count = to - from + 1;
        var price = pricePerEpisode * count;

        currentRange = { from: from, to: to, total: count };
        currentPrice = price;

        document.getElementById('episodePriceDisplay').textContent = toMoneyStr(price);
        document.getElementById('episodeCountDisplay').textContent = count + ' capítulos';

        $btn.attr('data-episode-price', price);
        $btn.attr('data-episode-range', JSON.stringify(currentRange));
        $btn.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar (' + toMoneyStr(price) + ')');
    }

    $('#episodeFrom').off('change').on('change', updatePrice);
    $('#episodeTo').off('change').on('change', updatePrice);
    $('#selectAllEpisodes').off('click').on('click', function(e) {
        e.preventDefault();
        document.getElementById('episodeFrom').value = 1;
        document.getElementById('episodeTo').value = totalEpisodes;
        updatePrice();
    });

    updatePrice();
    $btn.attr('data-base-price', product.Price);
    $btn.attr('data-episode-active', 'true');
    console.log('✅ Selector de capítulos construido correctamente.');
}

// ============================================
// ===== NUEVAS FUNCIONES PARA SEO =====
// ============================================

// ===== ACTUALIZAR META TAGS DINÁMICAMENTE =====
function updateMetaTags(product) {
    // Título
    document.title = product.Label + ' - IMPRESIONES MR';
    
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = product.Description ? product.Description.substring(0, 160) : 'Compra ' + product.Label + ' en IMPRESIONES MR. Precios en CUP.';
    
    // Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = product.Label + ' - IMPRESIONES MR';
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = product.Description ? product.Description.substring(0, 200) : 'Compra ' + product.Label + ' en IMPRESIONES MR.';
    
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = 'https://impresionesmr.rf.gd/product.html?id=' + ToSlug(product.Label);
    
    // Twitter
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = product.Label + ' - IMPRESIONES MR';
    
    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.content = product.Description ? product.Description.substring(0, 200) : 'Compra ' + product.Label + ' en IMPRESIONES MR.';
}

// ===== ACTUALIZAR JSON-LD =====
function updateProductSchema(product) {
    const script = document.getElementById('productSchema');
    if (!script) return;
    
    const slug = ToSlug(product.Label);
    
    // Obtener la primera imagen
    let imageUrl = 'https://impresionesmr.rf.gd/images/og-image.jpg';
    if (product.Images && product.Images.length > 0) {
        const baseName = product.Images[0].replace(/\.[^.]+$/, '');
        resolveImageUrl(baseName, ['webp', 'jpg', 'jpeg', 'png'], function(url) {
            if (url) {
                imageUrl = url;
                updateScript();
            } else {
                updateScript();
            }
        });
    } else {
        updateScript();
    }
    
    function updateScript() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.Label,
            "description": product.Description ? product.Description.substring(0, 200) : '',
            "image": imageUrl,
            "sku": slug,
            "offers": {
                "@type": "Offer",
                "price": parseFloat(product.Price) || 0,
                "priceCurrency": "CUP",
                "availability": "https://schema.org/InStock",
                "url": 'https://impresionesmr.rf.gd/product.html?id=' + slug,
                "priceValidUntil": "2026-12-31"
            }
        };
        
        // Si el producto tiene episodios
        if (product.Type === 'episode' && product.Episodes > 0) {
            schema.additionalProperty = [
                {
                    "@type": "PropertyValue",
                    "name": "Episodios",
                    "value": product.Episodes
                },
                {
                    "@type": "PropertyValue",
                    "name": "Tipo",
                    "value": "Serie"
                }
            ];
        }
        
        script.textContent = JSON.stringify(schema, null, 2);
    }
}

// ============================================
// ===== CARGA DEL PRODUCTO =====
// ============================================

(function(n) {
    "use strict";
    n(document).ready(function() {
        var i = new URLSearchParams(window.location.search),
            t = i.get("id");
        console.log('🔍 Product ID:', t);
        if (!t) {
            $(".product-description-netflix").html("<p>Producto no encontrado.</p>");
            return;
        }
        n.getJSON("./data/products/" + t + ".json", function(i) {
            console.log('📦 Producto cargado:', i);
            let r = spanishFormat(i.Label);
            document.title = r + " - CINEMARKET";
            n("head").append('<meta property="og:title" content="' + spanishFormat(r) + '">');
            
            var baseName = t + "-0";
            var extensions = ['webp'];
            resolveImageUrl(baseName, extensions, function(url) {
                if (url) {
                    n("head").append('<meta property="og:image" content="' + url + '">');
                }
            });
            
            whatsappMessage = 'Hola, me interesa el artículo "' + r + '" que vi en tu sitio web. ¿Podrías darme más información?';
            whatsappMessage = spanishFormat(whatsappMessage);

            buildBreadCrumb(i);
            updateMetaTags(i);
            updateProductSchema(i);
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

            // ===== BOTÓN AGREGAR =====
            var $btn = n(".js-addcart-detail");
            $btn.attr("product-id", t);
            $btn.attr("product-label", r);

            // ===== CONSTRUIR SELECTOR DE CAPÍTULOS =====
            buildEpisodeSelector(i, $btn);

            // ===== EVENTO CLICK DEL BOTÓN (CON DELEGACIÓN) =====
            $(document).off('click', '.js-addcart-detail').on('click', '.js-addcart-detail', function(e) {
                e.preventDefault();
                var $this = $(this);
                var productId = $this.attr('product-id');
                var productLabel = $this.attr('product-label');
                console.log('🛒 Click en Agregar - productId:', productId);

                var extraData = {};
                var priceToUse = null;
                var rangeData = null;

                if ($this.attr('data-episode-active') === 'true') {
                    var priceAttr = $this.attr('data-episode-price');
                    var rangeAttr = $this.attr('data-episode-range');
                    console.log('📊 data-episode-price:', priceAttr);
                    console.log('📊 data-episode-range:', rangeAttr);
                    if (priceAttr && rangeAttr) {
                        priceToUse = parseFloat(priceAttr);
                        try {
                            rangeData = JSON.parse(rangeAttr);
                        } catch(e) {
                            rangeData = null;
                        }
                        if (rangeData) {
                            extraData.range = rangeData;
                            extraData.price = priceToUse;
                            console.log('📊 ExtraData:', extraData);
                        }
                    }
                }

                var wasRemoved = addToCart(productId, productLabel, 1, true, extraData);
                console.log('🛒 addToCart resultado:', wasRemoved);
                updateCartQty();

                if (wasRemoved) {
                    $this.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar');
                    if ($this.attr('data-episode-active') === 'true') {
                        var currentPrice = $this.attr('data-episode-price');
                        if (currentPrice) {
                            $this.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar (' + toMoneyStr(parseFloat(currentPrice)) + ')');
                        }
                    }
                } else {
                    $this.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                    setTimeout(function() {
                        if (inCart(productId)) {
                            $this.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                        } else {
                            $this.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar');
                            if ($this.attr('data-episode-active') === 'true') {
                                var currPrice = $this.attr('data-episode-price');
                                if (currPrice) {
                                    $this.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar (' + toMoneyStr(parseFloat(currPrice)) + ')');
                                }
                            }
                        }
                    }, 2500);
                }
            });

            if (inCart(t)) {
                $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
            }

            buildRelatedProducts(i);
        }).fail(function() {
            console.error('❌ Error al cargar el producto');
            $(".product-description-netflix").html("<p>Producto no disponible.</p>");
        });
    });
})(jQuery);
