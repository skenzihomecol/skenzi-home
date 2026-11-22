
/* ==========================================
   SKENZI HOME — CATÁLOGO HOGAR
   SUPABASE + SUBCATEGORÍAS + DESTACADO
   ========================================== */

"use strict";

const WHATSAPP_HOGAR = "573105001079";

const PRECIO_HOGAR = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosHogar = [];
let categoriaHogarActual = "";

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

// NORMALIZAR NOMBRES
function normalizarHogar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS
async function cargarHogar() {

    const galeria = document.getElementById("galeria-hogar");

    if (!galeria) return;

    try {

        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                Cargando productos...
            </p>
        `;

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
                categoria_id,
                es_destacado,
                categorias (
                    nombre
                )
            `)
            .eq("activo", true)
            .order("creado_en", { ascending: false });

        if (error) throw error;

        productosHogar = (data || []).map(producto => ({
            ...producto,
            categoriaNombre: producto.categorias?.nombre || ""
        })).filter(producto =>
            normalizarHogar(producto.categoriaNombre) === "hogar"
        );

        mostrarDestacadoHogar();
        mostrarHogar();

    } catch (error) {

        console.error("Error cargando productos de hogar:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los productos.
                Intenta nuevamente.
            </p>
        `;

        const destacado = document.getElementById(
            "producto-destacado-hogar"
        );

        if (destacado) {
            destacado.innerHTML = "";
        }
    }
}

// MOSTRAR PRODUCTO DESTACADO
function mostrarDestacadoHogar() {

    const contenedor = document.getElementById(
        "producto-destacado-hogar"
    );

    if (!contenedor) return;

    const producto = productosHogar.find(
        p => p.es_destacado === true
    );

    if (!producto) {

        contenedor.innerHTML = `
            <p class="mensaje-vacio">
                Próximamente tendremos un producto especial para ti.
            </p>
        `;

        return;
    }

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;

    const imagen = producto.imagen_url
        ? `
            <img
                src="${escaparHogar(producto.imagen_url)}"
                alt="${escaparHogar(producto.nombre)}"
                loading="lazy"
            >
        `
        : `<div class="mensaje-vacio">🛍️</div>`;

    contenedor.innerHTML = `
        <article class="producto-destacado">

            ${imagen}

            <div class="contenido-destacado">

                <span class="etiqueta-destacado">
                    PRODUCTO ESPECIAL
                </span>

                <h3>${escaparHogar(producto.nombre)}</h3>

                <p>
                    ${escaparHogar(producto.descripcion)}
                </p>

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
}

// MOSTRAR PRODUCTOS
function mostrarHogar() {

    const galeria = document.getElementById("galeria-hogar");

    if (!galeria) return;

    let productos = productosHogar.filter(
        p => p.es_destacado !== true
    );

    if (categoriaHogarActual) {

        productos = productos.filter(producto =>
            normalizarHogar(producto.categoriaNombre) ===
            normalizarHogar(categoriaHogarActual)
        );

    }

    if (!productos.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                Próximamente tendremos productos en esta sección.
            </p>
        `;

        return;
    }

    galeria.innerHTML = productos.map(producto => {

        const precio = Number(producto.precio_venta) || 0;
        const existencias = Number(producto.existencias) || 0;

        const imagen = producto.imagen_url
            ? `
                <img
                    src="${escaparHogar(producto.imagen_url)}"
                    alt="${escaparHogar(producto.nombre)}"
                    loading="lazy"
                >
            `
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

// FILTRAR POR SUBCATEGORÍA
function filtrarHogar(categoria) {

    categoriaHogarActual = categoria;

    const titulo = document.getElementById(
        "titulo-catalogo-hogar"
    );

    if (titulo) {
        titulo.textContent = categoria
            ? "Productos de " + categoria
            : "Productos para el hogar";
    }

    mostrarHogar();

    document.querySelector(".catalogo")?.scrollIntoView({
        behavior: "smooth"
    });
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

    const botonAgregar = evento.target.closest(
        "[data-agregar-hogar]"
    );

    if (botonAgregar) {
        agregarHogar(botonAgregar.dataset.agregarHogar);
        return;
    }

    const botonFiltro = evento.target.closest(
        "[data-filtro-hogar]"
    );

    if (botonFiltro) {
        filtrarHogar(botonFiltro.dataset.filtroHogar);
        return;
    }

    const verTodos = evento.target.closest(
        "#ver-todos-hogar"
    );

    if (verTodos) {
        filtrarHogar("");
    }
});

// HACER FUNCIONES ACCESIBLES
window.cargarHogar = cargarHogar;
window.filtrarHogar = filtrarHogar;
window.mostrarHogar = mostrarHogar;

// INICIAR
document.addEventListener(
    "DOMContentLoaded",
    cargarHogar
);
