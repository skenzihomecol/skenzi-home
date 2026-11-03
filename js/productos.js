
/* ==========================================
   SKENZI HOME — CATÁLOGO GENERAL
   ========================================== */

"use strict";

window.SK_PRODUCTOS = [];

const formatoPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// CARGAR TODOS LOS PRODUCTOS ACTIVOS
async function cargarProductos() {

    const galeria = document.getElementById("galeria-productos");

    if (!galeria) return;

    galeria.innerHTML = `
        <p class="mensaje-carga">Cargando nuestros productos...</p>
    `;

    try {

        if (!window.skenziDB) {
            throw new Error("No existe conexión con Supabase.");
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
                es_novedad,
                es_destacado,
                en_oferta
            `)
            .eq("activo", true);

        if (error) throw error;

        window.SK_PRODUCTOS = (data || []).map(producto => ({
            id: producto.id,
            nombre: producto.nombre || "Producto sin nombre",
            descripcion: producto.descripcion || "",
            precio: Number(producto.precio_venta) || 0,
            existencias: Number(producto.existencias) || 0,
            imagen: producto.imagen_url || "",
            categoriaId: producto.categoria_id,
            novedad: Boolean(producto.es_novedad),
            destacado: Boolean(producto.es_destacado),
            oferta: Boolean(producto.en_oferta)
        }));

        mostrarCatalogo(window.SK_PRODUCTOS);

        console.log("Productos cargados:", window.SK_PRODUCTOS.length);

    } catch (error) {

        console.error("Error cargando productos:", error);

        galeria.innerHTML = `
            <p class="mensaje-carga">
                No fue posible cargar el catálogo.
                Intenta nuevamente más tarde.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA GENERAL
function mostrarCatalogo(productos) {

    const galeria = document.getElementById("galeria-productos");

    if (!galeria) return;

    if (!productos.length) {
        galeria.innerHTML = `
            <p class="mensaje-carga">
                Próximamente tendremos productos disponibles.
            </p>
        `;
        return;
    }

    galeria.innerHTML = productos.map(producto => {

        const precio = producto.precio > 0
            ? formatoPrecio.format(producto.precio)
            : "Consultar precio";

        const disponibilidad = producto.existencias > 0
            ? "Disponible"
            : "Agotado";

        const imagen = producto.imagen
            ? `
                <img
                    src="${escaparHTML(producto.imagen)}"
                    alt="${escaparHTML(producto.nombre)}"
                    loading="lazy"
                >
            `
            : `<div class="imagen-vacia">🛍️</div>`;

        const enlaceProducto =
            `producto.html?id=${encodeURIComponent(producto.id)}`;

        return `
            <article class="tarjeta-producto">

                <a
                    href="${enlaceProducto}"
                    class="enlace-producto"
                    aria-label="Ver información de ${escaparHTML(producto.nombre)}"
                >

                    <div class="imagen-producto">
                        ${imagen}
                    </div>

                    <div class="contenido">

                        <h3>${escaparHTML(producto.nombre)}</h3>

                        <p class="descripcion-producto">
                            ${escaparHTML(producto.descripcion)}
                        </p>

                        <p class="precio-producto">
                            ${precio}
                        </p>

                        <p class="disponibilidad">
                            ${disponibilidad}
                        </p>

                        <span class="ver-detalles">
                            Ver detalles →
                        </span>

                    </div>

                </a>

                <button
                    type="button"
                    onclick="agregarAlCarrito('${escaparHTML(producto.id)}')"
                    ${producto.existencias <= 0 || producto.precio <= 0 ? "disabled" : ""}
                >
                    ${producto.existencias > 0 && producto.precio > 0
                        ? "Agregar al carrito"
                        : "No disponible"}
                </button>

            </article>
        `;

    }).join("");
}

// PROTECCIÓN DE TEXTO
function escaparHTML(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// INICIAR CATÁLOGO
document.addEventListener("DOMContentLoaded", cargarProductos);
