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

// CARGAR PRODUCTOS PUBLICADOS
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
                categoria,
                imagen_url,
                precio,
                stock,
                stock_minimo,
                activo,
                publicado,
                tipo_inventario,
                codigo_barras,
                visitas
            `)
            .eq("activo", true)
            .eq("publicado", true);

        if (error) throw error;

        window.SK_PRODUCTOS = (data || []).map(producto => ({
            id: producto.id,
            nombre: producto.nombre || "Producto sin nombre",
            descripcion: producto.descripcion || "",
            categoria: producto.categoria || "",
            precio: Number(producto.precio) || 0,
            existencias: Number(producto.stock) || 0,
            imagen: producto.imagen_url || "",
            tipoInventario: producto.tipo_inventario || "Fisico",
            codigoBarras: producto.codigo_barras || "",
            visitas: Number(producto.visitas) || 0
        }));

        mostrarCatalogo(window.SK_PRODUCTOS);

        console.log(
            "Productos cargados:",
            window.SK_PRODUCTOS.length
        );

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

// MOSTRAR GALERÍA
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

        const bajoPedido =
            producto.tipoInventario.toLowerCase() === "bajo pedido";

        const disponibilidad = producto.existencias > 0
            ? "Disponible"
            : bajoPedido
                ? "Disponible bajo pedido"
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

        const puedeAgregar =
            producto.precio > 0 &&
            (producto.existencias > 0 || bajoPedido);

        return `
            <article class="tarjeta-producto">

                <a href="${enlaceProducto}" class="enlace-producto">

                    <div class="imagen-producto">
                        ${imagen}
                    </div>

                    <div class="contenido">
                        <h3>${escaparHTML(producto.nombre)}</h3>

                        <p class="descripcion-producto">
                            ${escaparHTML(producto.descripcion)}
                        </p>

                        <p class="precio-producto">${precio}</p>

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
                    ${!puedeAgregar ? "disabled" : ""}
                >
                    ${puedeAgregar ? "Agregar al carrito" : "No disponible"}
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
