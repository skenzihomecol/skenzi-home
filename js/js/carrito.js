
/* ==========================================
   SKENZI HOME — CARRITO DE COMPRAS
   ========================================== */

"use strict";

const CLAVE_CARRITO = "skenzi_carrito";
const NUMERO_WHATSAPP = "573105001079";

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosCarrito = [];

// LEER CARRITO
function leerCarrito() {
    try {
        const datos = JSON.parse(
            localStorage.getItem(CLAVE_CARRITO) || "[]"
        );

        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

// GUARDAR CARRITO
function guardarCarrito(carrito) {
    localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(carrito)
    );
}

// ESCAPAR TEXTO
function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// CARGAR PRODUCTOS DESDE SUPABASE
async function cargarCarrito() {

    const lista = document.getElementById("lista-carrito");

    if (!lista) return;

    const carrito = leerCarrito();

    if (!carrito.length) {
        mostrarCarrito();
        return;
    }

    try {

        if (!window.skenziDB) {
            throw new Error("No hay conexión con Supabase.");
        }

        const ids = carrito.map(item => item.id);

        const { data, error } = await window.skenziDB
            .from("productos")
            .select(`
                id,
                nombre,
                precio_venta,
                existencias,
                imagen_url,
                activo
            `)
            .in("id", ids);

        if (error) throw error;

        productosCarrito = data || [];

        mostrarCarrito();

    } catch (error) {

        console.error("Error al cargar el carrito:", error);

        lista.innerHTML = `
            <p class="carrito-vacio">
                No pudimos cargar tus productos.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR PRODUCTOS
function mostrarCarrito() {

    const lista = document.getElementById("lista-carrito");

    if (!lista) return;

    const carrito = leerCarrito();

    if (!carrito.length) {

        lista.innerHTML = `
            <div class="carrito-vacio">
                <h3>Tu carrito está vacío</h3>
                <p>Descubre nuestros productos y agrega tus favoritos.</p>
                <a href="index.html">Ir a la tienda</a>
            </div>
        `;

        actualizarResumen(0, 0);
        return;
    }

    let total = 0;
    let cantidadTotal = 0;

    lista.innerHTML = carrito.map(item => {

        const producto = productosCarrito.find(
            p => String(p.id) === String(item.id)
        );

        if (!producto) return "";

        const precio = Number(producto.precio_venta) || 0;
        const cantidad = Number(item.cantidad) || 1;
        const subtotal = precio * cantidad;

        total += subtotal;
        cantidadTotal += cantidad;

        const imagen = producto.imagen_url
            ? `<img src="${escapar(producto.imagen_url)}"
                alt="${escapar(producto.nombre)}">`
            : `<div class="imagen-vacia">🛍️</div>`;

        return `
            <article class="item-carrito">

                ${imagen}

                <div class="detalle-carrito">

                    <h3>${escapar(producto.nombre)}</h3>

                    <p>Precio: ${FORMATO_COP.format(precio)}</p>

                    <label>
                        Cantidad:
                        <input
                            class="cantidad-carrito"
                            type="number"
                            min="1"
                            max="${Number(producto.existencias) || 1}"
                            value="${cantidad}"
                            data-cantidad="${escapar(item.id)}"
                        >
                    </label>

                    <p>
                        Subtotal:
                        <strong>${FORMATO_COP.format(subtotal)}</strong>
                    </p>

                    <button
                        class="boton-quitar"
                        type="button"
                        data-quitar="${escapar(item.id)}"
                    >
                        Eliminar producto
                    </button>

                </div>

            </article>
        `;

    }).join("");

    actualizarResumen(cantidadTotal, total);
}

// ACTUALIZAR RESUMEN
function actualizarResumen(cantidad, total) {

    const cantidadElemento =
        document.getElementById("cantidad-productos");

    const subtotalElemento =
        document.getElementById("subtotal-carrito");

    const totalElemento =
        document.getElementById("total-carrito");

    if (cantidadElemento) {
        cantidadElemento.textContent = cantidad;
    }

    if (subtotalElemento) {
        subtotalElemento.textContent = FORMATO_COP.format(total);
    }

    if (totalElemento) {
        totalElemento.textContent = FORMATO_COP.format(total);
    }
}

// CAMBIAR CANTIDAD
function cambiarCantidad(id, cantidad) {

    const carrito = leerCarrito();

    const item = carrito.find(
        p => String(p.id) === String(id)
    );

    const producto = productosCarrito.find(
        p => String(p.id) === String(id)
    );

    if (!item || !producto) return;

    const nuevaCantidad = Math.floor(Number(cantidad));

    if (
        !Number.isFinite(nuevaCantidad) ||
        nuevaCantidad < 1 ||
        nuevaCantidad > Number(producto.existencias)
    ) {
        mostrarCarrito();
        alert("La cantidad supera las unidades disponibles.");
        return;
    }

    item.cantidad = nuevaCantidad;

    guardarCarrito(carrito);
    mostrarCarrito();
}

// ELIMINAR PRODUCTO
function quitarProducto(id) {

    const carrito = leerCarrito().filter(
        item => String(item.id) !== String(id)
    );

    guardarCarrito(carrito);
    productosCarrito = productosCarrito.filter(
        p => String(p.id) !== String(id)
    );

    mostrarCarrito();
}

// VACIAR CARRITO
function vaciarCarrito() {

    if (!leerCarrito().length) return;

    if (!confirm("¿Quieres eliminar todos los productos del carrito?")) {
        return;
    }

    guardarCarrito([]);
    productosCarrito = [];

    mostrarCarrito();
}

// ENVIAR PEDIDO POR WHATSAPP
function enviarPedido() {

    const carrito = leerCarrito();

    if (!carrito.length) {
        alert("Tu carrito está vacío.");
        return;
    }

    let total = 0;
    const lineas = [];

    for (const item of carrito) {

        const producto = productosCarrito.find(
            p => String(p.id) === String(item.id)
        );

        if (!producto) continue;

        const precio = Number(producto.precio_venta) || 0;
        const cantidad = Number(item.cantidad) || 1;

        if (
            !producto.activo ||
            Number(producto.existencias) < cantidad ||
            precio <= 0
        ) {
            alert(
                `Debes revisar la disponibilidad de ${producto.nombre}.`
            );
            return;
        }

        const subtotal = precio * cantidad;

        total += subtotal;

        lineas.push(
            `- ${producto.nombre} x ${cantidad}: ${FORMATO_COP.format(subtotal)}`
        );
    }

    if (!lineas.length) {
        alert("No hay productos disponibles para realizar el pedido.");
        return;
    }

    const mensaje = [
        "Hola, Skenzi Home. Quiero realizar este pedido:",
        "",
        ...lineas,
        "",
        `Total de productos: ${FORMATO_COP.format(total)}`,
        "",
        "Por favor, confirmen disponibilidad y costo de envío."
    ].join("\n");

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
}

// EVENTOS
document.addEventListener("DOMContentLoaded", () => {

    cargarCarrito();

    document.addEventListener("click", evento => {

        const quitar = evento.target.closest("[data-quitar]");

        if (quitar) {
            quitarProducto(quitar.dataset.quitar);
        }

    });

    document.addEventListener("change", evento => {

        const cantidad = evento.target.closest("[data-cantidad]");

        if (cantidad) {
            cambiarCantidad(
                cantidad.dataset.cantidad,
                cantidad.value
            );
        }

    });

    document.getElementById("vaciar-carrito")
        ?.addEventListener("click", vaciarCarrito);

    document.getElementById("pedido-whatsapp")
        ?.addEventListener("click", enviarPedido);

});
