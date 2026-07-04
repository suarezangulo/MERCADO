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
            $('#backTop').css('display', 'flex');
        } else {
            $('#backTop').css('display', 'none');
        }
    });
    $('#backTop').on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 400);
    });

    // ===== CART ICON (redirect) =====
    $('#cartIcon').on('click', function() {
        window.location.href = 'cart.html';
    });

    // ===== QTY SELECTOR =====
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

    // ===== TABS =====
    $(document).on('click', '.tabs__btn', function() {
        var tabId = $(this).data('tab');
        $('.tabs__btn').removeClass('tabs__btn--active');
        $(this).addClass('tabs__btn--active');
        $('.tabs__panel').removeClass('tabs__panel--active');
        $('#tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1)).addClass('tabs__panel--active');
    });

    // ===== FILTER TABS =====
    $(document).on('click', '.filters__tabs button', function() {
        $('.filters__tabs button').removeClass('active');
        $(this).addClass('active');
    });

})(jQuery);
