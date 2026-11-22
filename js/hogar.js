
/* ==========================================
   SKENZI HOME — HOGAR Y MUEBLES
   GALERÍA + VENTANA DE PRODUCTO + CARRITO
   ========================================== */

"use strict";

const PRECIO_HOGAR = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosHogar = [];

function escaparHogar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

function normalizarHogar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS DESDE SUPABASE
async function cargarHogar() {
    const galeria = document.getElementById("galeria-hogar");
    if (!galeria) return;

    try {
        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = "<p>Cargando productos...</p>";

        const { data, error } = await db
            .from("productos")
            .select(`
                id,
                nombre,
                descripcion,
                precio_venta,
                existencias,
                imagen_url,
                imagenes_adicionales,
                categoria_id,
                activo,
                categorias(nombre)
            `)
            .eq("activo", true)
            .order("creado_en", { ascending: false });

        if (error) throw error;

        productosHogar = (data || []).filter(producto => {
            const categoria = normalizarHogar(
                producto.categorias?.nombre
            );

            return [
                "hogar",
                "muebles",
                "hogar y muebles",
                "hogar y mueble"
            ].includes(categoria);
        });

        mostrarHogar();

    } catch (error) {
        console.error("Error cargando Hogar:", error);
        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los productos.
                Intenta nuevamente.
            </p>
        `;
    }
}

// OBTENER FOTOGRAFÍAS
function obtenerImagenesHogar(producto) {
    let adicionales = producto.imagenes_adicionales || [];

    if (typeof adicionales === "string") {
        try {
            adicionales = JSON.parse(adicionales);
        } catch {
            adicionales = [adicionales];
        }
    }

    if (!Array.isArray(adicionales)) {
        adicionales = [];
    }

    return [
        producto.imagen_url,
        ...adicionales
    ].filter(imagen =>
        typeof imagen === "string" && imagen.trim()
    );
}

// MOSTRAR GALERÍA COMPLETA
function mostrarHogar() {
    const galeria = document.getElementById("galeria-hogar");
    if (!galeria) return;

    if (!productosHogar.length) {
        galeria.innerHTML = `
            <p class="mensaje-vacio">
                Todavía no hay productos disponibles
                en esta categoría.
            </p>
        `;
        return;
    }

    galeria.innerHTML = productosHogar.map(producto => {
        const precio = Number(producto.precio_venta) || 0;
        const existencias = Number(producto.existencias) || 0;
        const imagen = producto.imagen_url;

        return `
            <article class="producto producto-hogar">

                <button
                    type="button"
                    class="producto-ver-detalle"
                    data-ver-hogar="${escaparHogar(producto.id)}"
                    aria-label="Ver ${escaparHogar(producto.nombre)}"
                >
                    ${imagen
                        ? `<img src="${escaparHogar(imagen)}"
                               alt="${escaparHogar(producto.nombre)}"
                               loading="lazy">`
                        : `<div class="imagen-sin-producto">🛍️</div>`
                    }

                    <h3>${escaparHogar(producto.nombre)}</h3>
                </button>

                <div class="producto-contenido">
                    <p class="precio">
                        ${precio > 0
                            ? PRECIO_HOGAR.format(precio)
                            : "Consultar precio"}
                    </p>

                    <button
                        type="button"
                        data-agregar-hogar="${escaparHogar(producto.id)}"
                        ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                    >
                        ${existencias > 0 && precio > 0
                            ? "Añadir al carrito"
                            : "No disponible"}
                    </button>
                </div>

            </article>
        `;
    }).join("");
}

// CREAR VENTANA EMERGENTE
function crearVentanaHogar() {
    if (document.getElementById("modal-hogar")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="modal-hogar" class="modal-hogar" hidden>
            <div class="modal-hogar-contenido"
                 role="dialog"
                 aria-modal="true"
                 aria-label="Información del producto">

                <button type="button"
                        class="cerrar-modal-hogar"
                        data-cerrar-hogar
                        aria-label="Cerrar">×</button>

                <div id="detalle-hogar"></div>
            </div>
        </div>
    `);
}

// ABRIR INFORMACIÓN DEL PRODUCTO
function verDetalleHogar(id) {
    const producto = productosHogar.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    crearVentanaHogar();

    const modal = document.getElementById("modal-hogar");
    const detalle = document.getElementById("detalle-hogar");

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;
    const imagenes = obtenerImagenesHogar(producto);

    detalle.innerHTML = `
        <div class="detalle-producto-hogar">

            <div class="detalle-imagenes-hogar">
                ${imagenes.length
                    ? imagenes.map(imagen => `
                        <img
                            src="${escaparHogar(imagen)}"
                            alt="${escaparHogar(producto.nombre)}"
                        >
                    `).join("")
                    : `<div class="imagen-sin-producto">🛍️</div>`
                }
            </div>

            <div class="detalle-info-hogar">
                <span class="detalle-etiqueta">SKENZI HOME</span>

                <h2>${escaparHogar(producto.nombre)}</h2>

                <p class="detalle-descripcion">
                    ${escaparHogar(
                        producto.descripcion || "Producto de nuestra colección."
                    )}
                </p>

                <p class="precio">
                    ${precio > 0
                        ? PRECIO_HOGAR.format(precio)
                        : "Consultar precio"}
                </p>

                <p class="detalle-existencias">
                    ${existencias > 0
                        ? "Disponible"
                        : "Agotado"}
                </p>

                <button
                    type="button"
                    data-agregar-hogar="${escaparHogar(producto.id)}"
                    ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                >
                    ${existencias > 0 && precio > 0
                        ? "Añadir al carrito"
                        : "No disponible"}
                </button>
            </div>

        </div>
    `;

    modal.hidden = false;
    document.body.classList.add("modal-abierto-hogar");
}

// CERRAR VENTANA
function cerrarVentanaHogar() {
    const modal = document.getElementById("modal-hogar");
    if (modal) modal.hidden = true;

    document.body.classList.remove("modal-abierto-hogar");
}

// AGREGAR AL CARRITO
function agregarHogar(id) {
    const producto = productosHogar.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    const carrito = JSON.parse(
        localStorage.getItem("skenzi_carrito") || "[]"
    );

    const existente = carrito.find(
        p => String(p.id) === String(id)
    );

    if (existente) {
        if (existente.cantidad >= Number(producto.existencias)) {
            alert("No hay más unidades disponibles.");
            return;
        }

        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            cantidad: 1
        });
    }

    localStorage.setItem(
        "skenzi_carrito",
        JSON.stringify(carrito)
    );

    alert("¡Producto agregado al carrito!");
}

// EVENTOS
document.addEventListener("click", evento => {
    const agregar = evento.target.closest("[data-agregar-hogar]");

    if (agregar) {
        agregarHogar(agregar.dataset.agregarHogar);
        return;
    }

    const ver = evento.target.closest("[data-ver-hogar]");

    if (ver) {
        verDetalleHogar(ver.dataset.verHogar);
        return;
    }

    if (
        evento.target.closest("[data-cerrar-hogar]") ||
        evento.target.id === "modal-hogar"
    ) {
        cerrarVentanaHogar();
    }
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        cerrarVentanaHogar();
    }
});

window.cargarHogar = cargarHogar;
window.mostrarHogar = mostrarHogar;

// INICIAR
document.addEventListener("DOMContentLoaded", () => {
    crearVentanaHogar();
    cargarHogar();
});
