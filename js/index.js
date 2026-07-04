// ============================================================
// INDEX.JS - Carga de catálogo, filtros y grid con Isotope
// ============================================================

(function($) {
    'use strict';

    var filterData = {};
    var filterTree = {};
    var currentFilter = {};
    var productsList = [];
    var $grid;

    // ===== CARGA DE DATOS =====
    function loadCatalog() {
        $.getJSON('data/products-index.json', function(data) {
            if (!data) {
                console.error('No se pudo cargar products-index.json');
                return;
            }

            // Construir árbol de filtros y lista de productos
            productsList = [];
            filterTree = {};
            filterData = {};

            for (var category in data) {
                if (!filterTree[category]) filterTree[category] = {};
                filterData[category] = category;
                var subcategories = data[category];
                for (var subcategory in subcategories) {
                    if (!filterTree[category][subcategory]) filterTree[category][subcategory] = [];
                    filterData[subcategory] = subcategory;
                    var items = subcategories[subcategory];
                    for (var i = 0; i < items.length; i++) {
                        var product = items[i];
                        product.Category = category;
                        product.SubCategory = subcategory;
                        // Generar slug
                        product.slug = ToSlug(product.Label);
                        productsList.push(product);
                        // Guardar features en el árbol
                        var features = product.Features || [];
                        for (var f = 0; f < features.length; f++) {
                            var featureKey = normalizeText(features[f]);
                            if (featureKey) {
                                filterData[featureKey] = features[f];
                                if (!filterTree[category][subcategory][featureKey]) {
                                    filterTree[category][subcategory][featureKey] = [];
                                }
                                filterTree[category][subcategory][featureKey].push(features[f]);
                            }
                        }
                    }
                }
            }

            // Renderizar filtros y productos
            renderFilters();
            renderProducts(productsList);
            initIsotope();

        }).fail(function() {
            console.error('Error al cargar products-index.json');
        });
    }

    // ===== RENDER FILTROS =====
    function renderFilters() {
        var $tabs = $('.filter-tope-group');
        $tabs.empty();

        // Botón "Todos"
        var allBtn = $('<button>').text('Todos').addClass('active');
        allBtn.on('click', function() {
            $('.filter-tope-group button').removeClass('active');
            $(this).addClass('active');
            currentFilter = {};
            applyFilters();
        });
        $tabs.append(allBtn);

        // Botones por categoría
        for (var category in filterTree) {
            var btn = $('<button>').text(category);
            btn.on('click', (function(cat) {
                return function() {
                    $('.filter-tope-group button').removeClass('active');
                    $(this).addClass('active');
                    currentFilter = { category: cat };
                    applyFilters();
                };
            })(category));
            $tabs.append(btn);
        }

        // Renderizar filtros avanzados (subcategorías y features)
        renderAdvancedFilters();
    }

    // ===== FILTROS AVANZADOS =====
    function renderAdvancedFilters() {
        var $container = $('#filterContent');
        $container.empty();

        // No mostramos filtros avanzados en esta versión para simplificar
        // Puedes añadirlos más tarde si lo deseas
    }

    // ===== APLICAR FILTROS =====
    function applyFilters() {
        var filtered = [];
        var searchText = $('[name="search-product"]').val() || '';

        for (var i = 0; i < productsList.length; i++) {
            var p = productsList[i];
            var match = true;

            // Filtro por categoría
            if (currentFilter.category && p.Category !== currentFilter.category) {
                match = false;
            }

            // Filtro por subcategoría (si existe)
            if (match && currentFilter.subcategory && p.SubCategory !== currentFilter.subcategory) {
                match = false;
            }

            // Búsqueda por texto
            if (match && searchText.length > 0) {
                var target = (p.Label + ' ' + (p.Features || []).join(' ')).toLowerCase();
                var words = searchText.toLowerCase().split(' ');
                for (var w = 0; w < words.length; w++) {
                    if (target.indexOf(words[w]) === -1) {
                        match = false;
                        break;
                    }
                }
            }

            if (match) filtered.push(p);
        }

        renderProducts(filtered);
    }

    // ===== RENDER PRODUCTOS =====
    function renderProducts(products) {
        $grid = $('.isotope-grid');
        $grid.empty();

        if (!products || products.length === 0) {
            $grid.html('<div class="col-12"><p style="color: var(--text-muted); text-align:center; padding:40px 0;">No se encontraron títulos.</p></div>');
            return;
        }

        // Ordenar por fecha (más reciente primero)
        products.sort(function(a, b) {
            return new Date(b.Update || b.Date) - new Date(a.Update || a.Date);
        });

        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var card = createProductCard(product);
            $grid.append(card);
        }

        // Inicializar Isotope
        if (typeof Isotope !== 'undefined') {
            $grid.isotope('destroy');
            $grid.isotope({
                itemSelector: '.isotope-item',
                layoutMode: 'fitRows',
                percentPosition: true,
                animationEngine: 'best-available',
                masonry: {
                    columnWidth: '.isotope-item'
                }
            });
        }

        // Inicializar LazyLoad
        if (typeof LazyLoad !== 'undefined') {
            var lazy = new LazyLoad({
                elements_selector: '.block2-pic img[data-src]'
            });
        }
    }

    // ===== CREAR TARJETA =====
    function createProductCard(product) {
        var slug = product.slug || ToSlug(product.Label);
        var $col = $('<div>').addClass('col-sm-6 col-md-4 col-lg-3 p-b-60 isotope-item');

        // Clases para filtros
        var filterClass = ' category-' + normalizeText(product.Category) + ' subcategory-' + normalizeText(product.SubCategory);
        if (product.Features) {
            for (var f = 0; f < product.Features.length; f++) {
                var feat = normalizeText(product.Features[f]);
                if (feat) filterClass += ' feature-' + feat;
            }
        }
        $col.addClass(filterClass);

        // HTML de la tarjeta (similar al original)
        var html = '';
        html += '<div class="block2">';
        html += '  <a href="product.html?id=' + slug + '" class="stext-104 cl3 hov-cl1 trans-04 js-name-b2">';
        html += '    <div class="block2-pic hov-img0">';
        html += '      <img data-src="./images/products/' + slug + '-0.webp" alt="' + product.Label + '">';
        html += '    </div>';
        html += '  </a>';
        html += '  <div class="block2-txt flex-w flex-t p-t-14">';
        html += '    <div class="block2-txt-child1 flex-col-l">';
        html += '      <a href="product.html?id=' + slug + '" class="stext-104 cl3 hov-cl1 trans-04 js-name-b2">' + spanishFormat(product.Label) + '</a>';
        html += '      <span class="cl4 stext-111">' + ((product.Features && product.Features.length > 0) ? spanishFormat(product.Features.join(', ')) : '') + '</span>';
        html += '      <div class="p-t-6" style="line-height:1.3;">';
        html += '        <span class="stext-105 cl2" style="font-weight:bold; font-size:20px;">' + product.Price + '</span>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div class="block2-txt-child2 flex-r p-t-3">';
        var inCartFlag = inCart(slug);
        html += '      <a href="#" class="btn-addwish-b2 dis-block pos-relative js-addcart icon-add-cart hov-cl1 trans-04 ' + (inCartFlag ? 'cl1' : 'cl4') + '" data-slug="' + slug + '" data-label="' + product.Label + '">';
        html += '        <i class="' + (inCartFlag ? 'zmdi zmdi-shopping-cart' : 'zmdi zmdi-shopping-cart-plus') + '" style="vertical-align:top;"></i>';
        html += '      </a>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        $col.html(html);

        // Evento del botón carrito
        $col.find('.js-addcart').on('click', function(e) {
            e.preventDefault();
            var slug = $(this).data('slug');
            var label = $(this).data('label');
            var wasRemoved = addToCart(slug, label, 1, true);
            updateCartQty();
            var icon = $(this).find('i');
            if (wasRemoved) {
                icon.removeClass('zmdi-shopping-cart').addClass('zmdi-shopping-cart-plus');
                $(this).removeClass('cl1').addClass('cl4');
            } else {
                icon.removeClass('zmdi-shopping-cart-plus').addClass('zmdi-shopping-cart');
                $(this).removeClass('cl4').addClass('cl1');
            }
        });

        return $col;
    }

    // ===== INICIAR ISOTOPE =====
    function initIsotope() {
        $grid = $('.isotope-grid');
        if ($grid.length && typeof Isotope !== 'undefined') {
            $grid.isotope({
                itemSelector: '.isotope-item',
                layoutMode: 'fitRows',
                percentPosition: true,
                animationEngine: 'best-available',
                masonry: {
                    columnWidth: '.isotope-item'
                }
            });
        }
    }

    // ===== BÚSQUEDA EN TIEMPO REAL =====
    $(document).on('input', '[name="search-product"]', function() {
        applyFilters();
    });

    // ===== INICIALIZAR =====
    $(document).ready(function() {
        loadCatalog();

        // Evento para el botón de búsqueda (panel)
        $('.panel--search button').on('click', function(e) {
            e.preventDefault();
            applyFilters();
        });

        // Actualizar contador del carrito al cargar
        updateCartQty();

        // Reaccionar a cambios en el carrito desde otras pestañas
        window.addEventListener('storage', function(e) {
            if (e.key === 'cart') {
                updateCartQty();
                // Para simplificar, recargamos los productos con el filtro actual
                applyFilters();
            }
        });
    });

})(jQuery);
