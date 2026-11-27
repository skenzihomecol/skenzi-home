/* ==========================================
   SKENZI HOME — JUGUETES
   SUPABASE + GALERÍA + CARRITO
   ========================================== */

"use strict";

const PRECIO_JUGUETES = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosJuguetes = [];
let busquedaJuguetes = "";

// ESCAPAR TEXTO
function escaparJuguetes(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// NORMALIZAR TEXTO
function normalizarJuguetes(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS DE SUPABASE
async function cargarJuguetes() {

    const galeria = document.getElementById("galeria-juguetes");

    if (!galeria) return;

    try {

        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = "<p>Cargando juguetes...</p>";

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

        productosJuguetes = (data || []).filter(producto => {

            const categoria = normalizarJuguetes(
                producto.categorias?.nombre
            );

            return categoria.includes("juguete");
        });

        mostrarJuguetes();

    } catch (error) {

        console.error("Error cargando juguetes:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los juguetes.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA
function mostrarJuguetes() {

    const galeria = document.getElementById("galeria-juguetes");

    if (!galeria) return;

    const productosFiltrados = productosJuguetes.filter(producto => {

        const nombre = normalizarJuguetes(producto.nombre);
        const descripcion = normalizarJuguetes(producto.descripcion);

        return (
            nombre.includes(busquedaJuguetes) ||
            descripcion.includes(busquedaJuguetes)
        );
    });

    if (!productosFiltrados.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                ${
                    busquedaJuguetes
                    ? "No encontramos juguetes con esa búsqueda."
                    : "Próximamente tendremos juguetes disponibles."
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
            <article class="producto-juguete">

                <button
                    type="button"
                    class="ver-detalle-juguete"
                    data-ver-juguete="${escaparJuguetes(producto.id)}"
                >

                    ${
                        imagen
                        ? `<img
                            src="${escaparJuguetes(imagen)}"
                            alt="${escaparJuguetes(producto.nombre)}"
                            loading="lazy"
                        >`
                        : `<div class="imagen-sin-juguete">🧸</div>`
                    }

                    <h3>${escaparJuguetes(producto.nombre)}</h3>

                </button>

                <div class="contenido-juguete">

                    <p class="precio">
                        ${
                            precio > 0
                            ? PRECIO_JUGUETES.format(precio)
                            : "Consultar precio"
                        }
                    </p>

                    <button
                        type="button"
                        data-agregar-juguete="${escaparJuguetes(producto.id)}"
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
function crearVentanaJuguetes() {

    if (document.getElementById("modal-juguete")) return;

    document.body.insertAdjacentHTML("beforeend", `

        <div id="modal-juguete" class="modal-juguete" hidden>

            <div class="modal-juguete-contenido"
                 role="dialog"
                 aria-modal="true"
                 aria-label="Información del juguete">

                <button
                    type="button"
                    class="cerrar-juguete"
                    data-cerrar-juguete
                    aria-label="Cerrar"
                >×</button>

                <div id="detalle-juguete"></div>

            </div>

        </div>

    `);
}

// VER DETALLE
function verDetalleJuguetes(id) {

    const producto = productosJuguetes.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    crearVentanaJuguetes();

    const modal = document.getElementById("modal-juguete");
    const detalle = document.getElementById("detalle-juguete");

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;
    const disponible = existencias > 0 && precio > 0;

    detalle.innerHTML = `

        <div class="detalle-juguete">

            <div>
                ${
                    producto.imagen_url
                    ? `<img
                        src="${escaparJuguetes(producto.imagen_url)}"
                        alt="${escaparJuguetes(producto.nombre)}"
                    >`
                    : `<div class="imagen-sin-juguete">🧸</div>`
                }
            </div>

            <div>

                <span>SKENZI HOME</span>

                <h2>${escaparJuguetes(producto.nombre)}</h2>

                <p>
                    ${escaparJuguetes(
                        producto.descripcion || "Descubre este producto de nuestra colección."
                    )}
                </p>

                <p class="precio">
                    ${
                        precio > 0
                        ? PRECIO_JUGUETES.format(precio)
                        : "Consultar precio"
                    }
                </p>

                <p>
                    ${existencias > 0 ? "Disponible" : "Agotado"}
                </p>

                <button
                    type="button"
                    data-agregar-juguete="${escaparJuguetes(producto.id)}"
                    ${disponible ? "" : "disabled"}
                >
                    ${disponible ? "Añadir al carrito" : "No disponible"}
                </button>

            </div>

        </div>

    `;

    modal.hidden = false;
    document.body.classList.add("modal-abierto-juguete");
}

// CERRAR VENTANA
function cerrarVentanaJuguetes() {

    const modal = document.getElementById("modal-juguete");

    if (modal) modal.hidden = true;

    document.body.classList.remove("modal-abierto-juguete");
}

// AGREGAR AL CARRITO
function agregarJuguetes(id) {

    const producto = productosJuguetes.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    const existencias = Number(producto.existencias) || 0;
    const precio = Number(producto.precio_venta) || 0;

    if (existencias <= 0 || precio <= 0) {
        alert("Este juguete no está disponible para compra.");
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

    actualizarContadorJuguetes();

    alert("¡Juguete agregado al carrito!");
}

// ACTUALIZAR CONTADORES (ENCABEZADO + FLOTANTE)
function actualizarContadorJuguetes() {

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

        console.error("Error al leer el carrito en Juguetes:", error);
        if (contador) contador.textContent = "0";
        if (contadorFlotante) contadorFlotante.textContent = "0";

    }
}

// BUSCADOR
document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador-juguetes");
    const campo = document.getElementById("buscar-producto-juguetes");

    if (buscador && campo) {

        buscador.addEventListener("submit", evento => {

            evento.preventDefault();

            busquedaJuguetes = normalizarJuguetes(campo.value);

            mostrarJuguetes();

        });

    }

});

// EVENTOS DE PRODUCTOS
document.addEventListener("click", evento => {

    const agregar = evento.target.closest("[data-agregar-juguete]");

    if (agregar) {
        agregarJuguetes(agregar.dataset.agregarJuguete);
        return;
    }

    const ver = evento.target.closest("[data-ver-juguete]");

    if (ver) {
        verDetalleJuguetes(ver.dataset.verJuguete);
        return;
    }

    if (
        evento.target.closest("[data-cerrar-juguete]") ||
        evento.target.id === "modal-juguete"
    ) {
        cerrarVentanaJuguetes();
    }

});

// CERRAR CON ESCAPE
document.addEventListener("keydown", evento => {

    if (evento.key === "Escape") {
        cerrarVentanaJuguetes();
    }

});

window.addEventListener("storage", actualizarContadorJuguetes);

// INICIAR
document.addEventListener("DOMContentLoaded", () => {

    crearVentanaJuguetes();

    actualizarContadorJuguetes();

    cargarJuguetes();

});
