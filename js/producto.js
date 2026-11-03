
/* ==========================================
   SKENZI HOME — INFORMACIÓN INDIVIDUAL
   ========================================== */

"use strict";

const WHATSAPP_PRODUCTO = "573105001079";

const formatoPrecioProducto = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productoActual = null;

function escaparProducto(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// OBTENER EL IDENTIFICADOR DE LA URL
async function cargarDetalleProducto() {

    const contenedor = document.getElementById("detalle-producto");

    const parametros = new URLSearchParams(window.location.search);
    const idProducto = parametros.get("id");

    if (!idProducto) {
        mostrarErrorProducto("No se ha seleccionado ningún producto.");
        return;
    }

    try {

        if (!window.skenziDB) {
            throw new Error("No hay conexión con la base de datos.");
        }

        const { data, error } = await window.skenziDB
            .from("productos")
            .select(`
                id,
                nombre,
                descripcion,
                precio_venta,
                existencias,
                imagen_url,
                activo,
                categoria_id,
                categorias(nombre)
            `)
            .eq("id", idProducto)
            .eq("activo", true)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            mostrarErrorProducto("Este producto no está disponible.");
            return;
        }

        productoActual = data;

        mostrarDetalleProducto(data);

    } catch (error) {

        console.error("Error al consultar el producto:", error);

        mostrarErrorProducto(
            "No fue posible cargar la información. Intenta nuevamente."
        );
    }
}

// MOSTRAR INFORMACIÓN
function mostrarDetalleProducto(producto) {

    const contenedor = document.getElementById("detalle-producto");

    const nombre = producto.nombre || "Producto sin nombre";
    const descripcion = producto.descripcion || "Consulta más información con nuestro equipo.";
    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;
    const categoria = Array.isArray(producto.categorias)
        ? producto.categorias[0]?.nombre
        : producto.categorias?.nombre;

    const imagen = producto.imagen_url
        ? `
            <img
                src="${escaparProducto(producto.imagen_url)}"
                alt="${escaparProducto(nombre)}"
            >
        `
        : `<div class="imagen-vacia">🛍️</div>`;

    const disponibilidad = existencias > 0
        ? `<span class="estado-disponible">Disponible</span>`
        : `<span class="estado-agotado">Agotado</span>`;

    contenedor.innerHTML = `

        <div class="imagen-principal">
            ${imagen}
        </div>

        <div class="informacion-producto">

            <p class="categoria-producto">
                ${escaparProducto(categoria || "Skenzi Home")}
            </p>

            <h1>${escaparProducto(nombre)}</h1>

            <p class="descripcion-detallada">
                ${escaparProducto(descripcion)}
            </p>

            <p class="precio-detallado">
                ${precio > 0
                    ? formatoPrecioProducto.format(precio)
                    : "Consultar precio"}
            </p>

            <p class="estado-producto">
                ${disponibilidad}
            </p>

            <div class="cantidad-producto">
                <label for="cantidad-producto">Cantidad:</label>

                <input
                    type="number"
                    id="cantidad-producto"
                    min="1"
                    max="${existencias}"
                    value="1"
                    ${existencias <= 0 ? "disabled" : ""}
                >
            </div>

            <div class="acciones-producto">

                <button
                    type="button"
                    class="boton-agregar"
                    id="agregar-detalle"
                    ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                >
                    Agregar al carrito
                </button>

                <a
                    href="#"
                    class="boton-whatsapp"
                    id="consultar-whatsapp"
                >
                    Consultar por WhatsApp
                </a>

            </div>

        </div>
    `;

    document.getElementById("agregar-detalle")
        .addEventListener("click", agregarDesdeDetalle);

    document.getElementById("consultar-whatsapp")
        .addEventListener("click", consultarWhatsApp);
}

// AGREGAR AL CARRITO
function agregarDesdeDetalle() {

    if (!productoActual) return;

    const cantidadInput = document.getElementById("cantidad-producto");
    const cantidad = Number(cantidadInput.value);
    const existencias = Number(productoActual.existencias);
    const precio = Number(productoActual.precio_venta);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > existencias) {
        alert("Selecciona una cantidad válida.");
        return;
    }

    if (precio <= 0) {
        alert("Este producto no tiene un precio disponible.");
        return;
    }

    const clave = "skenzi_carrito";

    let carrito = [];

    try {
        carrito = JSON.parse(localStorage.getItem(clave)) || [];
        if (!Array.isArray(carrito)) carrito = [];
    } catch {
        carrito = [];
    }

    const existente = carrito.find(
        item => String(item.id) === String(productoActual.id)
    );

    const cantidadFinal = cantidad + (existente ? Number(existente.cantidad) : 0);

    if (cantidadFinal > existencias) {
        alert("No hay suficientes unidades disponibles.");
        return;
    }

    if (existente) {
        existente.cantidad = cantidadFinal;
    } else {
        carrito.push({
            id: productoActual.id,
            cantidad: cantidad
        });
    }

    localStorage.setItem(clave, JSON.stringify(carrito));

    alert("¡Producto agregado al carrito!");
}

// CONSULTAR POR WHATSAPP
function consultarWhatsApp(evento) {

    evento.preventDefault();

    if (!productoActual) return;

    const mensaje = `Hola, estoy interesado en este producto de Skenzi Home:

${productoActual.nombre}

¿Me pueden brindar más información?`;

    const url = `https://wa.me/${WHATSAPP_PRODUCTO}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
}

// MOSTRAR ERRORES
function mostrarErrorProducto(mensaje) {

    const contenedor = document.getElementById("detalle-producto");

    if (contenedor) {
        contenedor.innerHTML = `
            <div class="mensaje-carga">
                <h2>Producto no disponible</h2>
                <p>${escaparProducto(mensaje)}</p>
                <a href="index.html">Volver a la tienda</a>
            </div>
        `;
    }
}

// INICIAR
document.addEventListener("DOMContentLoaded", cargarDetalleProducto);
