
/* ==========================================
   SKENZI HOME — CATÁLOGO HOGAR
   ========================================== */

"use strict";

const WHATSAPP_HOGAR = "573105001079";

const PRECIO_HOGAR = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosHogar = [];

// ESCAPAR TEXTO
function escaparHogar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// CARGAR PRODUCTOS
async function cargarHogar() {

    const galeria = document.getElementById("galeria-hogar");

    if (!galeria) return;

    try {

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
                categorias (
                    nombre
                )
            `)
            .eq("activo", true);

        if (error) throw error;

        productosHogar = (data || []).filter(producto => {

            const categoria = producto.categorias?.nombre || "";

            return categoria
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase() === "hogar";

        });

        mostrarHogar();

    } catch (error) {

        console.error("Error cargando productos de hogar:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los productos.
                Intenta nuevamente.
            </p>
        `;

    }

}

// MOSTRAR PRODUCTOS
function mostrarHogar() {

    const galeria = document.getElementById("galeria-hogar");

    if (!galeria) return;

    if (!productosHogar.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                Próximamente tendremos productos para el hogar.
            </p>
        `;

        return;
    }

    galeria.innerHTML = productosHogar.map(producto => {

        const precio = Number(producto.precio_venta) || 0;
        const existencias = Number(producto.existencias) || 0;

        const imagen = producto.imagen_url
            ? `<img src="${escaparHogar(producto.imagen_url)}"
                 alt="${escaparHogar(producto.nombre)}"
                 loading="lazy">`
            : `<div class="mensaje-vacio">🛍️</div>`;

        return `
            <article class="producto">

                ${imagen}

                <div class="producto-contenido">

                    <h3>${escaparHogar(producto.nombre)}</h3>

                    <p>${escaparHogar(producto.descripcion)}</p>

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
                            ? "Agregar al carrito"
                            : "No disponible"}
                    </button>

                </div>

            </article>
        `;

    }).join("");

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

    localStorage.setItem("skenzi_carrito", JSON.stringify(carrito));

    alert("¡Producto agregado al carrito!");

}

// EVENTOS
document.addEventListener("click", evento => {

    const boton = evento.target.closest("[data-agregar-hogar]");

    if (boton) {
        agregarHogar(boton.dataset.agregarHogar);
    }

});

// INICIAR
document.addEventListener("DOMContentLoaded", cargarHogar);
