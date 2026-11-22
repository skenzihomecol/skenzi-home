
/* ==========================================
   SKENZI HOME — CATÁLOGO COCINA
   SUPABASE + CARRITO
   ========================================== */

"use strict";

const PRECIO_COCINA = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosCocina = [];

// PROTEGER TEXTO HTML
function escaparCocina(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// CARGAR PRODUCTOS
async function cargarCocina() {

    const galeria = document.getElementById("galeria-cocina");

    if (!galeria) return;

    try {

        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        const { data, error } = await db
            .from("productos")
            .select(`
                id,
                nombre,
                descripcion,
                precio_venta,
                existencias,
                imagen_url,
                activo,
                categorias (
                    nombre
                )
            `)
            .eq("activo", true)
            .eq("categorias.nombre", "Cocina")
            .order("creado_en", { ascending: false });

        if (error) throw error;

        productosCocina = data || [];

        mostrarCocina();

        console.log(
            "SKENZI HOME — Productos de cocina:",
            productosCocina.length
        );

    } catch (error) {

        console.error("Error cargando cocina:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No fue posible cargar los productos.
                Intenta nuevamente más tarde.
            </p>
        `;
    }
}

// MOSTRAR PRODUCTOS
function mostrarCocina() {

    const galeria = document.getElementById("galeria-cocina");

    if (!galeria) return;

    if (!productosCocina.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                Próximamente tendremos productos de cocina.
            </p>
        `;

        return;
    }

    galeria.innerHTML = productosCocina.map(producto => {

        const precio = Number(producto.precio_venta) || 0;
        const existencias = Number(producto.existencias) || 0;

        const imagen = producto.imagen_url
            ? `
                <img
                    src="${escaparCocina(producto.imagen_url)}"
                    alt="${escaparCocina(producto.nombre)}"
                    loading="lazy"
                >
            `
            : `<div class="imagen-sin-producto">🛍️</div>`;

        return `
            <article class="producto-cocina">

                <a
                    href="producto.html?id=${encodeURIComponent(producto.id)}"
                    class="enlace-producto-cocina"
                >

                    <div class="imagen-producto-cocina">
                        ${imagen}
                    </div>

                    <div class="contenido-producto-cocina">

                        <h3>${escaparCocina(producto.nombre)}</h3>

                        <p class="descripcion">
                            ${escaparCocina(producto.descripcion)}
                        </p>

                        <p class="precio">
                            ${precio > 0
                                ? PRECIO_COCINA.format(precio)
                                : "Consultar precio"}
                        </p>

                    </div>

                </a>

                <div class="contenido-producto-cocina">

                    <button
                        type="button"
                        class="boton-agregar-cocina"
                        data-agregar-cocina="${escaparCocina(producto.id)}"
                        ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                    >
                        ${existencias > 0 && precio > 0
                            ? "Agregar al carrito"
                            : "No disponible"}
                    </button>

                </div>

            </article>
        `;

    }).join("");
}

// AGREGAR AL CARRITO
function agregarCocina(id) {

    const producto = productosCocina.find(
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

    const boton = evento.target.closest("[data-agregar-cocina]");

    if (boton) {
        agregarCocina(boton.dataset.agregarCocina);
    }

});

// FUNCIONES ACCESIBLES
window.cargarCocina = cargarCocina;
window.mostrarCocina = mostrarCocina;

// INICIAR
document.addEventListener(
    "DOMContentLoaded",
    cargarCocina
);
