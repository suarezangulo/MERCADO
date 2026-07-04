// ============================================================
// MAIN.JS - Interacciones de UI (menú, búsqueda, tabs, etc.)
// ============================================================

(function($) {
    'use strict';

    // ===== HAMBURGER MENU =====
    $('#hamburger').on('click', function() {
        $('#mobileMenu').toggleClass('mobile-menu--open');
    });

    // ===== SEARCH MODAL =====
    $('#searchToggle').on('click', function(e) {
        e.preventDefault();
        $('#searchModal').toggleClass('search-modal--open');
        if ($('#searchModal').hasClass('search-modal--open')) {
            $('.search-modal input').focus();
        }
    });
    $('#searchClose').on('click', function() {
        $('#searchModal').removeClass('search-modal--open');
    });
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('#searchModal').removeClass('search-modal--open');
        }
    });

    // ===== FILTER PANEL =====
    $('#filterToggle').on('click', function(e) {
        e.preventDefault();
        $('#filterPanel').toggleClass('panel--open');
    });

    // ===== BACK TO TOP =====
    var windowH = $(window).height() / 2;
    $(window).on('scroll', function() {
        if ($(this).scrollTop() > windowH) {
            $('#backTop').fadeIn(200);
        } else {
            $('#backTop').fadeOut(200);
        }
    });
    $('#backTop').on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 400);
    });

    // ===== CART ICON (redirect) =====
    $('#cartIcon').on('click', function() {
        window.location.href = 'cart.html';
    });

    // ===== QTY SELECTOR (para detalle) =====
    $(document).on('click', '.qty-selector__btn--minus', function() {
        var input = $(this).siblings('.qty-selector__input');
        var val = parseInt(input.val()) || 0;
        if (val > 1) input.val(val - 1);
    });
    $(document).on('click', '.qty-selector__btn--plus', function() {
        var input = $(this).siblings('.qty-selector__input');
        var val = parseInt(input.val()) || 0;
        if (val < 99) input.val(val + 1);
    });

    // ===== TABS (para detalle) =====
    $(document).on('click', '.tabs__btn', function() {
        var tabId = $(this).data('tab');
        $('.tabs__btn').removeClass('tabs__btn--active');
        $(this).addClass('tabs__btn--active');
        $('.tabs__panel').removeClass('tabs__panel--active');
        $('#tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1)).addClass('tabs__panel--active');
    });

    // ===== FILTER TABS (categorías) =====
    $(document).on('click', '.filters__tabs button', function() {
        // La lógica de filtrado está en index.js, aquí solo añadimos clase activa
        // Pero no duplicamos, se maneja en index.js
    });

    // ===== ANIMSITION (si existe) =====
    if ($.fn.animsition) {
        $('.animsition').animsition({
            inClass: 'fade-in',
            outClass: 'fade-out',
            inDuration: 500,
            outDuration: 300,
            linkElement: '.animsition-link',
            loading: true,
            loadingParentElement: 'html',
            loadingClass: 'animsition-loading-1',
            loadingInner: '<div class="loader05"></div><p style="margin-top:40px; text-align:center;">Cargando...</p>',
            timeout: false,
            timeoutCountdown: 5000,
            onLoadEvent: true,
            browser: ['animation-duration', '-webkit-animation-duration'],
            overlay: false,
            overlayClass: 'animsition-overlay-slide',
            overlayParentElement: 'html',
            transition: function(url) { window.location.href = url; }
        });
    }

    // ===== PARALLAX (si existe) =====
    if ($.fn.parallax100) {
        $('.parallax100').parallax100();
    }

    // ===== SLICK (si existe) =====
    if ($.fn.slick) {
        $('.slick2').slick({
            slidesToShow: 4,
            slidesToScroll: 4,
            infinite: false,
            autoplay: false,
            arrows: true,
            prevArrow: '<button class="arrow-slick2 prev-slick2"><i class="fa fa-angle-left"></i></button>',
            nextArrow: '<button class="arrow-slick2 next-slick2"><i class="fa fa-angle-right"></i></button>',
            responsive: [
                { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 3 } },
                { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }
            ]
        });
    }

    // ===== PERFECT SCROLLBAR =====
    if (typeof PerfectScrollbar !== 'undefined') {
        $('.js-pscroll').each(function() {
            var ps = new PerfectScrollbar(this, {
                wheelSpeed: 1,
                scrollingThreshold: 1000,
                wheelPropagation: false
            });
            $(window).on('resize', function() { ps.update(); });
        });
    }

})(jQuery);
