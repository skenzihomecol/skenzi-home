
/* ==========================================
   SKENZI HOME — INFORMACIÓN INDIVIDUAL
   GALERÍA DE FOTOGRAFÍAS
   ========================================== */

"use strict";

const WHATSAPP_PRODUCTO = "573105001079";

const formatoPrecioProducto = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productoActual = null;
let fotosProducto = [];
let indiceImagenActual = 0;

// ESCAPAR TEXTO
function escaparProducto(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// PREPARAR LAS FOTOGRAFÍAS
function obtenerFotosProducto(producto) {

    const fotos = [];

    if (producto.imagen_url) {
        fotos.push(producto.imagen_url);
    }

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

    adicionales.forEach(imagen => {

        let url = "";

        if (typeof imagen === "string") {
            url = imagen;
        } else if (imagen && typeof imagen === "object") {
            url = imagen.url || imagen.image_url || imagen.src || "";
        }

        if (url && !fotos.includes(url)) {
            fotos.push(url);
        }
    });

    return fotos;
}

// OBTENER EL IDENTIFICADOR DE LA URL
async function cargarDetalleProducto() {

    const parametros = new URLSearchParams(window.location.search);
    const idProducto = parametros.get("id");

    if (!idProducto) {
        mostrarErrorProducto("No se ha seleccionado ningún producto.");
        return;
    }

    try {

        if (!window.skenziDB) {
            throw new Error("No hay conexión con la base de datos.");
        }

        const { data, error } = await window.skenziDB
            .from("productos")
            .select(`
                id,
                nombre,
                descripcion,
                precio_venta,
                existencias,
                imagen_url,
                imagenes_adicionales,
                activo,
                categoria_id,
                categorias(nombre)
            `)
            .eq("id", idProducto)
            .eq("activo", true)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            mostrarErrorProducto("Este producto no está disponible.");
            return;
        }

        productoActual = data;

        fotosProducto = obtenerFotosProducto(data);
        indiceImagenActual = 0;

        mostrarDetalleProducto(data);

    } catch (error) {

        console.error("Error al consultar el producto:", error);

        mostrarErrorProducto(
            "No fue posible cargar la información. Intenta nuevamente."
        );
    }
}

// CREAR GALERÍA


function crearGaleriaProducto(nombre) {

    if (fotosProducto.length === 0) {
        return `
            <div class="galeria-producto">
                <div class="imagen-principal">
                    <div class="imagen-vacia">🛍️</div>
                </div>
            </div>
        `;
    }

    const imagenes = fotosProducto;

    let controles = "";
    let miniaturas = "";
    let contador = "";

    if (imagenes.length > 1) {

        controles = `
            <button
                type="button"
                class="flecha-imagen flecha-anterior"
                id="imagen-anterior"
                aria-label="Fotografía anterior"
            >&#10094;</button>

            <button
                type="button"
                class="flecha-imagen flecha-siguiente"
                id="imagen-siguiente"
                aria-label="Fotografía siguiente"
            >&#10095;</button>
        `;

        miniaturas = `
            <div class="miniaturas-producto">
                ${imagenes.map((url, indice) => `
                    <button
                        type="button"
                        class="miniatura-producto ${indice === 0 ? "activa" : ""}"
                        data-indice="${indice}"
                        aria-label="Ver fotografía ${indice + 1}"
                    >
                        <img
                            src="${escaparProducto(url)}"
                            alt="${escaparProducto(nombre)} - foto ${indice + 1}"
                        >
                    </button>
                `).join("")}
            </div>
        `;

        contador = `
            <p class="contador-imagenes" id="contador-imagenes">
                1 / ${imagenes.length}
            </p>
        `;
    }

    return `
        <div class="galeria-producto">

            <div class="imagen-principal">

                <img
                    id="imagen-producto-actual"
                    src="${escaparProducto(imagenes[0])}"
                    alt="${escaparProducto(nombre)}"
                >

                ${controles}

            </div>

            ${miniaturas}
            ${contador}

        </div>
    `;
}

// CAMBIAR FOTOGRAFÍA
function cambiarImagenProducto(indice) {

    if (!fotosProducto.length) return;

    const total = fotosProducto.length;

    indiceImagenActual = (indice + total) % total;

    const imagen = document.getElementById("imagen-producto-actual");

    if (imagen) {
        imagen.src = fotosProducto[indiceImagenActual];
        imagen.alt = `${productoActual.nombre} - fotografía ${indiceImagenActual + 1}`;
    }

    document.querySelectorAll(".miniatura-producto").forEach((miniatura, indiceMiniatura) => {

        miniatura.classList.toggle(
            "activa",
            indiceMiniatura === indiceImagenActual
        );
    });

    const contador = document.getElementById("contador-imagenes");

    if (contador) {
        contador.textContent = `${indiceImagenActual + 1} / ${total}`;
    }
}

// ACTIVAR CONTROLES DE LA GALERÍA
function activarGaleriaProducto() {

    const anterior = document.getElementById("imagen-anterior");
    const siguiente = document.getElementById("imagen-siguiente");

    if (anterior) {
        anterior.addEventListener("click", () => {
            cambiarImagenProducto(indiceImagenActual - 1);
        });
    }

    if (siguiente) {
        siguiente.addEventListener("click", () => {
            cambiarImagenProducto(indiceImagenActual + 1);
        });
    }

    document.querySelectorAll(".miniatura-producto").forEach(miniatura => {

        miniatura.addEventListener("click", () => {

            const indice = Number(miniatura.dataset.indice);

            cambiarImagenProducto(indice);
        });
    });
}

// MOSTRAR INFORMACIÓN DEL PRODUCTO
function mostrarDetalleProducto(producto) {

    const contenedor = document.getElementById("detalle-producto");

    const nombre = producto.nombre || "Producto sin nombre";

    const descripcion = producto.descripcion ||
        "Consulta más información con nuestro equipo.";

    const precio = Number(producto.precio_venta) || 0;

    const existencias = Number(producto.existencias) || 0;

    const categoria = Array.isArray(producto.categorias)
        ? producto.categorias[0]?.nombre
        : producto.categorias?.nombre;

    contenedor.innerHTML = `

        ${crearGaleriaProducto(nombre)}

        <div class="informacion-producto">

            <p class="categoria-producto">
                ${escaparProducto(categoria || "Skenzi Home")}
            </p>

            <h1>${escaparProducto(nombre)}</h1>

            <p class="descripcion-detallada">
                ${escaparProducto(descripcion)}
            </p>

            <p class="precio-detallado">
                ${precio > 0
                    ? formatoPrecioProducto.format(precio)
                    : "Consultar precio"}
            </p>

            <div class="cantidad-producto">

                <label for="cantidad-producto">
                    Cantidad:
                </label>

                <input
                    type="number"
                    id="cantidad-producto"
                    min="1"
                    max="${existencias}"
                    value="1"
                    ${existencias <= 0 ? "disabled" : ""}
                >

            </div>

            <div class="acciones-producto">

                <button
                    type="button"
                    class="boton-agregar"
                    id="agregar-detalle"
                    ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                >
                    Agregar al carrito
                </button>

                <a
                    href="#"
                    class="boton-whatsapp"
                    id="consultar-whatsapp"
                >
                    Consultar por WhatsApp
                </a>

            </div>

        </div>
    `;

    activarGaleriaProducto();

    document.getElementById("agregar-detalle")
        .addEventListener("click", agregarDesdeDetalle);

    document.getElementById("consultar-whatsapp")
        .addEventListener("click", consultarWhatsApp);
}

// AGREGAR AL CARRITO
function agregarDesdeDetalle() {

    if (!productoActual) return;

    const cantidadInput = document.getElementById("cantidad-producto");

    const cantidad = Number(cantidadInput.value);

    const existencias = Number(productoActual.existencias);

    const precio = Number(productoActual.precio_venta);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > existencias) {
        alert("Selecciona una cantidad válida.");
        return;
    }

    if (precio <= 0) {
        alert("Este producto no tiene un precio disponible.");
        return;
    }

    const clave = "skenzi_carrito";

    let carrito = [];

    try {

        carrito = JSON.parse(localStorage.getItem(clave)) || [];

        if (!Array.isArray(carrito)) carrito = [];

    } catch {
        carrito = [];
    }

    const existente = carrito.find(
        item => String(item.id) === String(productoActual.id)
    );

    const cantidadFinal = cantidad +
        (existente ? Number(existente.cantidad) : 0);

    if (cantidadFinal > existencias) {
        alert("No hay suficientes unidades disponibles.");
        return;
    }

    if (existente) {

        existente.cantidad = cantidadFinal;

    } else {

        carrito.push({
            id: productoActual.id,
            cantidad: cantidad
        });
    }

    localStorage.setItem(clave, JSON.stringify(carrito));

    alert("¡Producto agregado al carrito!");
}

// CONSULTAR POR WHATSAPP
function consultarWhatsApp(evento) {

    evento.preventDefault();

    if (!productoActual) return;

    const mensaje = `Hola, estoy interesado en este producto de Skenzi Home:

${productoActual.nombre}

¿Me pueden brindar más información?`;

    const url = `https://wa.me/${WHATSAPP_PRODUCTO}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
}

// MOSTRAR ERRORES
function mostrarErrorProducto(mensaje) {

    const contenedor = document.getElementById("detalle-producto");

    if (contenedor) {

        contenedor.innerHTML = `
            <div class="mensaje-carga">

                <h2>Producto no disponible</h2>

                <p>${escaparProducto(mensaje)}</p>

                <a href="index.html">
                    Volver a la tienda
                </a>

            </div>
        `;
    }
}

// INICIAR
document.addEventListener("DOMContentLoaded", cargarDetalleProducto);
