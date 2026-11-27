/* ==========================================
   SKENZI HOME — BELLEZA
   SUPABASE + GALERÍA + CARRITO
   ========================================== */

"use strict";

const PRECIO_BELLEZA = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosBelleza = [];
let busquedaBelleza = "";

// ESCAPAR TEXTO
function escaparBelleza(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// NORMALIZAR TEXTO
function normalizarBelleza(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// CARGAR PRODUCTOS DE SUPABASE
async function cargarBelleza() {

    const galeria = document.getElementById("galeria-belleza");

    if (!galeria) return;

    try {

        const db = window.skenziDB;

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        galeria.innerHTML = "<p>Cargando productos de belleza...</p>";

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

        productosBelleza = (data || []).filter(producto => {

            const categoria = normalizarBelleza(
                producto.categorias?.nombre
            );

            return categoria.includes("belleza");
        });

        mostrarBelleza();

    } catch (error) {

        console.error("Error cargando productos de belleza:", error);

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                No pudimos cargar los productos de belleza.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA
function mostrarBelleza() {

    const galeria = document.getElementById("galeria-belleza");

    if (!galeria) return;

    const productosFiltrados = productosBelleza.filter(producto => {

        const nombre = normalizarBelleza(producto.nombre);
        const descripcion = normalizarBelleza(producto.descripcion);

        return (
            nombre.includes(busquedaBelleza) ||
            descripcion.includes(busquedaBelleza)
        );
    });

    if (!productosFiltrados.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                ${
                    busquedaBelleza
                    ? "No encontramos productos con esa búsqueda."
                    : "Próximamente tendremos productos de belleza disponibles."
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
            <article class="producto-belleza">

                <button
                    type="button"
                    class="ver-detalle-belleza"
                    data-ver-belleza="${escaparBelleza(producto.id)}"
                >

                    ${
                        imagen
                        ? `<img
                            src="${escaparBelleza(imagen)}"
                            alt="${escaparBelleza(producto.nombre)}"
                            loading="lazy"
                        >`
                        : `<div class="imagen-sin-belleza">🌸</div>`
                    }

                    <h3>${escaparBelleza(producto.nombre)}</h3>

                </button>

                <div class="contenido-belleza">

                    <p class="precio">
                        ${
                            precio > 0
                            ? PRECIO_BELLEZA.format(precio)
                            : "Consultar precio"
                        }
                    </p>

                    <button
                        type="button"
                        data-agregar-belleza="${escaparBelleza(producto.id)}"
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
function crearVentanaBelleza() {

    if (document.getElementById("modal-belleza")) return;

    document.body.insertAdjacentHTML("beforeend", `

        <div id="modal-belleza" class="modal-belleza" hidden>

            <div class="modal-belleza-contenido"
                 role="dialog"
                 aria-modal="true"
                 aria-label="Información del producto de belleza">

                <button
                    type="button"
                    class="cerrar-belleza"
                    data-cerrar-belleza
                    aria-label="Cerrar"
                >×</button>

                <div id="detalle-belleza"></div>

            </div>

        </div>

    `);
}

// VER DETALLE
function verDetalleBelleza(id) {

    const producto = productosBelleza.find(
        p => String(p.id) === String(id)
    );

    if (!producto) return;

    crearVentanaBelleza();

    const modal = document.getElementById("modal-belleza");
    const detalle = document.getElementById("detalle-belleza");

    const precio = Number(producto.precio_venta) || 0;
    const existencias = Number(producto.existencias) || 0;
    const disponible = existencias > 0 && precio > 0;

    detalle.innerHTML = `

        <div class="detalle-belleza">

            <div>
                ${
                    producto.imagen_url
                    ? `<img
                        src="${escaparBelleza(producto.imagen_url)}"
                        alt="${escaparBelleza(producto.nombre)}"
                    >`
                    : `<div class="imagen-sin-belleza">🌸</div>`
                }
            </div>

            <div>

                <span>SKENZI HOME</span>

                <h2>${escaparBelleza(producto.nombre)}</h2>

                <p>
                    ${escaparBelleza(
                        producto.descripcion || "Descubre este producto de nuestra colección."
                    )}
                </p>

                <p class="precio">
                    ${
                        precio > 0
                        ? PRECIO_BELLEZA.format(precio)
                        : "Consultar precio"
                    }
                </p>

                <p>
                    ${existencias > 0 ? "Disponible" : "Agotado"}
                </p>

                <button
                    type="button"
                    data-agregar-belleza="${escaparBelleza(producto.id)}"
                    ${disponible ? "" : "disabled"}
                >
                    ${disponible ? "Añadir al carrito" : "No disponible"}
                </button>

            </div>

        </div>

    `;

    modal.hidden = false;
    document.body.classList.add("modal-abierto-belleza");
}

// CERRAR VENTANA
function cerrarVentanaBelleza() {

    const modal = document.getElementById("modal-belleza");

    if (modal) modal.hidden = true;

    document.body.classList.remove("modal-abierto-belleza");
}

// AGREGAR AL CARRITO
function agregarBelleza(id) {

    const producto = productosBelleza.find(
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

    actualizarContadorBelleza();

    alert("¡Producto agregado al carrito!");
}

// ACTUALIZAR CONTADORES (ENCABEZADO + FLOTANTE)
function actualizarContadorBelleza() {

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

        console.error("Error al leer el carrito en Belleza:", error);
        if (contador) contador.textContent = "0";
        if (contadorFlotante) contadorFlotante.textContent = "0";

    }
}

// BUSCADOR
document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscador-belleza");
    const campo = document.getElementById("buscar-producto-belleza");

    if (buscador && campo) {

        buscador.addEventListener("submit", evento => {

            evento.preventDefault();

            busquedaBelleza = normalizarBelleza(campo.value);

            mostrarBelleza();

        });

    }

});

// EVENTOS DE PRODUCTOS
document.addEventListener("click", evento => {

    const agregar = evento.target.closest("[data-agregar-belleza]");

    if (agregar) {
        agregarBelleza(agregar.dataset.agregarBelleza);
        return;
    }

    const ver = evento.target.closest("[data-ver-belleza]");

    if (ver) {
        verDetalleBelleza(ver.dataset.verBelleza);
        return;
    }

    if (
        evento.target.closest("[data-cerrar-belleza]") ||
        evento.target.id === "modal-belleza"
    ) {
        cerrarVentanaBelleza();
    }

});

// CERRAR CON ESCAPE
document.addEventListener("keydown", evento => {

    if (evento.key === "Escape") {
        cerrarVentanaBelleza();
    }

});

window.addEventListener("storage", actualizarContadorBelleza);

// INICIAR
document.addEventListener("DOMContentLoaded", () => {

    crearVentanaBelleza();

    actualizarContadorBelleza();

    cargarBelleza();

});
