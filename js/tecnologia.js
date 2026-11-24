
/* ==========================================
   SKENZI HOME — TECNOLOGÍA
   SUPABASE + GALERÍA + CARRITO
   ========================================== */

"use strict";

const PRECIO_TECNOLOGIA = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosTecnologia = [];
let busquedaTecnologia = "";

// ESCAPAR TEXTO
function escaparTecnologia(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// NORMALIZAR TEXTO
function normalizarTecnologia(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS DE SUPABASE
async function cargarTecnologia() {
    const galeria = document.getElementById("galeria-tecnologia");

    if (!galeria) return;

    try {
        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = "<p>Cargando productos de tecnología...</p>";

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

        productosTecnologia = (data || []).filter(producto => {
            const categoria = normalizarTecnologia(
                producto.categorias?.nombre
            );

            return categoria.includes("tecnologia");
        });

        mostrarTecnologia();

    } catch (error) {
        console.error("Error cargando tecnología:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los productos de tecnología.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA
function mostrarTecnologia() {
    const galeria = document.getElementById("galeria-tecnologia");

    if (!galeria) return;

    const productosFiltrados = productosTecnologia.filter(producto => {
        const nombre = normalizarTecnologia(producto.nombre);
        const descripcion = normalizarTecnologia(producto.descripcion);

        return (
            nombre.includes(busquedaTecnologia) ||
            descripcion.includes(busquedaTecnologia)
        );
    });

    if (!productosFiltrados.length) {
        galeria.innerHTML = `
            <p class="mensaje-vacio">
                ${
                    busquedaTecnologia
                    ? "No encontramos productos con esa búsqueda."
                    : "Próximamente tendremos productos de tecnología disponibles."
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
            <article class="producto-tecnologia">

                <button
                    type="button"
                    class="ver-detalle-tecnologia"
                    data-ver-tecnologia="${escaparTecnologia(producto.id)}"
                >
                    ${
                        imagen
                        ? `<img
                            src="${escaparTecnologia(imagen)}"
                            alt="${escaparTecnologia(producto.nombre)}"
                            loading="lazy"
                        >`
                        : `<div class="imagen-sin-tecnologia">💻</div>`
                    }

                    <h3>${escaparTecnologia(producto.nombre)}</h3>
                </button>

                <div class="contenido-tecnologia">

                    <p class="precio">
                        ${
                            precio > 0
                            ? PRECIO_TECNOLOGIA.format(precio)
                            : "Consultar precio"
                        }
                    </p>

                    <button
                        type="button"
                        data-agregar-tecnologia="${escaparTecnologia(producto.id)}"
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
function crearVentanaTecnologia() {
    if (document.getElementById("modal-tecnologia")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="modal-tecnologia" class="modal-tecnologia" hidden>

            <div class="modal-tecnologia-contenido"
                 role="dialog"
                 aria-modal="true"
                 aria-label="Información del producto">

                <button
                    type="button"
                    class="cerrar-tecnologia"
                    data-cerrar-tecnologia
                    aria-label="Cerrar"
                >×</button>

                <div id="detalle-tecnologia"></div>

            </div>

        </div>
    `);
}

// VER DETALLE
function verDetalleTecnologia(id) {
    const producto = productosTecnologia.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    crearVentanaTecnologia();

    const modal = document.getElementById("modal-tecnologia");
    const detalle = document.getElementById("detalle-tecnologia");

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;

    detalle.innerHTML = `
        <div class="detalle-tecnologia">

            <div>
                ${
                    producto.imagen_url
                    ? `<img
                        src="${escaparTecnologia(producto.imagen_url)}"
                        alt="${escaparTecnologia(producto.nombre)}"
                    >`
                    : `<div class="imagen-sin-tecnologia">💻</div>`
                }
            </div>

            <div>

                <span>SKENZI HOME</span>

                <h2>${escaparTecnologia(producto.nombre)}</h2>

                <p>
                    ${escaparTecnologia(
                        producto.descripcion || "Descubre este producto de nuestra colección."
                    )}
                </p>

                <p class="precio">
                    ${
                        precio > 0
                        ? PRECIO_TECNOLOGIA.format(precio)
                        : "Consultar precio"
                    }
                </p>

                <p>
                    ${existencias > 0 ? "Disponible" : "Agotado"}
                </p>

                <button
                    type="button"
                    data-agregar-tecnologia="${escaparTecnologia(producto.id)}"
                    ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                >
                    Añadir al carrito
                </button>

            </div>

        </div>
    `;

    modal.hidden = false;
    document.body.classList.add("modal-abierto-tecnologia");
}

// CERRAR VENTANA
function cerrarVentanaTecnologia() {
    const modal = document.getElementById("modal-tecnologia");

    if (modal) modal.hidden = true;

    document.body.classList.remove("modal-abierto-tecnologia");
}

// AGREGAR AL CARRITO
function agregarTecnologia(id) {
    const producto = productosTecnologia.find(
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

    actualizarContadorTecnologia();

    alert("¡Producto agregado al carrito!");
}

// ACTUALIZAR CONTADOR
function actualizarContadorTecnologia() {
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
    const buscador = document.getElementById("buscador-tecnologia");
    const campo = document.getElementById("buscar-producto-tecnologia");

    if (buscador && campo) {
        buscador.addEventListener("submit", evento => {
            evento.preventDefault();

            busquedaTecnologia = normalizarTecnologia(campo.value);

            mostrarTecnologia();
        });
    }
});

// EVENTOS DE PRODUCTOS
document.addEventListener("click", evento => {
    const agregar = evento.target.closest("[data-agregar-tecnologia]");

    if (agregar) {
        agregarTecnologia(agregar.dataset.agregarTecnologia);
        return;
    }

    const ver = evento.target.closest("[data-ver-tecnologia]");

    if (ver) {
        verDetalleTecnologia(ver.dataset.verTecnologia);
        return;
    }

    if (
        evento.target.closest("[data-cerrar-tecnologia]") ||
        evento.target.id === "modal-tecnologia"
    ) {
        cerrarVentanaTecnologia();
    }
});

// CERRAR CON ESCAPE
document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        cerrarVentanaTecnologia();
    }
});

// INICIAR
document.addEventListener("DOMContentLoaded", () => {
    crearVentanaTecnologia();
    actualizarContadorTecnologia();
    cargarTecnologia();
});
