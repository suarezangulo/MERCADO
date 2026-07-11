// ============================================================
// MAIN.JS
// ============================================================

(function(n) {
    "use strict";

    // ============================================
    // NOTIFICAR AL PADRE CUANDO CAMBIA LA URL
    // ============================================
    (function notifyParentOnNavigation() {
        // Función para enviar la URL actual al padre
        function sendUrlToParent() {
            if (window.parent && window.parent !== window) {
                const currentUrl = window.location.href;
                window.parent.postMessage({
                    type: 'iframeNavigation',
                    url: currentUrl
                }, '*'); // '*' permite cualquier origen (puedes limitarlo a tu dominio de InfinityFree)
            }
        }

        // Enviar la URL cuando se carga la página
        sendUrlToParent();

        // Escuchar cambios en el historial (para SPA o navegación con hash)
        let lastUrl = window.location.href;
        setInterval(function() {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                sendUrlToParent();
            }
        }, 500); // Verificar cada 500ms

        // También detectar clicks en enlaces (método alternativo)
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                // Si es un enlace interno, esperar a que cargue y notificar
                setTimeout(sendUrlToParent, 300);
            }
        });

        // Detecta cambios de hash (para SPAs)
        window.addEventListener('hashchange', function() {
            sendUrlToParent();
        });
    })();

    // ============================================
    // CÓDIGO ORIGINAL DE MAIN.JS
    // ============================================

    var h = n(window).height() / 2;
    var t, i, r, u, f, o, s, e;

    // Botón "Volver arriba"
    n(window).on("scroll", function() {
        n(this).scrollTop() > h ? n("#myBtn").css("display", "flex") : n("#myBtn").css("display", "none");
    });

    n("#myBtn").on("click", function() {
        n("html, body").animate({ scrollTop: 0 }, 300);
    });

    // Header fijo
    t = n(".container-menu-desktop");
    i = n(".wrap-menu-desktop");
    r = n(".top-bar").length > 0 ? n(".top-bar").height() : 0;

    n(window).scrollTop() > r ? (n(t).addClass("fix-menu-desktop"), n(i).css("top", 0)) : (n(t).removeClass("fix-menu-desktop"), n(i).css("top", r - n(this).scrollTop()));

    n(window).on("scroll", function() {
        n(this).scrollTop() > r ? (n(t).addClass("fix-menu-desktop"), n(i).css("top", 0)) : (n(t).removeClass("fix-menu-desktop"), n(i).css("top", r - n(this).scrollTop()));
    });

    // Menú móvil
    n(".btn-show-menu-mobile").on("click", function() {
        n(this).toggleClass("is-active");
        n(".menu-mobile").slideToggle();
    });

    for (u = n(".arrow-main-menu-m"), f = 0; f < u.length; f++) {
        n(u[f]).on("click", function() {
            n(this).parent().find(".sub-menu-m").slideToggle();
            n(this).toggleClass("turn-arrow-main-menu-m");
        });
    }

    n(window).resize(function() {
        if (n(window).width() >= 992) {
            if (n(".menu-mobile").css("display") == "block") {
                n(".menu-mobile").css("display", "none");
                n(".btn-show-menu-mobile").toggleClass("is-active");
            }
            n(".sub-menu-m").each(function() {
                if (n(this).css("display") == "block") {
                    console.log("hello");
                    n(this).css("display", "none");
                    n(u).removeClass("turn-arrow-main-menu-m");
                }
            });
        }
    });

    // Búsqueda modal
    n(".js-show-modal-search").on("click", function() {
        n(".modal-search-header").addClass("show-modal-search");
        n(this).css("opacity", "0");
    });

    n(".js-hide-modal-search").on("click", function() {
        n(".modal-search-header").removeClass("show-modal-search");
        n(".js-show-modal-search").css("opacity", "1");
    });

    n(".container-search-header").on("click", function(n) {
        n.stopPropagation();
    });

    // Isotope - filtros
    o = n(".isotope-grid");
    s = n(".filter-tope-group");

    s.each(function() {
        s.on("click", "button", function() {
            var t = n(this).attr("data-filter");
            o.isotope({ filter: t });
        });
    });

    n(window).on("load", function() {
        var t = o.each(function() {
            n(this).isotope({
                itemSelector: ".isotope-item",
                layoutMode: "fitRows",
                percentPosition: true,
                animationEngine: "best-available",
                masonry: { columnWidth: ".isotope-item" }
            });
        });
    });

    e = n(".filter-tope-group button");
    n(e).each(function() {
        n(this).on("click", function() {
            for (var t = 0; t < e.length; t++) n(e[t]).removeClass("how-active1");
            n(this).addClass("how-active1");
        });
    });

    // Panel de filtros
    n(".js-show-filter").on("click", function() {
        n(this).toggleClass("show-filter");
        n(".panel-filter").slideToggle(400);
        if (n(".js-show-search").hasClass("show-search")) {
            n(".js-show-search").removeClass("show-search");
            n(".panel-search").removeClass("show");
        }
    });

    // Panel de búsqueda
    n(".js-show-search").on("click", function(e) {
        e.preventDefault();
        console.log("🔍 Click en Buscar");
        var panel = n(".panel-search");
        panel.toggleClass("show");
        console.log("Panel tiene clase show:", panel.hasClass("show"));
        if (n(".js-show-filter").hasClass("show-filter")) {
            n(".js-show-filter").removeClass("show-filter");
            n(".panel-filter").slideUp(400);
        }
    });

    // Carrito
    n(".js-show-cart").on("click", function() {
        n(".js-panel-cart").addClass("show-header-cart");
    });

    n(".js-hide-cart").on("click", function() {
        n(".js-panel-cart").removeClass("show-header-cart");
    });

    // Sidebar
    n(".js-show-sidebar").on("click", function() {
        n(".js-sidebar").addClass("show-sidebar");
    });

    n(".js-hide-sidebar").on("click", function() {
        n(".js-sidebar").removeClass("show-sidebar");
    });

    // Controles de cantidad
    n(".btn-num-product-down").on("click", function() {
        var t = Number(n(this).next().val());
        if (t > 0) n(this).next().val(t - 1);
    });

    n(".btn-num-product-up").on("click", function() {
        var t = Number(n(this).prev().val());
        n(this).prev().val(t + 1);
    });

    // Sistema de rating
    n(".wrap-rating").each(function() {
        var t = n(this).find(".item-rating"),
            i = -1,
            r = n(this).find("input");
        n(r).val(0);

        n(t).on("mouseenter", function() {
            for (var u = t.index(this), i = 0; i <= u; i++) {
                n(t[i]).removeClass("zmdi-star-outline");
                n(t[i]).addClass("zmdi-star");
            }
            for (var r = i; r < t.length; r++) {
                n(t[r]).addClass("zmdi-star-outline");
                n(t[r]).removeClass("zmdi-star");
            }
        });

        n(t).on("click", function() {
            var u = t.index(this);
            i = u;
            n(r).val(u + 1);
        });

        n(this).on("mouseleave", function() {
            for (var r = 0; r <= i; r++) {
                n(t[r]).removeClass("zmdi-star-outline");
                n(t[r]).addClass("zmdi-star");
            }
            for (var u = r; u < t.length; u++) {
                n(t[u]).addClass("zmdi-star-outline");
                n(t[u]).removeClass("zmdi-star");
            }
        });
    });

    // Modal
    n(".js-show-modal1").on("click", function(t) {
        t.preventDefault();
        n(".js-modal1").addClass("show-modal1");
    });

    n(".js-hide-modal1").on("click", function() {
        n(".js-modal1").removeClass("show-modal1");
    });

})(jQuery);
