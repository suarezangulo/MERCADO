function buildBreadCrumb(n) {
    $container = $(".bread-crumb");
    let t = "./?category=" + normalizeText(n.Category);
    addBreadCrumb($container, n.Category, t);
    if (n.SubCategory != null && n.SubCategory.length > 0) {
        t += "&subcategory=" + normalizeText(n.SubCategory);
        addBreadCrumb($container, n.SubCategory, t);
    }
    addBreadCrumb($container, n.Label);
}

function addBreadCrumb(n, t, i = null) {
    if (i == null) {
        let i = document.createElement("span");
        i.setAttribute("class", "stext-109 cl4");
        i.textContent = spanishFormat(t);
        n.append(i);
        return;
    }
    let r = document.createElement("a");
    r.setAttribute("href", i);
    r.setAttribute("class", "stext-109 cl8 hov-cl1 trans-04");
    r.textContent = spanishFormat(t);
    let u = document.createElement("i");
    u.setAttribute("class", "fa fa-angle-right m-l-9 m-r-10");
    u.setAttribute("aria-hidden", "true");
    r.appendChild(u);
    n.append(r);
}

function buildGallery(n) {
    $container = $(".gallery-lb");
    n.Images.forEach(function(imgName, idx) {
        // Resolver cada imagen con fallback de extensiones
        var baseName = imgName.replace(/\.[^.]+$/, '');
        var extensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        var csvExt = imgName.split('.').pop().toLowerCase();
        var orderedExtensions = [csvExt].concat(extensions.filter(function(ext) { return ext !== csvExt; }));
        
        resolveImageUrl(baseName, orderedExtensions, function(url) {
            var resolvedUrl = url || ('./images/products/' + imgName);
            addGalleryItem($container, resolvedUrl);
        });
    });
    // Inicializar magnificPopup después de un breve retraso para que se carguen las imágenes
    setTimeout(function() {
        $container.each(function() {
            $(this).magnificPopup({
                delegate: "a",
                type: "image",
                gallery: { enabled: !0 },
                mainClass: "mfp-fade"
            });
        });
        // Re-inicializar slick después de resolver imágenes
        $('.slick3').slick('refresh');
    }, 500);
}

function addGalleryItem(n, t) {
    let i = document.createElement("div");
    i.setAttribute("class", "item-slick3");
    i.setAttribute("data-thumb", t);
    let r = document.createElement("div");
    r.setAttribute("class", "wrap-pic-w pos-relative");
    let f = document.createElement("img");
    f.setAttribute("src", t);
    f.setAttribute("alt", "imagen del artículo");
    r.appendChild(f);
    let u = document.createElement("a");
    u.setAttribute("class", "flex-c-m size-108 how-pos1 bor0 fs-16 cl10 bg0 hov-btn3 trans-04");
    u.setAttribute("href", t);
    let e = document.createElement("i");
    e.setAttribute("class", "fa fa-expand");
    u.appendChild(e);
    r.appendChild(u);
    i.appendChild(r);
    n.append(i);
}

function buildFeatures(product) {
    const featuresContainer = $(".product-features");
    if (!featuresContainer.length) return;
    if (!product.Features || product.Features.length === 0) {
        featuresContainer.html('<p class="stext-102 cl6">Sin características.</p>');
        return;
    }
    const isCombo = product.Features.some(f => /^\(\d+\)/.test(f));
    let html = '<ul class="features-list" style="list-style: none; padding-left: 0; margin: 0;">';
    product.Features.forEach(function(feature) {
        if (isCombo) {
            const match = feature.match(/^\((\d+)\)\s*(.*)/);
            if (match) {
                const quantity = match[1];
                const name = match[2];
                html += `<li style="display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="background-color: rgba(30, 144, 255, 0.25); color: #fff; font-size: 12px; font-weight: bold; min-width: 30px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 13px; flex-shrink: 0; margin-right: 10px; border: 1px solid rgba(30, 144, 255, 0.3); backdrop-filter: blur(2px);">${quantity}</span>
                    <span style="font-family: Poppins-Regular; font-size: 14px; color: #ccc;">${name}</span>
                </li>`;
            } else {
                html += `<li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-family: Poppins-Regular; font-size: 14px; color: #ccc;">${feature}</li>`;
            }
        } else {
            html += `<li style="padding: 4px 0; list-style: disc; margin-left: 20px; font-family: Poppins-Regular; font-size: 14px; color: #ccc;">${feature}</li>`;
        }
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
    let f = -1,
        e = 12;
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
            $(".product-description").html("<p>Producto no encontrado.</p>");
            return;
        }
        n.getJSON("./data/products/" + t + ".json", function(i) {
            let r = spanishFormat(i.Label);
            document.title = r;
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

            var u = !0;
            n(".product-label").each(function(t, i) {
                i.textContent = r;
                if (u && productStatus != null && productStatus.length > 0) {
                    n(i).addClass("pstatus");
                    n(i).attr("data-pstatus", productStatus);
                    u = !1;
                }
            });

            // Mostrar precio en CUP (sin conversión)
            let precioStr = i.Price;
            let valorNumerico = parseFloat(precioStr) || 0;
            let precioFormateado = toMoneyStr(valorNumerico);
            let htmlPrecio = `<span style="font-weight: bold; font-size: 24px; color: #fff;">${precioFormateado}</span>`;
            n(".product-price").each(function() {
                $(this).html(htmlPrecio);
            });

            buildFeatures(i);

            let stock = i.Stock || 0;
            let stockHtml = '';
            if (stock > 0) {
                stockHtml = `<div class="p-t-10 p-b-10">
                    <span class="stext-102 cl3">Disponibilidad: </span>
                    <span class="stext-102 cl1" style="font-weight: bold;">${stock} unidades disponibles</span>
                </div>`;
            } else {
                stockHtml = `<div class="p-t-10 p-b-10">
                    <span class="stext-102 cl3">Disponibilidad: </span>
                    <span class="stext-102 cl1" style="color: #FF3B3B; font-weight: bold;">Agotado</span>
                </div>`;
            }
            n(".product-label").after(stockHtml);

            if (stock <= 0) {
                n(".js-addcart-detail").prop('disabled', true).text('Sin stock');
            }

            let f = spanishFormat(i.Description);
            n(".product-description").each(function(n, t) {
                t.innerHTML = f.replace(/\n/g, "<br>");
            });

            n(".js-addcart-detail").off('click').on('click', function(e) {
                e.preventDefault();
                var $btn = n(this);
                var productId = $btn.attr("product-id");
                var productLabel = $btn.attr("product-label");
                
                if ($btn.prop('disabled')) return;
                
                var qty = 1;
                var qtyInput = $btn.parent().find('[name="num-product"]');
                if (qtyInput.length && parseInt(qtyInput.val()) > 0) {
                    qty = parseInt(qtyInput.val());
                }
                
                if (stock > 0 && qty > stock) {
                    swal("Stock insuficiente", "Solo hay " + stock + " unidades disponibles.", "warning");
                    return;
                }
                
                var wasRemoved = addToCart(productId, productLabel, qty, true);
                updateCartQty();
                
                if (wasRemoved) {
                    $btn.text("Agregar");
                    $btn.removeClass("bg1").addClass("bg3");
                } else {
                    $btn.text("Agregado ✓");
                    $btn.removeClass("bg3").addClass("bg1");
                }
                
                $btn.css("transform", "scale(0.9)");
                setTimeout(function() {
                    $btn.css("transform", "scale(1)");
                }, 200);
                
                setTimeout(function() {
                    var isStillInCart = inCart(productId);
                    if (isStillInCart) {
                        $btn.text("Agregado ✓");
                        $btn.removeClass("bg3").addClass("bg1");
                    } else {
                        $btn.text("Agregar");
                        $btn.removeClass("bg1").addClass("bg3");
                    }
                }, 2500);
            });

            n(".js-addcart-detail").each(function() {
                $(this).attr("product-id", t);
                $(this).attr("product-label", r);
            });

            if (inCart(t) && stock > 0) {
                n(".js-addcart-detail").text("Agregado ✓").addClass("bg1").removeClass("bg3");
            }

            buildRelatedProducts(i);
        }).fail(function() {
            $(".product-description").html("<p>Producto no disponible.</p>");
        });
    });
})(jQuery);
