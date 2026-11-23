
/* ==========================================
   SKENZI HOME — HERRAMIENTAS
   SUPABASE + GALERÍA + CARRITO
   ========================================== */

"use strict";

const PRECIO_HERRAMIENTAS = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosHerramientas = [];
let busquedaHerramientas = "";

// ESCAPAR TEXTO
function escaparHerramientas(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// NORMALIZAR TEXTO
function normalizarHerramientas(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS DE SUPABASE
async function cargarHerramientas() {

    const galeria = document.getElementById("galeria-herramientas");

    if (!galeria) return;

    try {

        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = "<p>Cargando herramientas...</p>";

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

        productosHerramientas = (data || []).filter(producto => {

            const categoria = normalizarHerramientas(
                producto.categorias?.nombre
            );

            return categoria.includes("herramienta");
        });

        mostrarHerramientas();

    } catch (error) {

        console.error("Error cargando herramientas:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar las herramientas.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA
function mostrarHerramientas() {

    const galeria = document.getElementById("galeria-herramientas");

    if (!galeria) return;

    const productosFiltrados = productosHerramientas.filter(producto => {

        const nombre = normalizarHerramientas(producto.nombre);
        const descripcion = normalizarHerramientas(producto.descripcion);

        return (
            nombre.includes(busquedaHerramientas) ||
            descripcion.includes(busquedaHerramientas)
        );
    });

    if (!productosFiltrados.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                ${
                    busquedaHerramientas
                    ? "No encontramos herramientas con esa búsqueda."
                    : "Próximamente tendremos herramientas disponibles."
                }
            </p>
        `;

        return;
    }

    galeria.innerHTML = productosFiltrados.map(producto => {

        const precio = Number(producto.precio_venta) || 0;
        const existencias = Number(producto.existencias) || 0;
        const imagen = producto.imagen_url;

        return `
            <article class="producto-herramienta">

                <button
                    type="button"
                    class="ver-detalle-herramienta"
                    data-ver-herramienta="${escaparHerramientas(producto.id)}"
                >

                    ${
                        imagen
                        ? `<img
                            src="${escaparHerramientas(imagen)}"
                            alt="${escaparHerramientas(producto.nombre)}"
                            loading="lazy"
                        >`
                        : `<div class="imagen-sin-herramienta">🛠️</div>`
                    }

                    <h3>${escaparHerramientas(producto.nombre)}</h3>

                </button>

                <div class="contenido-herramienta">

                    <p class="precio">
                        ${
                            precio > 0
                            ? PRECIO_HERRAMIENTAS.format(precio)
                            : "Consultar precio"
                        }
                    </p>

                    <button
                        type="button"
                        data-agregar-herramienta="${escaparHerramientas(producto.id)}"
                        ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                    >
                        ${
                            existencias > 0 && precio > 0
                            ? "Añadir al carrito"
                            : "No disponible"
                        }
                    </button>

                </div>

            </article>
        `;

    }).join("");
}

// CREAR VENTANA DE DETALLE
function crearVentanaHerramientas() {

    if (document.getElementById("modal-herramienta")) return;

    document.body.insertAdjacentHTML("beforeend", `

        <div id="modal-herramienta" class="modal-herramienta" hidden>

            <div class="modal-herramienta-contenido"
                 role="dialog"
                 aria-modal="true"
                 aria-label="Información de la herramienta">

                <button
                    type="button"
                    class="cerrar-herramienta"
                    data-cerrar-herramienta
                    aria-label="Cerrar"
                >×</button>

                <div id="detalle-herramienta"></div>

            </div>

        </div>

    `);
}

// VER DETALLE
function verDetalleHerramientas(id) {

    const producto = productosHerramientas.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    crearVentanaHerramientas();

    const modal = document.getElementById("modal-herramienta");
    const detalle = document.getElementById("detalle-herramienta");

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;

    detalle.innerHTML = `

        <div class="detalle-herramienta">

            <div>
                ${
                    producto.imagen_url
                    ? `<img
                        src="${escaparHerramientas(producto.imagen_url)}"
                        alt="${escaparHerramientas(producto.nombre)}"
                    >`
                    : `<div class="imagen-sin-herramienta">🛠️</div>`
                }
            </div>

            <div>

                <span>SKENZI HOME</span>

                <h2>${escaparHerramientas(producto.nombre)}</h2>

                <p>
                    ${escaparHerramientas(
                        producto.descripcion || "Descubre este producto de nuestra colección."
                    )}
                </p>

                <p class="precio">
                    ${
                        precio > 0
                        ? PRECIO_HERRAMIENTAS.format(precio)
                        : "Consultar precio"
                    }
                </p>

                <p>
                    ${existencias > 0 ? "Disponible" : "Agotado"}
                </p>

                <button
                    type="button"
                    data-agregar-herramienta="${escaparHerramientas(producto.id)}"
                    ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                >
                    Añadir al carrito
                </button>

            </div>

        </div>

    `;

    modal.hidden = false;
    document.body.classList.add("modal-abierto-herramienta");
}

// CERRAR VENTANA
function cerrarVentanaHerramientas() {

    const modal = document.getElementById("modal-herramienta");

    if (modal) modal.hidden = true;

    document.body.classList.remove("modal-abierto-herramienta");
}

// AGREGAR AL CARRITO
function agregarHerramientas(id) {

    const producto = productosHerramientas.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    const carrito = JSON.parse(
        localStorage.getItem("skenzi_carrito") || "[]"
    );

    const existente = carrito.find(
        p => String(p.id) === String(id)
    );

    const existencias = Number(producto.existencias) || 0;

    if (existente) {

        if (existente.cantidad >= existencias) {
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

    actualizarContadorHerramientas();

    alert("¡Herramienta agregada al carrito!");
}

// ACTUALIZAR CONTADOR
function actualizarContadorHerramientas() {

    const contador = document.getElementById("contador-carrito");

    if (!contador) return;

    const carrito = JSON.parse(
        localStorage.getItem("skenzi_carrito") || "[]"
    );

    const cantidad = carrito.reduce(
        (total, producto) => total + Number(producto.cantidad || 0),
        0
    );

    contador.textContent = cantidad;
}

// BUSCADOR
document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador-herramientas");
    const campo = document.getElementById("buscar-producto-herramientas");

    if (buscador && campo) {

        buscador.addEventListener("submit", evento => {

            evento.preventDefault();

            busquedaHerramientas = normalizarHerramientas(campo.value);

            mostrarHerramientas();

        });

    }

});

// EVENTOS DE PRODUCTOS
document.addEventListener("click", evento => {

    const agregar = evento.target.closest("[data-agregar-herramienta]");

    if (agregar) {
        agregarHerramientas(agregar.dataset.agregarHerramienta);
        return;
    }

    const ver = evento.target.closest("[data-ver-herramienta]");

    if (ver) {
        verDetalleHerramientas(ver.dataset.verHerramienta);
        return;
    }

    if (
        evento.target.closest("[data-cerrar-herramienta]") ||
        evento.target.id === "modal-herramienta"
    ) {
        cerrarVentanaHerramientas();
    }

});

// CERRAR CON ESCAPE
document.addEventListener("keydown", evento => {

    if (evento.key === "Escape") {
        cerrarVentanaHerramientas();
    }

});

// INICIAR
document.addEventListener("DOMContentLoaded", () => {

    crearVentanaHerramientas();

    actualizarContadorHerramientas();

    cargarHerramientas();

});
