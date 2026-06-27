// ===== VARIABLE GLOBAL PARA ALMACENAR PRODUCTOS POR SLUG =====
var productSlugs = {};

// ===== FUNCIÓN AUXILIAR: convertir valor a moneda preferida =====
function convertirAMonedaPreferida(valor, monedaOriginal) {
    var monedaPref = getMonedaPreferida();
    var tasa = typeof TASA_CAMBIO !== 'undefined' ? TASA_CAMBIO : 685;
    var resultado;
    if (monedaOriginal === monedaPref) {
        resultado = valor;
    } else if (monedaOriginal === 'CUP' && monedaPref === 'USD') {
        resultado = valor / tasa;
    } else if (monedaOriginal === 'USD' && monedaPref === 'CUP') {
        resultado = valor * tasa;
    } else {
        resultado = valor;
    }
    return resultado;
}

function addCartItem(n, t, i) {
    if (n == null || t == null || i == null) return false;
    let e = document.createElement("tr");
    e.setAttribute("class", "table_row");
    let r = document.createElement("td");
    r.setAttribute("class", "column-1");
    let u = document.createElement("div");
    u.setAttribute("class", "how-itemcart1");
    u.addEventListener("click", () => removeCartItemFromView(i.slug, $(e)));
    let h = document.createElement("img");
    h.setAttribute("src", "./images/products/" + i.slug + "-0.webp");
    h.setAttribute("alt", "imagen del artículo");
    h.setAttribute("loading", "lazy");
    u.appendChild(h);
    r.appendChild(u);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-2");
    let aElement = document.createElement("a");
    aElement.setAttribute("class", "cl3");
    aElement.setAttribute("href", "product.html?id=" + i.slug);
    aElement.textContent = i.Label;
    r.appendChild(aElement);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-3");
    let partesPrecio = i.Price.split(' ');
    let valorPrecio = parseFloat(partesPrecio[0]);
    let monedaOriginal = partesPrecio[1] || 'USD';
    let valorConvertido = convertirAMonedaPreferida(valorPrecio, monedaOriginal);
    r.textContent = toMoneyStr(valorConvertido);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-4");
    u = document.createElement("div");
    u.setAttribute("class", "wrap-num-product flex-w m-l-auto m-r-0");
    let o = document.createElement("div");
    o.setAttribute("class", "btn-num-product-down cl8 hov-btn3 trans-04 flex-c-m");
    let s = document.createElement("i");
    s.setAttribute("class", "fs-16 zmdi zmdi-minus");
    o.appendChild(s);
    u.appendChild(o);
    let f = document.createElement("input");
    f.setAttribute("class", "mtext-104 cl3 txt-center num-product");
    f.setAttribute("type", "number");
    f.setAttribute("name", "num-" + i.slug);
    f.setAttribute("value", t.qty);
    f.setAttribute("min", 0);
    f.setAttribute("max", 99);
    f.setAttribute("price", i.Price);
    f.setAttribute("label", i.Label);
    f.addEventListener("input", () => updateCartTotals());
    u.appendChild(f);
    o = document.createElement("div");
    o.setAttribute("class", "btn-num-product-up cl8 hov-btn3 trans-04 flex-c-m");
    s = document.createElement("i");
    s.setAttribute("class", "fs-16 zmdi zmdi-plus");
    o.appendChild(s);
    u.appendChild(o);
    r.appendChild(u);
    e.appendChild(r);
    r = document.createElement("td");
    r.setAttribute("class", "column-5");
    let subtotalOriginal = valorPrecio * t.qty;
    let subtotalConvertido = convertirAMonedaPreferida(subtotalOriginal, monedaOriginal);
    r.textContent = toMoneyStr(subtotalConvertido);
    e.appendChild(r);
    n.append(e);
    return true;
}

function cargarProductSlugs(callback) {
    console.log('Cargando productSlugs...');
    $.getJSON("./data/products-index.json", function(t) {
        if (t != null) {
            productSlugs = {}; // Reiniciamos como objeto
            for (let n in t) {
                let i = t[n];
                for (let n in i) {
                    let t = i[n];
                    for (let n of t) {
                        let slug = ToSlug(n.Label);
                        n.slug = slug;
                        productSlugs[slug] = n;
                    }
                }
            }
            console.log('productSlugs cargado:', Object.keys(productSlugs).length, 'productos');
            if (callback) callback();
        } else {
            console.error('Error: products-index.json no encontrado');
        }
    }).fail(function() {
        console.error('Error al cargar products-index.json');
        setTimeout(function() {
            cargarProductSlugs(callback);
        }, 2000);
    });
}

function updateCart() {
    console.log('updateCart ejecutado');
    let i = $(".table-shopping-cart");
    i.empty();
    
    let t = document.createElement("tr");
    t.setAttribute("class", "table_head");
    let n = document.createElement("th");
    n.setAttribute("class", "column-1");
    n.textContent = spanishFormat("Articulo");
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-2");
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-3");
    n.textContent = "Precio";
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-4");
    n.textContent = "Cantidad";
    t.appendChild(n);
    n = document.createElement("th");
    n.setAttribute("class", "column-5");
    n.textContent = "Total";
    t.appendChild(n);
    i.append(t);

    let r = getCart();
    console.log('Items en carrito:', r.items);
    
    if (!r.items || r.items.length === 0) {
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        cell.setAttribute("colspan", "5");
        cell.setAttribute("class", "stext-102 cl6 p-t-20 p-b-20 txt-center");
        cell.textContent = "No hay productos en tu cesta";
        row.appendChild(cell);
        i.append(row);
        updateCartTotals(false);
        return;
    }

    if (!productSlugs || Object.keys(productSlugs).length === 0) {
        console.log('productSlugs vacío, cargando...');
        cargarProductSlugs(function() {
            updateCart();
        });
        return;
    }

    let itemsNoEncontrados = [];
    for (let item of r.items) {
        if (productSlugs[item.productId]) {
            addCartItem(i, item, productSlugs[item.productId]);
        } else {
            console.warn('Producto no encontrado:', item.productId);
            itemsNoEncontrados.push(item.productId);
        }
    }
    for (let id of itemsNoEncontrados) {
        removeCartItem(r, id);
    }

    // Actualizar eventos de los botones +/-
    $(".btn-num-product-down").off("click").on("click", function() {
        let input = $(this).next();
        var val = Number(input.val());
        if (val > 0) {
            input.val(val - 1).change();
            updateCartTotals();
        }
    });
    $(".btn-num-product-up").off("click").on("click", function() {
        let input = $(this).prev();
        var val = Number(input.val());
        if (val < 99) {
            input.val(val + 1).change();
            updateCartTotals();
        }
    });
    updateCartTotals(false);
}

function clearCart() {
    let n = getCart();
    n.items = [];
    addStorage("cart", n);
    updateCart();
}

function updateCartTotals(guardarEnStorage = true) {
    let itemsActualizados = { items: [] };
    let totalCUP = 0;
    let totalUSD = 0;

    $(".num-product").each(function(index, elemento) {
        let productId = $(elemento).attr("name").substring(4);
        let cantidad = parseFloat($(elemento).val()) || 0;
        let precioStr = $(elemento).attr("price");
        let partes = precioStr.split(' ');
        let valorNumerico = parseFloat(partes[0]);
        let moneda = partes[1] || 'USD';
        let subtotalOriginal = valorNumerico * cantidad;

        if (moneda === 'CUP') {
            totalCUP += subtotalOriginal;
        } else {
            totalUSD += subtotalOriginal;
        }

        itemsActualizados.items.push({ productId: productId, qty: cantidad });
        let celdaTotalProducto = $(this).parent().parent().next();
        let subtotalConvertido = convertirAMonedaPreferida(subtotalOriginal, moneda);
        celdaTotalProducto.text(toMoneyStr(subtotalConvertido));
    });

    let monedaPref = getMonedaPreferida();
    let tasa = typeof TASA_CAMBIO !== 'undefined' ? TASA_CAMBIO : 685;
    
    let totalGeneralConvertido = 0;
    if (monedaPref === 'CUP') {
        totalGeneralConvertido = totalCUP + (totalUSD * tasa);
    } else {
        totalGeneralConvertido = totalUSD + (totalCUP / tasa);
    }

    let totalText = toMoneyStr(totalGeneralConvertido, monedaPref);
    
    let otraMoneda = monedaPref === 'CUP' ? 'USD' : 'CUP';
    let totalEquivalente;
    if (monedaPref === 'CUP') {
        totalEquivalente = totalGeneralConvertido / tasa;
    } else {
        totalEquivalente = totalGeneralConvertido * tasa;
    }
    
    if (totalEquivalente > 0) {
        totalText += ' ≈ ' + toMoneyStr(totalEquivalente, otraMoneda);
    }

    $(".mtext-110.cl2").text(totalText);

    if (guardarEnStorage) {
        addStorage("cart", itemsActualizados);
        updateCartQty();
    }
}

function removeCartItemFromView(n, t) {
    swal({
        title: "¿Eliminar artículo?",
        text: "¿Estás seguro de eliminar este producto?",
        icon: "warning",
        buttons: ["Cancelar", "Eliminar"],
        dangerMode: true,
    }).then(function(r) {
        if (r) {
            let u = getCart();
            removeCartItem(u, n);
            addStorage("cart", u);
            t.remove();
            updateCartTotals();
            updateCartQty();
            swal("Eliminado", "El producto ha sido eliminado.", "success");
        }
    });
}

function removeCartItem(n, t) {
    var i = n.items.findIndex(n => n.productId === t);
    if (i !== -1) {
        n.items.splice(i, 1);
        updateCartTotals();
    }
    return n;
}
