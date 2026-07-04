// ============================================================
// INDEX.JS - Carga y filtrado del catálogo
// ============================================================

// ===== VARIABLES GLOBALES =====
var filterData = {};
var filterTree = {};
var currentFilter = {};

// ===== FUNCIÓN PRINCIPAL =====
function loadData($, data) {
    var $container = $('#productGrid'); // Nuevo contenedor
    var $filterCategoriesTag = $('.filters__tabs');
    var $filtersTag = $('#filterContent');

    // ===== ORDENAR POR =====
    addFilters($filtersTag, "Ordenar por", [
        { label: "Recientes", action: function() { sortProducts("update", "desc", "Recientes"); } },
        { label: "Más económicos", action: function() { sortProducts("price", "asc", "Más económicos"); } },
        { label: "Más costosos", action: function() { sortProducts("price", "desc", "Más costosos"); } }
    ]);

    // ===== OBTENER PARÁMETROS DE URL =====
    var urlParams = new URLSearchParams(window.location.search);
    var categoryKeyParam = urlParams.get('category');
    if (categoryKeyParam != null && categoryKeyParam.length > 0) {
        currentFilter['category'] = categoryKeyParam;
        var subcategoryKey = urlParams.get('subcategory');
        if (subcategoryKey != null && subcategoryKey.length > 0) {
            currentFilter['subcategory'] = subcategoryKey;
        }
    }

    var searchParam = urlParams.get('search');
    $('[name="search-product"]').val(searchParam);

    // ===== AGREGAR CATEGORÍAS =====
    addCategoryTag($filterCategoriesTag, "Todos", "*", categoryKeyParam == null || categoryKeyParam.length == 0);
    for (var categoryKey in data) {
        if (filterTree[categoryKey] == null) filterTree[categoryKey] = [];
        filterData[normalizeText(categoryKey)] = categoryKey;
        addCategoryTag($filterCategoriesTag, categoryKey, categoryKey, normalizeText(categoryKey) == categoryKeyParam);
        var category = data[categoryKey];
        for (var subcategoryKey in category) {
            filterData[normalizeText(subcategoryKey)] = subcategoryKey;
            if (filterTree[categoryKey][subcategoryKey] == null) filterTree[categoryKey][subcategoryKey] = [];
            var subcategory = category[subcategoryKey];
            for (var productKey in subcategory) {
                var product = subcategory[productKey];
                if (filterTree[categoryKey][subcategoryKey][product.Date] == null)
                    filterTree[categoryKey][subcategoryKey][product.Date] = [];

                var filterClass = "";
                var extendedFeatures = extendFeatures(product);
                for (var featureKey in extendedFeatures) {
                    var feature = extendedFeatures[featureKey];
                    var filterPart = normalizeText(feature);
                    if (filterPart.length > 0) {
                        filterClass += " feature-" + filterPart;
                        filterData[filterPart] = feature;
                        filterTree[categoryKey][subcategoryKey][product.Date].push(feature);
                    }
                }
                // Agregar tarjeta al contenedor
                addProductCard($container, product, categoryKey, subcategoryKey, filterClass);
            }
        }
    }

    // ===== EVENTOS =====
    $('[name="search-product"]').keyup(debounce(function() {
        applyFilters();
    }, 400));

    // ===== INICIALIZAR LAZY LOAD =====
    var lazyLoadInstance = new LazyLoad({
        elements_selector: "img[data-src]",
        callback_loaded: function() {
            // No es necesario layout para grid simple, pero lo mantenemos por si acaso
        }
    });
}

// ===== FUNCIONES AUXILIARES =====
function debounce(fn, threshold) {
    var timeout;
    threshold = threshold || 100;
    return function debounced() {
        clearTimeout(timeout);
        var args = arguments;
        var _this = this;
        function delayed() {
            fn.apply(_this, args);
        }
        timeout = setTimeout(delayed, threshold);
    };
}

function addCategoryTag($container, label, filterValue, active) {
    var newButton = document.createElement("button");
    var aClass = "stext-106 cl6 hov1 bor3 trans-04 m-r-32 m-tb-5";
    if (active) aClass += " how-active1";
    newButton.setAttribute("class", aClass);
    newButton.textContent = spanishFormat(label);
    newButton.addEventListener('click', function() {
        if (filterValue == "*" && currentFilter["category"] == null) return;
        if (currentFilter["category"] == normalizeText(filterValue)) return;
        currentFilter = {};
        if (filterValue != "*") currentFilter["category"] = normalizeText(filterValue);
        applyFilters();
    });
    $container.append(newButton);
}

function addFilters($container, title, items) {
    var html = '<div class="filter-group">';
    html += '<div class="filter-group__label">' + spanishFormat(title) + '</div>';
    html += '<div class="filter-group__items">';
    items.forEach(function(item) {
        html += '<a href="#" data-action="' + item.label + '">' + spanishFormat(item.label) + '</a>';
    });
    html += '</div></div>';
    $container.append(html);

    // Asignar eventos
    $container.find('.filter-group__items a').on('click', function(e) {
        e.preventDefault();
        var label = $(this).data('action');
        var found = items.find(function(item) { return item.label === label; });
        if (found && found.action) {
            found.action();
        }
        $container.find('.filter-group__items a').removeClass('active');
        $(this).addClass('active');
    });
}

function addProductCard($container, product, categoryKey, subcategoryKey, filterClass) {
    // Asegurar que el producto tenga categoría y subcategoría
    product.Category = categoryKey;
    product.SubCategory = subcategoryKey;
    addProductCardBase($container, product, filterClass);
}

function applyFilters() {
    // Obtener todos los productos (tarjetas)
    var $cards = $('.card-product');
    var searchText = $('[name="search-product"]').val();

    $cards.each(function() {
        var $card = $(this);
        var show = true;

        // Filtros de categoría/subcategoría/feature
        for (var groupKey in currentFilter) {
            if (!$(this).hasClass(groupKey + "-" + currentFilter[groupKey])) {
                show = false;
                break;
            }
        }

        // Búsqueda por texto
        if (show && searchText && searchText.length > 0) {
            var label = $card.data('label') || '';
            var features = $card.data('features') || '';
            var text = label + ' ' + features;
            if (!text.toLowerCase().includes(searchText.toLowerCase())) {
                show = false;
            }
        }

        if (show) {
            $card.show();
        } else {
            $card.hide();
        }
    });
}

function sortProducts(sortBy, sortDirection, text) {
    var $container = $('#productGrid');
    var $cards = $container.children('.card-product').get();

    $cards.sort(function(a, b) {
        var valA, valB;
        if (sortBy === 'price') {
            valA = parseFloat($(a).data('price')) || 0;
            valB = parseFloat($(b).data('price')) || 0;
        } else if (sortBy === 'update') {
            valA = parseInt($(a).data('update')) || 0;
            valB = parseInt($(b).data('update')) || 0;
        }
        if (sortDirection === 'asc') {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });

    $container.empty().append($cards);
}

function extendFeatures(product) {
    var words = product.Label.split(' ');
    var featuresExtended = (product.Features || []).concat(words);
    var splitedWords = [];
    featuresExtended.forEach(function(element) {
        element.split('-').forEach(function(subword) {
            if (subword.length > 1) {
                splitedWords.push(subword);
            }
        });
    });
    return splitedWords;
}

// ===== INICIALIZACIÓN =====
(function($) {
    "use strict";
    $.getJSON("./data/products-index.json", function(data) {
        loadData($, data);
        // Inicializar el resto de componentes (parallax, etc.)
        $('.parallax100').parallax100();
        $('.gallery-lb').each(function() {
            $(this).magnificPopup({
                delegate: 'a',
                type: 'image',
                gallery: { enabled: true },
                mainClass: 'mfp-fade'
            });
        });
        $('.js-pscroll').each(function() {
            $(this).css('position', 'relative');
            $(this).css('overflow', 'hidden');
            var ps = new PerfectScrollbar(this, {
                wheelSpeed: 1,
                scrollingThreshold: 1000,
                wheelPropagation: false
            });
            $(window).on('resize', function() {
                ps.update();
            });
        });
    });
})(jQuery);
