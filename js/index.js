// ===== PANEL DE DEPURACIÓN =====
function debug(msg) {
    var panel = document.getElementById('debugPanel');
    if (panel) panel.innerHTML = msg;
}

// ===== VARIABLES GLOBALES =====
var filterData = [];
var filterTree = [];
var currentFilter = {};
var gTagCategory = "";
var gTagSubCategory = "";

// ===== INICIALIZAR ISOTOPE =====
function initIsotope() {
    var $grid = $('.isotope-grid');
    if ($grid.data('isotope')) $grid.isotope('destroy');
    $grid.isotope({
        itemSelector: '.isotope-item',
        layoutMode: 'fitRows',
        percentPosition: true,
        sortBy: 'update',
        sortAscending: false,
        animationEngine: 'best-available',
        masonry: { columnWidth: '.isotope-item' },
        getSortData: {
            price: '[data-price-usd] parseFloat',
            update: '[data-update] parseFloat'
        }
    });
    debug('Isotope listo. Productos: ' + $('.isotope-item').length);
}

// ===== APLICAR FILTRO DE CATEGORÍA (SIN TOCAR BUSCADOR) =====
function applyFilterAndSort() {
    var $grid = $('.isotope-grid');
    if (!$grid.data('isotope')) { debug('Error: Isotope no inicializado'); return; }

    // Filtrar con Isotope usando función
    $grid.isotope('filter', function() {
        var $item = $(this);
        if (!currentFilter.category) return true;
        var show = $item.hasClass('category-' + currentFilter.category);
        if (currentFilter.subcategory) {
            show = show && $item.hasClass('subcategory-' + currentFilter.subcategory);
        }
        return show;
    });

    // Ordenar
    if (currentFilter.orderBy) {
        var sortBy = 'update', sortAsc = false;
        if (currentFilter.orderBy === 'price-asc') { sortBy = 'price'; sortAsc = true; }
        else if (currentFilter.orderBy === 'price-desc') { sortBy = 'price'; sortAsc = false; }
        else if (currentFilter.orderBy === 'update') { sortBy = 'update'; sortAsc = false; }
        $grid.isotope({ sortBy: sortBy, sortAscending: sortAsc });
    }

    // Reorganizar layout
    $grid.isotope('layout');

    // Depuración
    var visible = $grid.find('.isotope-item').filter(function() { return $(this).css('display') !== 'none'; }).length;
    var total = $grid.find('.isotope-item').length;
    debug('Filtro: ' + (currentFilter.category || 'todo') + ' | Visibles: ' + visible + '/' + total);
}

function loadData($, data) {
    let $topeContainer = $('.isotope-grid').first();
    let $filterContent = $('#filterDropdownContent');

    $topeContainer.empty();
    for (let i = 0; i < 8; i++) {
        let skeleton = document.createElement("div");
        skeleton.setAttribute("class", "col-sm-6 col-md-4 col-lg-3 p-b-60");
        skeleton.innerHTML = `<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-text"><div class="skeleton-title"></div><div class="skeleton-desc"></div><div class="skeleton-price"></div></div></div>`;
        $topeContainer.append(skeleton);
    }

    var urlParams = new URLSearchParams(window.location.search);
    var categoryKeyParam = urlParams.get('category');
    if (categoryKeyParam) {
        currentFilter.category = categoryKeyParam;
        var subcategoryKey = urlParams.get('subcategory');
        if (subcategoryKey) currentFilter.subcategory = subcategoryKey;
    }

    setTimeout(function() {
        $topeContainer.find('.skeleton-card').parent().remove();

        for (const categoryKey in data) {
            if (!filterTree[categoryKey]) filterTree[categoryKey] = {};
            filterData[normalizeText(categoryKey)] = categoryKey;
            const category = data[categoryKey];
            for (const subcategoryKey in category) {
                filterData[normalizeText(subcategoryKey)] = subcategoryKey;
                if (!filterTree[categoryKey][subcategoryKey]) filterTree[categoryKey][subcategoryKey] = [];
                const subcategory = category[subcategoryKey];
                for (const productKey in subcategory) {
                    const product = subcategory[productKey];
                    addProductCard($topeContainer, product, categoryKey, subcategoryKey, '');
                }
            }
        }

        initIsotope();

        $filterContent.empty();

        // Categorías
        var catSection = document.createElement("div");
        catSection.className = "p-b-20";
        catSection.innerHTML = '<div class="mtext-102 cl2 p-b-10">Categorías</div>';
        var catContainer = document.createElement("div");
        catContainer.className = "flex-w p-t-4";
        catContainer.id = "categoryFiltersContainer";
        catSection.appendChild(catContainer);
        $filterContent.append(catSection);

        var $catContainer = $('#categoryFiltersContainer');
        addCategoryTag($catContainer, "Todos", null, !currentFilter.category);
        for (const cat in data) {
            addCategoryTag($catContainer, cat, normalizeText(cat), currentFilter.category === normalizeText(cat));
        }

        // Ordenar por
        var orderSection = document.createElement("div");
        orderSection.className = "p-b-20";
        orderSection.innerHTML = '<div class="mtext-102 cl2 p-b-10">Ordenar por</div>';
        var orderList = document.createElement("ul");
        orderSection.appendChild(orderList);
        $filterContent.append(orderSection);
        addOrderLi(orderList, "Recientes", "update", !currentFilter.orderBy || currentFilter.orderBy === 'update');
        addOrderLi(orderList, "Más económicos", "price-asc", currentFilter.orderBy === 'price-asc');
        addOrderLi(orderList, "Más costosos", "price-desc", currentFilter.orderBy === 'price-desc');

        // Subcategorías
        $filterContent.append('<div id="subcategorySection" class="p-b-20"></div>');
        updateSubcategoryFilters();

        // Aplicar filtro inicial si vino de URL
        if (currentFilter.category) applyFilterAndSort();

        // Buscador: siempre activo, respeta el filtro de categoría actual
        $('[name="search-product"]').keyup(debounce(function() {
            var text = $(this).val().toLowerCase();
            $('.isotope-grid').isotope({
                filter: function() {
                    var $item = $(this);
                    var label = $item.find('.js-name-b2').text().toLowerCase();
                    var features = $item.find('.cl4.stext-111').text().toLowerCase();
                    var matchesSearch = !text || label.includes(text) || features.includes(text);
                    if (currentFilter.category) {
                        var catMatch = $item.hasClass('category-' + currentFilter.category);
                        if (currentFilter.subcategory) {
                            catMatch = catMatch && $item.hasClass('subcategory-' + currentFilter.subcategory);
                        }
                        return matchesSearch && catMatch;
                    }
                    return matchesSearch;
                }
            });
        }, 400));

        new LazyLoad({
            elements_selector: "img[data-src]",
            callback_loaded: function() { $('.isotope-grid').isotope('layout'); }
        });

    }, 600);
}

// ===== BOTONES DE CATEGORÍA =====
function addCategoryTag($container, label, filterValue, active) {
    var btn = document.createElement("button");
    btn.className = "mica-pill-btn" + (active ? " active" : "");
    btn.textContent = spanishFormat(label);
    btn.addEventListener('click', function() {
        if (filterValue === null) {
            delete currentFilter.category;
            delete currentFilter.subcategory;
        } else {
            currentFilter.category = filterValue;
            delete currentFilter.subcategory;
        }
        applyFilterAndSort();
        updateSubcategoryFilters();
        $('#categoryFiltersContainer .mica-pill-btn').removeClass('active');
        $(btn).addClass('active');
    });
    $container.append(btn);
}

function addOrderLi(container, label, orderValue, active) {
    var li = document.createElement("li");
    li.className = "p-b-6";
    var a = document.createElement("a");
    a.className = "filter-link" + (active ? " filter-link-active" : "");
    a.href = "#";
    a.textContent = spanishFormat(label);
    a.addEventListener('click', function(e) {
        e.preventDefault();
        currentFilter.orderBy = orderValue;
        applyFilterAndSort();
        $(container).find('.filter-link').removeClass('filter-link-active');
        $(a).addClass('filter-link-active');
    });
    li.appendChild(a);
    container.appendChild(li);
}

function updateSubcategoryFilters() {
    var $section = $('#subcategorySection');
    $section.empty();
    if (!currentFilter.category) return;

    var catKey = filterData[currentFilter.category];
    if (!catKey || !filterTree[catKey]) return;

    var subcategories = Object.keys(filterTree[catKey]);
    if (subcategories.length === 0) return;

    var titleDiv = document.createElement("div");
    titleDiv.className = "mtext-102 cl2 p-b-10";
    titleDiv.textContent = "Subcategorías";
    $section.append(titleDiv);

    var container = document.createElement("div");
    container.className = "flex-w p-t-4";
    subcategories.sort().forEach(function(sub) {
        var normalizedSub = normalizeText(sub);
        var a = document.createElement("a");
        a.className = "filter-link" + (currentFilter.subcategory === normalizedSub ? " filter-link-active" : "");
        a.href = "#";
        a.textContent = sub;
        a.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentFilter.subcategory === normalizedSub) delete currentFilter.subcategory;
            else currentFilter.subcategory = normalizedSub;
            applyFilterAndSort();
            updateSubcategoryFilters();
        });
        container.appendChild(a);
    });
    $section.append(container);
}

function debounce(fn, threshold) {
    var timeout;
    threshold = threshold || 100;
    return function() {
        clearTimeout(timeout);
        var args = arguments, _this = this;
        timeout = setTimeout(function() { fn.apply(_this, args); }, threshold);
    };
}

function addProductCard($container, product, categoryKey, subcategoryKey, filterClass) {
    var normalizedCat = normalizeText(categoryKey);
    var normalizedSub = normalizeText(subcategoryKey);
    var normalizedLabel = normalizeText(product.Label);
    filterClass += " category-" + normalizedCat + " subcategory-" + normalizedSub + " label-" + normalizedLabel;
    product.Category = categoryKey;
    product.SubCategory = subcategoryKey;
    addProductCardBase($container, product, filterClass);
}

// ===== INICIALIZACIÓN =====
(function ($) {
    "use strict";
    $.getJSON("./data/products-index.json", function (data) {
        loadData($, data);
        $('.parallax100').parallax100();
        $('.gallery-lb').magnificPopup({ delegate: 'a', type: 'image', gallery: { enabled: true }, mainClass: 'mfp-fade' });
        $('.js-pscroll').each(function () {
            $(this).css({ position: 'relative', overflow: 'hidden' });
            var ps = new PerfectScrollbar(this, { wheelSpeed: 1, scrollingThreshold: 1000, wheelPropagation: false });
            $(window).on('resize', function () { ps.update(); });
        });
        var windowH = $(window).height() / 2;
        $(window).on('scroll', function () {
            if ($(this).scrollTop() > windowH) $("#myBtn").css('display', 'flex');
            else $("#myBtn").css('display', 'none');
        });
        $('#myBtn').on("click", function () { $('html, body').animate({ scrollTop: 0 }, 300); });
        var headerDesktop = $('.container-menu-desktop');
        var wrapMenu = $('.wrap-menu-desktop');
        var posWrapHeader = $('.top-bar').length > 0 ? $('.top-bar').height() : 0;
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
        var $filterBtn = $('.js-show-filter');
        var $dropdown = $('#filterDropdown');
        $filterBtn.on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $dropdown.toggleClass('show');
        });
        $(document).on('click', function (e) {
            if (!$(e.target).closest('#filterButtonContainer').length) $dropdown.removeClass('show');
        });
        $('.js-show-search').on('click', function (e) {
            e.preventDefault();
            $(this).toggleClass('show-search');
            $('.panel-search').slideToggle(400);
            $dropdown.removeClass('show');
        });
    });
})(jQuery);
