// ===== VARIABLES GLOBALES =====
var filterData = [];
var filterTree = [];
var currentFilter = []; 
var gTagCategory = "";
var gTagSubCategory = "";
var gTagKeyword = "";

// ===== FUNCIÓN PRINCIPAL =====
function loadIsotope() {
    $('.isotope-grid').each(function() {
        $(this).isotope({
            itemSelector: '.isotope-item',
            layoutMode: 'fitRows',
            percentPosition: true,
            sortBy: 'update',
            sortAscending: false,
            animationEngine: 'best-available',
            masonry: {
                columnWidth: '.isotope-item'
            },
            getSortData: {
                price: '[data-price-usd] parseFloat',
                update: '[data-update] parseFloat'
            },
            filter: function() {
                for (let groupKey in currentFilter) {
                    if (!$(this).hasClass(groupKey + "-" + currentFilter[groupKey])) return false;
                }

                var searchText = $('[name="search-product"]').val();
                if (searchText != null && searchText.length > 0) {
                    let aClass = $(this).attr('class');
                    var targetData = getFilterValues(aClass, "category")
                        .concat(getFilterValues(aClass, "subcategory"))
                        .concat(getFilterValues(aClass, "feature"))
                        .concat(getFilterValues(aClass, "label"));

                    targetData = targetData.join(' ');
                    let worlds = searchText.split(' ');
                    for (let i = 0; i < worlds.length; i++) {
                        let world = normalizeText(worlds[i]);
                        if (!targetData.includes(world)) return false;
                    }
                }
                return true;
            }
        });
    });
}

function loadData($, data) {
    let $topeContainer = $('.isotope-grid').first();
    let $filtersTag = $('.wrap-filter');

    // ===== MEJORA 2: MOSTRAR SKELETONS MIENTRAS CARGA =====
    $topeContainer.empty();
    for (let i = 0; i < 8; i++) {
        let skeleton = document.createElement("div");
        skeleton.setAttribute("class", "col-sm-6 col-md-4 col-lg-3 p-b-60");
        skeleton.innerHTML = `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton-text">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-desc"></div>
                    <div class="skeleton-price"></div>
                </div>
            </div>`;
        $topeContainer.append(skeleton);
    }

    // Obtener parámetros de URL
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

    // Pequeño retraso para que los skeletons sean visibles
    setTimeout(function() {
        // Eliminar skeletons
        $topeContainer.find('.skeleton-card').parent().remove();

        // ===== SECCIÓN CATEGORÍAS (DENTRO DEL PANEL FILTRO) =====
        var categorySection = document.createElement("div");
        categorySection.setAttribute("class", "filter-col1 p-b-27");
        categorySection.innerHTML = '<div class="mtext-102 cl2 p-b-15">Categorías</div>';
        var categoryContainer = document.createElement("div");
        categoryContainer.setAttribute("class", "flex-w p-t-4 m-r--5");
        categoryContainer.setAttribute("id", "categoryFiltersContainer");
        categorySection.appendChild(categoryContainer);
        $filtersTag.prepend(categorySection); // Insertar al inicio del panel

        // Ordenar por (ahora ocupa filter-col2)
        let orderByFilter = addFiltersTag($filtersTag, 2, "Ordenar por");
        addFilterLi(orderByFilter, "Recientes", "orderBy", true, () => sortProducts("update", "desc", "Recientes"));
        addFilterLi(orderByFilter, "Más económicos", "orderBy", false, () => sortProducts("price", "asc", "Más económicos"));
        addFilterLi(orderByFilter, "Más costosos", "orderBy", false, () => sortProducts("price", "desc", "Más costosos"));

        // Construir datos de productos y árbol de filtros
        for (const categoryKey in data) {
            if (filterTree[categoryKey] == null) filterTree[categoryKey] = [];
            filterData[normalizeText(categoryKey)] = categoryKey;
            const category = data[categoryKey];
            for (const subcategoryKey in category) {
                filterData[normalizeText(subcategoryKey)] = subcategoryKey;
                if (filterTree[categoryKey][subcategoryKey] == null) filterTree[categoryKey][subcategoryKey] = [];
                const subcategory = category[subcategoryKey];
                for (const productKey in subcategory) {
                    const product = subcategory[productKey];
                    if (filterTree[categoryKey][subcategoryKey][product.Date] == null)
                        filterTree[categoryKey][subcategoryKey][product.Date] = [];

                    var filterClass = "";
                    var extendedFeatures = extendFeatures(product);
                    for (const featureKey in extendedFeatures) {
                        const feature = extendedFeatures[featureKey];
                        const filterPart = normalizeText(feature);
                        if (filterPart.length > 0) {
                            filterClass += " feature-" + filterPart;
                            filterData[filterPart] = feature;
                            filterTree[categoryKey][subcategoryKey][product.Date].push(feature);
                        }
                    }
                    addProductCard($topeContainer, product, categoryKey, subcategoryKey, filterClass);
                }
            }
        }

        // ===== BOTONES DE CATEGORÍA (píldoras Mica) =====
        var $catContainer = $('#categoryFiltersContainer');
        addCategoryTag($catContainer, "Todos", "*", categoryKeyParam == null || categoryKeyParam.length == 0);
        for (const categoryKey in data) {
            addCategoryTag($catContainer, categoryKey, categoryKey, normalizeText(categoryKey) == categoryKeyParam);
        }

        // Eventos de Isotope y búsqueda
        $topeContainer.on('arrangeComplete', updateView);
        $('[name="search-product"]').keyup(debounce(function() {
            $('.isotope-grid').isotope();
            updateViewSearch($(this));
        }, 400));

        var lazyLoadInstance = new LazyLoad({
            elements_selector: "img[data-src]",
            callback_loaded: function() {
                let iso = $('.isotope-grid');
                if (iso.data('isotope')) iso.isotope('layout');
            }
        });
        
        // Inicializar Isotope después de cargar los productos
        $('.isotope-grid').imagesLoaded({}, function () {
            loadIsotope();
        });
    }, 600);
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

function updateViewSearch(searchControl = null) {
    if (searchControl == null) searchControl = $('[name="search-product"]');
    let searchText = searchControl.val();
    if (searchText != null && searchText.length > 0) {
        $('.js-show-search').addClass("show-search");
        if (googleAnalyticsId != null && googleAnalyticsId.length > 0) {
            gtag('event', 'search', { 'search_term': searchText });
        }
    } else {
        $('.js-show-search').removeClass("show-search");
    }
}

function udpateViewFilter() {
    let anyFilter = false;
    if (currentFilter["subcategory"] != null && currentFilter["subcategory"].length > 0) anyFilter = true;
    if (!anyFilter && (currentFilter["feature"] != null && currentFilter["feature"].length > 0)) anyFilter = true;
    if (anyFilter) $('.js-show-filter').addClass("show-filter");
    else $('.js-show-filter').removeClass("show-filter");
}

function updateView() {    
    let categories = [];
    let currentCategory = currentFilter["category"];
    let currentSubcategory = currentFilter["subcategory"];
    let currentTSubcategory = null;
    if (currentCategory == null) {
        for (var categoryKey in filterTree) {
            categories.push(categoryKey);
            if (currentSubcategory != null) {
                let tCategory = filterTree[categoryKey];                
                for (var subcategoryKey in tCategory) {
                    if (currentSubcategory == normalizeText(subcategoryKey))
                        currentTSubcategory = subcategoryKey;
                }
            }
        }            
    } else {       
        let categoryKey = filterData[currentCategory];       
        categories.push(categoryKey);
        let tCategory = filterTree[categoryKey];
        if (currentSubcategory != null) {            
            for (var subcategoryKey in tCategory) {                
                if (currentSubcategory == normalizeText(subcategoryKey))
                    currentTSubcategory = subcategoryKey;
            }
        }
    }

    let subcategories = [];
    let products = [];
    for (let i in categories) {
        let categoryKey = categories[i];
        let tCategory = filterTree[categoryKey];
        for (let subCategoryKey in tCategory) {
            subcategories.push(subCategoryKey);
            if (currentTSubcategory != null && currentTSubcategory != subCategoryKey) continue;
            let tSubcategory = tCategory[subCategoryKey];
            for (let productKey in tSubcategory) {
                let tProduct = tSubcategory[productKey];
                if (tProduct != null && tProduct.length > 0) products.push(tProduct);                                  
            }            
        }
    }

    subcategories = subcategories.filter(function (valor, indice) {
        return subcategories.indexOf(valor) === indice;
    });
    
    // Ajuste de posiciones: subcategorías ahora en col3, palabras clave en col4
    updateFilters("Subcategorías", 3, subcategories.sort(), false, "subcategory");
    var keywords = getKeywords(products, 15);
    updateFilters("Palabras clave", 4, keywords, true, "feature");
    udpateViewFilter();

    if (googleAnalyticsId != null && googleAnalyticsId.length > 0) {
        if (currentCategory != null && currentCategory.length > 0 && currentCategory != gTagCategory) {
            gtag('event', 'apply_filters', {
                'event_category': 'Interacción del usuario',
                'event_label': 'Categoría',
                'value': currentCategory
            });
            gTagCategory = currentCategory;
        }
        if (currentSubcategory != null && currentSubcategory.length > 0 && currentSubcategory != gTagSubCategory) {
            gtag('event', 'apply_filters', {
                'event_category': 'Interacción del usuario',
                'event_label': 'Subcategoría',
                'value': currentSubcategory
            });
            gTagSubCategory = currentSubcategory;
        }
        var currentFeature = currentFilter["feature"];
        if (currentFeature != null && currentFeature.length > 0 && currentFeature != gTagKeyword) {
            gtag('event', 'apply_filters', {
                'event_category': 'Interacción del usuario',
                'event_label': 'Característica',
                'value': currentFeature
            });
            gTagKeyword = currentFeature;
        }
    }
}

function extendFeatures(product) {
    const words = product.Label.split(' ');
    let featuresExtended = (product.Features || []).concat(words);
    const splitedWords = featuresExtended
        .flatMap(element => element.split('-'))
        .filter(subword => subword.length > 1);
    return splitedWords;
}

function getKeywords(products, numKeywords) {
    const keywords = products.flatMap(product => product.map(word => word.toLowerCase()));
    const frequency = keywords.reduce((obj, word) => {
        obj[word] = (obj[word] || 0) + 1;
        return obj;
    }, {});
    const numProducts = products.length;
    const minFrequency = Math.ceil(numProducts * 0.05);
    const maxFrequency = Math.floor(numProducts * 0.7);
    const filteredKeywords = Object.keys(frequency)
        .filter(word => frequency[word] >= minFrequency && frequency[word] <= maxFrequency);
    filteredKeywords.sort((a, b) => frequency[b] - frequency[a]);
    return filteredKeywords.slice(0, numKeywords);
}

function updateFilters(title, pos, collection, forTags, prevFilter) {
    let $filtersTag = $('.wrap-filter');
    let filtersTag = addFiltersTag($filtersTag, pos, title, forTags);
    filtersTag.innerHTML = "";    

    let current = currentFilter[prevFilter];
    for (var item in collection) {
        let label = collection[item];
        if (forTags)
            addFilterDiv(filtersTag, label, prevFilter, current == normalizeText(label));
        else
            addFilterLi(filtersTag, label, prevFilter, current == normalizeText(label));
    }
}

// ===== FUNCIÓN addCategoryTag CON PÍLDORAS MICA (AHORA DENTRO DEL PANEL) =====
function addCategoryTag($container, label, filterValue, active) {
    let newButton = document.createElement("button");
    let aClass = "mica-pill-btn";
    if (active) aClass += " active";
    newButton.setAttribute("class", aClass);
    newButton.setAttribute("data-filter", filterValue);
    newButton.textContent = spanishFormat(label);
    newButton.addEventListener('click', () => {   
        if (filterValue == "*" && currentFilter["category"] == null) return;
        if (currentFilter["category"] == normalizeText(filterValue)) return;
        currentFilter = [];
        if (filterValue != "*") currentFilter["category"] = normalizeText(filterValue);
        $('.isotope-grid').isotope();
        // Actualizar estado activo en todas las píldoras
        $('.mica-pill-btn').removeClass('active');
        $(newButton).addClass('active');
    });
    $container.append(newButton);
    
    // Asegurar que el contenedor tenga display flex
    $container.css({
        'display': 'flex',
        'flex-wrap': 'wrap',
        'gap': '8px'
    });
}

function addFiltersTag($container, col, label, forTags = false) {
    let filterCol = "filter-col" + col;
    let newDiv = $container.find("." + filterCol);
    if (newDiv != null && newDiv.length > 0) {
        newDiv = newDiv.first();
        if (forTags) return newDiv.find("div")[1];
        return newDiv.find("ul").first().get(0);
    }
    newDiv = document.createElement("div");
    if (forTags) {
        newDiv.setAttribute("class", filterCol + " p-b-27");
    } else {
        newDiv.setAttribute("class", filterCol + " p-r-15 p-b-27");
    }
    let newDiv1 = document.createElement("div");
    newDiv1.setAttribute("class", "mtext-102 cl2 p-b-15");
    newDiv1.textContent = spanishFormat(label);
    newDiv.appendChild(newDiv1);  
    $container.append(newDiv);
    let containerElement;
    if (forTags) {
        containerElement = document.createElement("div");
        containerElement.setAttribute("class", "flex-w p-t-4 m-r--5");
        newDiv.appendChild(containerElement);
        return containerElement;
    }
    containerElement = document.createElement("ul");
    newDiv.appendChild(containerElement);  
    return containerElement;    
}

function addFilterLi(container, label, groupKey = null, active = false, action = null) {
    let newLi = document.createElement("li");
    newLi.setAttribute("class", "p-b-6");
    let newA = document.createElement("a");
    let aClass = "filter-link stext-106 trans-04";
    if (groupKey != null && groupKey.length > 0) {
        aClass += (" " + groupKey);
        newA.addEventListener('click', () => {
            if (action != null) {
                action();
                return;
            }
            if (currentFilter[groupKey] == normalizeText(label))
                delete currentFilter[groupKey];
            else
                currentFilter[groupKey] = normalizeText(label);
            delete currentFilter["feature"];
            $('.isotope-grid').isotope();
        });
    }
    if (active) aClass += " filter-link-active";
    newA.setAttribute("class", aClass);
    newA.setAttribute("href", "#"); 
    var text = spanishFormat(label);
    newA.textContent = text;
    newLi.appendChild(newA);
    container.appendChild(newLi);
    $(newA).on('click', function (event) { event.preventDefault() });
}

function addFilterDiv(container, label, groupKey = null, active = false) {
    let newA = document.createElement("a");
    let aClass = "flex-c-m stext-107 cl6 size-301 bor7 p-lr-15 hov-tag1 trans-04 m-r-5 m-b-5";
    if (groupKey != null && groupKey.length > 0) {
        aClass += (" " + groupKey);
        newA.addEventListener('click', () => {
            if (currentFilter[groupKey] == normalizeText(label))
                delete currentFilter[groupKey];
            else
                currentFilter[groupKey] = normalizeText(label);
            $('.isotope-grid').isotope();
        });
    }
    if (active) aClass = "flex-c-m stext-107 size-301 p-lr-15 hov-tag1 trans-04 m-r-5 m-b-5 filter-link-active-bor";
    newA.setAttribute("class", aClass);
    newA.setAttribute("href", "#");
    newA.textContent = spanishFormat(label);
    container.appendChild(newA);
}

function addProductCard($container, product, categoryKey, subcategoryKey, filterClass) {
    let filterPart = normalizeText(categoryKey);
    if (filterPart.length > 0) filterClass += " category-" + filterPart;
    filterPart = normalizeText(subcategoryKey);
    if (filterPart.length > 0) filterClass += " subcategory-" + filterPart;
    filterPart = normalizeText(product.Label);
    if (filterPart.length > 0) filterClass += " label-" + filterPart;
    product.Category = categoryKey;
    product.SubCategory = subcategoryKey;
    addProductCardBase($container, product, filterClass);
}

function sortProducts(sortBy, sortDirection, text) {
    $('.isotope-grid').isotope({ sortBy: sortBy, sortAscending: sortDirection == "asc" });
    $('.orderBy').each(function () {
        var item = $(this);
        item.removeClass('filter-link-active');
        if (item.text() == spanishFormat(text)) item.addClass('filter-link-active');              
    });
}

// ===== INICIALIZACIÓN =====
(function ($) {
    "use strict";
    $.getJSON("./data/products-index.json", function (data) {
        loadData($, data);
        $('.parallax100').parallax100();
        $('.gallery-lb').each(function () {
            $(this).magnificPopup({
                delegate: 'a',
                type: 'image',
                gallery: { enabled: true },
                mainClass: 'mfp-fade'
            });
        });
        $('.js-pscroll').each(function () {
            $(this).css('position', 'relative');
            $(this).css('overflow', 'hidden');
            var ps = new PerfectScrollbar(this, {
                wheelSpeed: 1,
                scrollingThreshold: 1000,
                wheelPropagation: false
            });
            $(window).on('resize', function () {
                ps.update();
            })
        });
        var windowH = $(window).height() / 2;
        $(window).on('scroll', function () {
            if ($(this).scrollTop() > windowH) {
                $("#myBtn").css('display', 'flex');
            } else {
                $("#myBtn").css('display', 'none');
            }
        });
        $('#myBtn').on("click", function () {
            $('html, body').animate({ scrollTop: 0 }, 300);
        });
        var headerDesktop = $('.container-menu-desktop');
        var wrapMenu = $('.wrap-menu-desktop');
        if ($('.top-bar').length > 0) {
            var posWrapHeader = $('.top-bar').height();
        } else {
            var posWrapHeader = 0;
        }
        if ($(window).scrollTop() > posWrapHeader) {
            $(headerDesktop).addClass('fix-menu-desktop');
            $(wrapMenu).css('top', 0);
        } else {
            $(headerDesktop).removeClass('fix-menu-desktop');
            $(wrapMenu).css('top', posWrapHeader - $(this).scrollTop());
        }
        $(window).on('scroll', function () {
            if ($(this).scrollTop() > posWrapHeader) {
                $(headerDesktop).addClass('fix-menu-desktop');
                $(wrapMenu).css('top', 0);
            } else {
                $(headerDesktop).removeClass('fix-menu-desktop');
                $(wrapMenu).css('top', posWrapHeader - $(this).scrollTop());
            }
        });
        $('.btn-show-menu-mobile').on('click', function () {
            $(this).toggleClass('is-active');
            $('.menu-mobile').slideToggle();
        });
        var arrowMainMenu = $('.arrow-main-menu-m');
        for (var i = 0; i < arrowMainMenu.length; i++) {
            $(arrowMainMenu[i]).on('click', function () {
                $(this).parent().find('.sub-menu-m').slideToggle();
                $(this).toggleClass('turn-arrow-main-menu-m');
            })
        }
        $(window).resize(function () {
            if ($(window).width() >= 992) {
                if ($('.menu-mobile').css('display') == 'block') {
                    $('.menu-mobile').css('display', 'none');
                    $('.btn-show-menu-mobile').toggleClass('is-active');
                }
                $('.sub-menu-m').each(function () {
                    if ($(this).css('display') == 'block') {
                        $(this).css('display', 'none');
                        $(arrowMainMenu).removeClass('turn-arrow-main-menu-m');
                    }
                });
            }
        });
        $('.js-show-modal-search').on('click', function () {
            $('.modal-search-header').addClass('show-modal-search');
            $(this).css('opacity', '0');
        });
        $('.js-hide-modal-search').on('click', function () {
            $('.modal-search-header').removeClass('show-modal-search');
            $('.js-show-modal-search').css('opacity', '1');
        });
        $('.container-search-header').on('click', function (e) {
            e.stopPropagation();
        });
        // Isotope se inicializa dentro de loadData, no aquí
        $('.js-show-filter').on('click', function (event) {
            event.preventDefault();
            $(this).toggleClass('show-filter');
            $('.panel-filter').slideToggle(400);
            if ($('.js-show-search').hasClass('show-search')) {
                $('.js-show-search').removeClass('show-search');
                $('.panel-search').slideUp(400);
            }
        });
        $('.js-show-search').on('click', function (event) {
            event.preventDefault();
            $(this).toggleClass('show-search');
            $('.panel-search').slideToggle(400);
            if ($('.js-show-filter').hasClass('show-filter')) {
                $('.js-show-filter').removeClass('show-filter');
                $('.panel-filter').slideUp(400);
            }
        });
        $('.btn-num-product-down').on('click', function () {
            var numProduct = Number($(this).next().val());
            if (numProduct > 0) $(this).next().val(numProduct - 1);
        });
        $('.btn-num-product-up').on('click', function () {
            var numProduct = Number($(this).prev().val());
            $(this).prev().val(numProduct + 1);
        });
    });
})(jQuery);
