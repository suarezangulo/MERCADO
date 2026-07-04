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
        sep.innerHTML = '<i class="fa fa-angle-right"></i>';
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
        // Si no hay imágenes definidas, intentar con el slug
        var slug = ToSlug(n.Label);
        imagesToProcess = [slug + "-0.webp", slug + "-1.webp"];
    }
    
    var processedCount = 0;
    var foundAnyImage = false;
    
    imagesToProcess.forEach(function(imgName, idx) {
        var baseName = imgName.replace(/\.[^.]+$/, '');
        var extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        var csvExt = imgName.includes('.') ? imgName.split('.').pop().toLowerCase() : 'webp';
        var orderedExtensions = [csvExt].concat(extensions.filter(function(ext) { return ext !== csvExt; }));
        
        resolveImageUrl(baseName, orderedExtensions, function(url) {
            if (url) {
                foundAnyImage = true;
                var galleryItem = document.createElement("div");
                galleryItem.setAttribute("class", "gallery-item");
                var img = document.createElement("img");
                img.setAttribute("src", url);
                img.setAttribute("alt", n.Label + " - Imagen " + (idx + 1));
                img.setAttribute("loading", "lazy");
                // Manejar error de carga
                img.onerror = function() {
                    this.style.display = 'none';
                };
                galleryItem.appendChild(img);
                
                $(galleryItem).on('click', function() {
                    $.magnificPopup.open({
                        items: { src: url },
                        type: 'image'
                    });
                });
                
                $galleryRow.append(galleryItem);
                
                // Usar la primera imagen como fondo del hero
                if (processedCount === 0) {
                    $("#productHero").css("background-image", "url('" + url + "')");
                }
            }
            processedCount++;
            
            // Si después de procesar todas no se encontró ninguna, usar placeholder
            if (processedCount >= imagesToProcess.length && !foundAnyImage) {
                var placeholderUrl = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect fill="#1a1a2e" width="1920" height="1080"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-size="48" font-family="Arial">' + (n.Label || 'Sin imagen') + '</text></svg>');
                $("#productHero").css("background-image", "url('" + placeholderUrl + "')");
                
                // Añadir placeholder a la galería
                var galleryItem = document.createElement("div");
                galleryItem.setAttribute("class", "gallery-item");
                var img = document.createElement("img");
                img.setAttribute("src", placeholderUrl);
                img.setAttribute("alt", n.Label);
                galleryItem.appendChild(img);
                $galleryRow.append(galleryItem);
            }
        });
    });
}

function buildDetailsGrid(n) {
    var $grid = $("#detailsGrid");
    $grid.empty();
    
    var details = [];
    
    // Extraer características del array Features
    if (n.Features && n.Features.length > 0) {
        n.Features.forEach(function(feature) {
            var parts = feature.split(':');
            if (parts.length >= 2) {
                details.push({
                    label: parts[0].trim(),
                    value: parts.slice(1).join(':').trim()
                });
            }
        });
    }
    
    // Añadir datos adicionales
    details.push({ label: 'Precio', value: n.Price || '0.00 CUP' });
    details.push({ label: 'Stock', value: (n.Stock || 0) + ' unidades' });
    details.push({ label: 'Categoría', value: n.Category + ' / ' + n.SubCategory });
    
    details.forEach(function(detail) {
        var item = document.createElement("div");
        item.setAttribute("class", "detail-item");
        item.innerHTML = '<h4>' + detail.label + '</h4><p>' + detail.value + '</p>';
        $grid.append(item);
    });
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
                        $container = $(".slick2");
                        i.forEach(function(t) {
                            t.Category = n.Category;
                            t.SubCategory = n.SubCategory;
                            addProductCardBase($container, t, "", 2);
                        });
                        $.getScript("./js/slick-custom.js", function() {});
                        var u = new LazyLoad({ elements_selector: "img[data-src]" });
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
    if (r.splice(i, 1), i + 1 == n.length) return n.sort((n, t) => t.Price - n.Price);
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
            
            // Imagen OG con fallback
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

            // Título
            n(".product-label").text(r);
            
            // Categoría badge
            n("#productCategoryBadge").text(i.Category);
            
            // Año (extraer de Features)
            var yearText = "";
            if (i.Features) {
                var yearFeature = i.Features.find(function(f) { return f.toLowerCase().includes('año'); });
                if (yearFeature) {
                    yearText = yearFeature.split(':')[1] ? yearFeature.split(':')[1].trim() : "";
                }
            }
            n("#productYearBadge").text(yearText || "N/A");
            
            // Precio badge
            let precioStr = i.Price;
            let valorNumerico = parseFloat(precioStr) || 0;
            n("#productPriceBadge").text(toMoneyStr(valorNumerico));

            // Descripción
            let desc = spanishFormat(i.Description || '');
            n("#productDescriptionNetflix").text(desc);

            // Botón agregar
            let stock = i.Stock || 0;
            var $btn = n(".js-addcart-detail");
            $btn.attr("product-id", t);
            $btn.attr("product-label", r);
            
            if (stock <= 0) {
                $btn.prop('disabled', true).text('Sin stock');
                $btn.removeClass('btn-play-netflix').addClass('btn-info-netflix');
            }

            $btn.off('click').on('click', function(e) {
                e.preventDefault();
                if ($btn.prop('disabled')) return;
                
                var qty = 1;
                var wasRemoved = addToCart(t, r, qty, true);
                updateCartQty();
                
                if (wasRemoved) {
                    $btn.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar');
                } else {
                    $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                    setTimeout(function() {
                        if (inCart(t)) {
                            $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
                        } else {
                            $btn.html('<i class="zmdi zmdi-shopping-cart-plus"></i> Agregar');
                        }
                    }, 2500);
                }
            });

            if (inCart(t) && stock > 0) {
                $btn.html('<i class="zmdi zmdi-check"></i> Agregado ✓');
            }

            buildRelatedProducts(i);
        }).fail(function() {
            $(".product-description-netflix").html("<p>Producto no disponible.</p>");
        });
    });
})(jQuery);
