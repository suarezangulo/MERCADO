// ============================================================
// INDEX.JS - Carga de catálogo, filtros y grid
// ============================================================

(function($) {
    'use strict';

    var filterData = {};
    var filterTree = {};
    var currentFilter = {};
    var productsList = [];

    // ===== CARGA DE DATOS =====
    function loadCatalog() {
        $.getJSON('./data/products-index.json', function(data) {
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
        }).fail(function() {
            console.error('Error al cargar products-index.json');
        });
    }

    // ===== RENDER FILTROS =====
    function renderFilters() {
        var $tabs = $('.filters__tabs');
        $tabs.empty();

        // Botón "Todos"
        var allBtn = $('<button>').text('Todos').addClass('active');
        allBtn.on('click', function() {
            $('.filters__tabs button').removeClass('active');
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
                    $('.filters__tabs button').removeClass('active');
                    $(this).addClass('active');
                    currentFilter = { category: cat };
                    applyFilters();
                };
            })(category));
            $tabs.append(btn);
        }
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
        var $grid = $('.product-grid');
        $grid.empty();

        if (!products || products.length === 0) {
            $grid.html('<p style="color: var(--text-muted); text-align:center; padding:40px 0;">No se encontraron títulos.</p>');
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

        // Inicializar LazyLoad para las imágenes
        if (typeof LazyLoad !== 'undefined') {
            var lazy = new LazyLoad({
                elements_selector: '.card-product__img img[data-src]'
            });
        }
    }

    // ===== CREAR TARJETA =====
    function createProductCard(product) {
        var slug = ToSlug(product.Label);
        var $card = $('<div>').addClass('card-product');

        // Imagen
        var imgSrc = './images/products/' + slug + '-0.webp';
        var $img = $('<img>').attr('data-src', imgSrc).attr('alt', product.Label);
        var $imgWrap = $('<div>').addClass('card-product__img').append($img);
        $card.append($imgWrap);

        // Cuerpo
        var $body = $('<div>').addClass('card-product__body');

        // Título
        var $title = $('<div>').addClass('card-product__title').text(product.Label);
        $body.append($title);

        // Descripción (primer feature o resumen)
        var desc = (product.Features && product.Features.length > 0) ? product.Features[0] : '';
        var $desc = $('<div>').addClass('card-product__desc').text(desc);
        $body.append($desc);

        // Precio
        var price = product.Price || '0.00 CUP';
        var $price = $('<div>').addClass('card-product__price').text(price);
        $body.append($price);

        // Botón carrito
        var $actions = $('<div>').addClass('card-product__actions');
        var inCart = inCart(slug);
        var $cartBtn = $('<button>')
            .addClass('card-product__cart' + (inCart ? ' card-product__cart--in' : ''))
            .html(inCart ? '🛒' : '➕')
            .attr('data-slug', slug)
            .attr('data-label', product.Label);
        $cartBtn.on('click', function(e) {
            e.preventDefault();
            var slug = $(this).data('slug');
            var label = $(this).data('label');
            var wasRemoved = addToCart(slug, label, 1, true);
            updateCartQty();
            if (wasRemoved) {
                $(this).removeClass('card-product__cart--in').html('➕');
            } else {
                $(this).addClass('card-product__cart--in').html('🛒');
            }
        });
        $actions.append($cartBtn);
        $body.append($actions);

        // Enlace al detalle
        $card.on('click', function(e) {
            if ($(e.target).closest('.card-product__cart').length) return;
            window.location.href = 'product.html?id=' + slug;
        });
        $card.css('cursor', 'pointer');

        $card.append($body);
        return $card;
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
                // Actualizar iconos de carrito en las tarjetas (recargar productos)
                // Para simplificar, recargamos los productos con el filtro actual
                applyFilters();
            }
        });
    });

})(jQuery);
