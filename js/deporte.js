/* ==========================================
   SKENZI HOME — DEPORTE
   SUPABASE + GALERÍA + CARRITO
   ========================================== */

"use strict";

const PRECIO_DEPORTE = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosDeporte = [];
let busquedaDeporte = "";

// ESCAPAR TEXTO
function escaparDeporte(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// NORMALIZAR TEXTO
function normalizarDeporte(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS DE SUPABASE
async function cargarDeporte() {

    const galeria = document.getElementById("galeria-deporte");

    if (!galeria) return;

    try {

        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = "<p>Cargando productos deportivos...</p>";

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

        productosDeporte = (data || []).filter(producto => {

            const categoria = normalizarDeporte(
                producto.categorias?.nombre
            );

            return categoria.includes("deporte");
        });

        mostrarDeporte();

    } catch (error) {

        console.error("Error cargando productos deportivos:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los productos deportivos.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA
function mostrarDeporte() {

    const galeria = document.getElementById("galeria-deporte");

    if (!galeria) return;

    const productosFiltrados = productosDeporte.filter(producto => {

        const nombre = normalizarDeporte(producto.nombre);
        const descripcion = normalizarDeporte(producto.descripcion);

        return (
            nombre.includes(busquedaDeporte) ||
            descripcion.includes(busquedaDeporte)
        );
    });

    if (!productosFiltrados.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                ${
                    busquedaDeporte
                    ? "No encontramos productos con esa búsqueda."
                    : "Próximamente tendremos productos deportivos disponibles."
                }
            </p>
        `;

        return;
    }

    galeria.innerHTML = productosFiltrados.map(producto => {

        const precio = Number(producto.precio_venta) || 0;
        const existencias = Number(producto.existencias) || 0;
        const imagen = producto.imagen_url;
        const disponible = existencias > 0 && precio > 0;

        return `
            <article class="producto-deporte">

                <button
                    type="button"
                    class="ver-detalle-deporte"
                    data-ver-deporte="${escaparDeporte(producto.id)}"
                >

                    ${
                        imagen
                        ? `<img
                            src="${escaparDeporte(imagen)}"
                            alt="${escaparDeporte(producto.nombre)}"
                            loading="lazy"
                        >`
                        : `<div class="imagen-sin-deporte">🏃</div>`
                    }

                    <h3>${escaparDeporte(producto.nombre)}</h3>

                </button>

                <div class="contenido-deporte">

                    <p class="precio">
                        ${
                            precio > 0
                            ? PRECIO_DEPORTE.format(precio)
                            : "Consultar precio"
                        }
                    </p>

                    <button
                        type="button"
                        data-agregar-deporte="${escaparDeporte(producto.id)}"
                        ${disponible ? "" : "disabled"}
                    >
                        ${disponible ? "Añadir al carrito" : "No disponible"}
                    </button>

                </div>

            </article>
        `;

    }).join("");
}

// CREAR VENTANA DE DETALLE
function crearVentanaDeporte() {

    if (document.getElementById("modal-deporte")) return;

    document.body.insertAdjacentHTML("beforeend", `

        <div id="modal-deporte" class="modal-deporte" hidden>

            <div class="modal-deporte-contenido"
                 role="dialog"
                 aria-modal="true"
                 aria-label="Información del producto deportivo">

                <button
                    type="button"
                    class="cerrar-deporte"
                    data-cerrar-deporte
                    aria-label="Cerrar"
                >×</button>

                <div id="detalle-deporte"></div>

            </div>

        </div>

    `);
}

// VER DETALLE
function verDetalleDeporte(id) {

    const producto = productosDeporte.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    crearVentanaDeporte();

    const modal = document.getElementById("modal-deporte");
    const detalle = document.getElementById("detalle-deporte");

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;
    const disponible = existencias > 0 && precio > 0;

    detalle.innerHTML = `

        <div class="detalle-deporte">

            <div>
                ${
                    producto.imagen_url
                    ? `<img
                        src="${escaparDeporte(producto.imagen_url)}"
                        alt="${escaparDeporte(producto.nombre)}"
                    >`
                    : `<div class="imagen-sin-deporte">🏃</div>`
                }
            </div>

            <div>

                <span>SKENZI HOME</span>

                <h2>${escaparDeporte(producto.nombre)}</h2>

                <p>
                    ${escaparDeporte(
                        producto.descripcion || "Descubre este producto de nuestra colección."
                    )}
                </p>

                <p class="precio">
                    ${
                        precio > 0
                        ? PRECIO_DEPORTE.format(precio)
                        : "Consultar precio"
                    }
                </p>

                <p>
                    ${existencias > 0 ? "Disponible" : "Agotado"}
                </p>

                <button
                    type="button"
                    data-agregar-deporte="${escaparDeporte(producto.id)}"
                    ${disponible ? "" : "disabled"}
                >
                    ${disponible ? "Añadir al carrito" : "No disponible"}
                </button>

            </div>

        </div>

    `;

    modal.hidden = false;
    document.body.classList.add("modal-abierto-deporte");
}

// CERRAR VENTANA
function cerrarVentanaDeporte() {

    const modal = document.getElementById("modal-deporte");

    if (modal) modal.hidden = true;

    document.body.classList.remove("modal-abierto-deporte");
}

// AGREGAR AL CARRITO
function agregarDeporte(id) {

    const producto = productosDeporte.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    const existencias = Number(producto.existencias) || 0;
    const precio = Number(producto.precio_venta) || 0;

    if (existencias <= 0 || precio <= 0) {
        alert("Este producto no está disponible para compra.");
        return;
    }

    const carrito = JSON.parse(
        localStorage.getItem("skenzi_carrito") || "[]"
    );

    const existente = carrito.find(
        p => String(p.id) === String(id)
    );

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

    actualizarContadorDeporte();

    alert("¡Producto agregado al carrito!");
}

// ACTUALIZAR CONTADORES (ENCABEZADO + FLOTANTE)
function actualizarContadorDeporte() {

    const contador = document.getElementById("contador-carrito");
    const contadorFlotante = document.getElementById("contador-carrito-flotante");

    try {

        const carrito = JSON.parse(
            localStorage.getItem("skenzi_carrito") || "[]"
        );

        const cantidad = Array.isArray(carrito)
            ? carrito.reduce(
                (total, producto) => total + Number(producto?.cantidad || 0),
                0
            )
            : 0;

        if (contador) contador.textContent = String(cantidad);
        if (contadorFlotante) contadorFlotante.textContent = String(cantidad);

    } catch (error) {

        console.error("Error al leer el carrito en Deporte:", error);
        if (contador) contador.textContent = "0";
        if (contadorFlotante) contadorFlotante.textContent = "0";

    }
}

// BUSCADOR
document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador-deporte");
    const campo = document.getElementById("buscar-producto-deporte");

    if (buscador && campo) {

        buscador.addEventListener("submit", evento => {

            evento.preventDefault();

            busquedaDeporte = normalizarDeporte(campo.value);

            mostrarDeporte();

        });

    }

});

// EVENTOS DE PRODUCTOS
document.addEventListener("click", evento => {

    const agregar = evento.target.closest("[data-agregar-deporte]");

    if (agregar) {
        agregarDeporte(agregar.dataset.agregarDeporte);
        return;
    }

    const ver = evento.target.closest("[data-ver-deporte]");

    if (ver) {
        verDetalleDeporte(ver.dataset.verDeporte);
        return;
    }

    if (
        evento.target.closest("[data-cerrar-deporte]") ||
        evento.target.id === "modal-deporte"
    ) {
        cerrarVentanaDeporte();
    }

});

// CERRAR CON ESCAPE
document.addEventListener("keydown", evento => {

    if (evento.key === "Escape") {
        cerrarVentanaDeporte();
    }

});

window.addEventListener("storage", actualizarContadorDeporte);

// INICIAR
document.addEventListener("DOMContentLoaded", () => {

    crearVentanaDeporte();

    actualizarContadorDeporte();

    cargarDeporte();

});
