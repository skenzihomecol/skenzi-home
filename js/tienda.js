

/* =====================================================
   SKENZI HOME — SISTEMA PRINCIPAL DE LA TIENDA
   Catálogo, categorías, ofertas, búsqueda y carrito
   ===================================================== */

/* 1. CONFIGURACIÓN */

const NUMERO_WHATSAPP = ""; // Configura aquí tu número comercial.

const CATEGORIAS = [
    { id: "hogar", nombre: "Hogar", icono: "🏠" },
    { id: "deporte", nombre: "Deporte", icono: "🏃" },
    { id: "tecnologia", nombre: "Tecnología", icono: "💻" },
    { id: "industrial", nombre: "Industrial", icono: "🛠️" },
    { id: "juguetes", nombre: "Juguetes", icono: "🧸" },
    { id: "belleza", nombre: "Belleza", icono: "💄" }
];

/*
  PRODUCTOS DE DEMOSTRACIÓN.
  Los precios e imágenes son ilustrativos.
  No son ofertas comerciales reales.
*/

let PRODUCTOS = [];
const leerCarrito = () => {
    try {
        const datos = JSON.parse(
            localStorage.getItem("skenzi_carrito") || "[]"
        );

        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
};

const guardarCarrito = productos => {
    localStorage.setItem(
        "skenzi_carrito",
        JSON.stringify(productos)
    );
};

const buscarCategoria = id =>
    CATEGORIAS.find(c => c.id === id);


/* 2. UTILIDADES */

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function mostrarMensaje(texto) {
    const elemento = document.getElementById("mensaje-tienda");

    if (elemento) {
        elemento.textContent = texto;
        elemento.hidden = false;
    } else {
        alert(texto);
    }
}

function actualizarContadorCarrito() {
    const cantidad = leerCarrito().reduce(
        (total, producto) => total + producto.cantidad,
        0
    );

    document.querySelectorAll("[data-contador-carrito]")
        .forEach(elemento => {
            elemento.textContent = cantidad;
        });
}

function productoTienePrecio(producto) {
    return Number.isFinite(Number(producto.precio)) &&
        Number(producto.precio) > 0;
}

function obtenerImagen(producto) {
    if (producto.imagen) {
        return `
            <img
                src="${escapar(producto.imagen)}"
                alt="${escapar(producto.nombre)}"
                loading="lazy"
            >
        `;
    }

    return `<span aria-hidden="true">${
        buscarCategoria(producto.categoria)?.icono || "🛍️"
    }</span>`;
}

function obtenerPrecioAnterior(producto) {
    const anterior = Number(producto.precioAnterior);
    const actual = Number(producto.precio);

    if (anterior > actual && actual > 0) {
        return `
            <p class="precio-anterior">
                ${FORMATO_COP.format(anterior)}
            </p>
        `;
    }

    return "";
}

function obtenerDescuento(producto) {
    const anterior = Number(producto.precioAnterior);
    const actual = Number(producto.precio);

    if (anterior > actual && actual > 0) {
        const porcentaje = Math.round(
            (1 - actual / anterior) * 100
        );

        return `
            <span class="descuento-oferta">
                ${porcentaje}% OFF
            </span>
        `;
    }

    return "";
}
/* ==========================================================
   3. TARJETAS DE PRODUCTOS
   ========================================================== */

function tarjetaProducto(producto) {
    const precio = productoTienePrecio(producto)
        ? FORMATO_COP.format(producto.precio)
        : "Precio por confirmar";

    const oferta = producto.oferta
        ? '<span class="etiqueta-oferta">OFERTA DEMO</span>'
        : "";

    const esDemo = producto.id.startsWith("demo-");

    const avisoDemo = esDemo
        ? '<p class="estado"><strong>DEMOSTRACIÓN:</strong> precio e imagen ilustrativos; no es una oferta real.</p>'
        : "";

    const boton = productoTienePrecio(producto) && !esDemo
        ? `
            <button type="button" data-agregar="${escapar(producto.id)}">
                Agregar al carrito
            </button>
        `
        : `
            <button type="button" data-consultar="${escapar(producto.id)}">
                ${esDemo ? "Producto de demostración" : "Consultar producto"}
            </button>
        `;

    return `
        <article class="tarjeta">
            <div class="producto-imagen">
                ${obtenerImagen(producto)}
            </div>

            <div class="producto-cuerpo">
                ${oferta}
                <h3>${escapar(producto.nombre)}</h3>
                ${avisoDemo}
                ${obtenerPrecioAnterior(producto)}

                <p class="precio">
                    ${precio}
                    ${obtenerDescuento(producto)}
                </p>

                <p class="estado">
                    Disponibilidad:
                    ${escapar(producto.disponible || "Por confirmar")}
                </p>

                <div class="acciones-producto">
                    ${boton}
                </div>
            </div>
        </article>
    `;
}

function mostrarProductos(lista, idContenedor = "productos") {
    const contenedor = document.getElementById(idContenedor);

    if (!contenedor) return;

    if (!lista.length) {
        contenedor.innerHTML = `
            <div class="vacio">
                Todavía no hay productos publicados en esta sección.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = lista.map(tarjetaProducto).join("");
}


/* ==========================================================
   4. GALERÍA DE OFERTAS
   ========================================================== */

function mostrarOfertaDelDia() {
    const contenedor = document.getElementById("producto-oferta-dia");

    if (!contenedor) return;

    const ofertas = PRODUCTOS.filter(producto =>
        producto.activo &&
        producto.oferta &&
        productoTienePrecio(producto)
    );

    const destacado =
        ofertas.find(producto => producto.destacado) || ofertas[0];

    if (!destacado) {
        contenedor.innerHTML = `
            <div class="vacio">
                <p><strong>Oferta del día</strong></p>
                <p>
                    Estamos preparando nuestras ofertas especiales.
                    Pronto encontrarás aquí un producto destacado.
                </p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = `
        <article class="producto-oferta-dia">
            <div class="producto-imagen">
                ${obtenerImagen(destacado)}
            </div>

            <div class="producto-cuerpo">
                <h3>${escapar(destacado.nombre)}</h3>

                ${obtenerPrecioAnterior(destacado)}

                <p class="precio-oferta">
                    ${FORMATO_COP.format(destacado.precio)}
                    ${obtenerDescuento(destacado)}
                </p>

                <p class="estado">
                    Disponibilidad:
                    ${escapar(destacado.disponible || "Por confirmar")}
                </p>

                <p class="estado">
                    <strong>DEMOSTRACIÓN:</strong>
                    precio ilustrativo; no publicar como oferta real.
                </p>

                <div class="acciones-producto">
                    <button type="button"
                        data-consultar="${escapar(destacado.id)}">
                        Ver ejemplo
                    </button>
                </div>
            </div>
        </article>
    `;
}

function mostrarCarruselOfertas() {
    const contenedor = document.getElementById("carrusel-ofertas");

    if (!contenedor) return;

    const ofertas = PRODUCTOS.filter(producto =>
        producto.activo &&
        producto.oferta &&
        productoTienePrecio(producto)
    );

    if (!ofertas.length) {
        contenedor.innerHTML = `
            <div class="vacio">
                Aún no hay productos en oferta.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = ofertas.map(tarjetaProducto).join("");
}

function configurarFlechasOfertas() {
    const carrusel = document.getElementById("carrusel-ofertas");
    const anterior = document.getElementById("ofertas-anterior");
    const siguiente = document.getElementById("ofertas-siguiente");

    if (!carrusel || !anterior || !siguiente) return;

    anterior.addEventListener("click", () => {
        carrusel.scrollBy({
            left: -Math.max(200, carrusel.clientWidth * 0.8),
            behavior: "smooth"
        });
    });

    siguiente.addEventListener("click", () => {
        carrusel.scrollBy({
            left: Math.max(200, carrusel.clientWidth * 0.8),
            behavior: "smooth"
        });
    });
}


/* ==========================================================
   5. MENÚ DE CATEGORÍAS
   ========================================================== */

function configurarMenu() {
    const boton = document.querySelector("[data-boton-categorias]");
    const menu = document.querySelector(".menu-categorias");

    if (!boton || !menu) return;

    boton.addEventListener("click", evento => {
        evento.stopPropagation();

        const abierto = menu.classList.toggle("abierto");
        boton.setAttribute("aria-expanded", String(abierto));
    });

    document.addEventListener("click", evento => {
        if (!menu.contains(evento.target)) {
            menu.classList.remove("abierto");
            boton.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            menu.classList.remove("abierto");
            boton.setAttribute("aria-expanded", "false");
        }
    });
}
/* ==========================================================
   6. BÚSQUEDA DE PRODUCTOS
   ========================================================== */

function configurarBusqueda() {
    const formulario = document.querySelector("[data-busqueda]");

    if (!formulario) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const entrada = formulario.querySelector("input");
        const texto = (entrada?.value || "").trim().toLowerCase();

        const resultados = PRODUCTOS.filter(producto => {
            if (!producto.activo) return false;

            const nombre = (producto.nombre || "").toLowerCase();
            const categoria = (producto.categoria || "").toLowerCase();
            const descripcion = (producto.descripcion || "").toLowerCase();

            return (
                nombre.includes(texto) ||
                categoria.includes(texto) ||
                descripcion.includes(texto)
            );
        });

        mostrarProductos(resultados, "galeria-productos");

        const titulo = document.getElementById("titulo-productos");

        if (titulo) {
            titulo.textContent = texto
                ? `Resultados para: ${texto}`
                : "Todos nuestros productos";
        }

        document.getElementById("productos")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}


/* ==========================================================
   7. CARRITO DE COMPRAS
   ========================================================== */

function agregarAlCarrito(idProducto) {
    const producto = PRODUCTOS.find(item => item.id === idProducto);

    if (!producto) {
        mostrarMensaje("No encontramos este producto.");
        return;
    }

    if (producto.id.startsWith("demo-")) {
        mostrarMensaje(
            "Este es un producto de demostración. Debes configurar tus productos reales antes de vender."
        );
        return;
    }

    if (!productoTienePrecio(producto)) {
        mostrarMensaje("Este producto todavía no tiene un precio confirmado.");
        return;
    }

    if (producto.disponible === "Agotado") {
        mostrarMensaje("Este producto está agotado por el momento.");
        return;
    }

    const carrito =leerCarrito();
    const existente = carrito.find(item => item.id === idProducto);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarContadorCarrito();

    mostrarMensaje("Producto agregado al carrito.");
}

function quitarDelCarrito(idProducto) {
 const carrito = leerCarrito().filter(item => item.id !== idProducto);

    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarCarrito();
}

function cambiarCantidad(idProducto, cantidad) {
  const carrito = leerCarrito().filter(item => item.id !== idProducto);
    const item = carrito.find(producto => producto.id === idProducto);

    if (!item) return;

    const nuevaCantidad = Number(cantidad);

    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 1) {
        quitarDelCarrito(idProducto);
        return;
    }

    item.cantidad = Math.floor(nuevaCantidad);

    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarCarrito();
}

function mostrarCarrito() {
    const contenedor = document.getElementById("lista-carrito");
    const totalElemento = document.getElementById("total-carrito");

    if (!contenedor) return;

   const carrito = leerCarrito().filter(item => item.id !== idProducto);

    if (!carrito.length) {
        contenedor.innerHTML = `
            <div class="vacio">
                <p>Tu carrito está vacío.</p>
                <p>Explora nuestro catálogo y agrega tus productos favoritos.</p>
            </div>
        `;

        if (totalElemento) {
            totalElemento.textContent = FORMATO_COP.format(0);
        }

        return;
    }

    let total = 0;

    contenedor.innerHTML = carrito.map(item => {
        const producto = PRODUCTOS.find(p => p.id === item.id);

        if (!producto || !productoTienePrecio(producto)) {
            return "";
        }

        const subtotal = producto.precio * item.cantidad;
        total += subtotal;

        return `
            <article class="item-carrito">
                <div class="producto-imagen">
                    ${obtenerImagen(producto)}
                </div>

                <div class="producto-cuerpo">
                    <h3>${escapar(producto.nombre)}</h3>

                    <p>
                        Precio:
                        ${FORMATO_COP.format(producto.precio)}
                    </p>

                    <label>
                        Cantidad:
                        <input
                            type="number"
                            min="1"
                            value="${item.cantidad}"
                            data-cantidad="${escapar(item.id)}"
                        >
                    </label>

                    <p>
                        Subtotal:
                        ${FORMATO_COP.format(subtotal)}
                    </p>

                    <button
                        type="button"
                        data-quitar="${escapar(item.id)}"
                    >
                        Quitar
                    </button>
                </div>
            </article>
        `;
    }).join("");

    if (totalElemento) {
        totalElemento.textContent = FORMATO_COP.format(total);
    }
}


/* ==========================================================
   8. CONSULTAS POR WHATSAPP
   ========================================================== */

function consultarProducto(idProducto) {
    const producto = PRODUCTOS.find(item => item.id === idProducto);

    if (!producto) {
        mostrarMensaje("No encontramos este producto.");
        return;
    }

    const precio = productoTienePrecio(producto)
        ? FORMATO_COP.format(producto.precio)
        : "Precio por confirmar";

    const mensaje = encodeURIComponent(
        `Hola, Skenzi Home. Quiero consultar información sobre: ${producto.nombre}. Precio: ${precio}. ¿Me pueden brindar más información?`
    );

    if (!NUMERO_WHATSAPP) {
        mostrarMensaje(
            "Falta configurar el número de WhatsApp de Skenzi Home en tienda.js."
        );
        return;
    }

    const numero = NUMERO_WHATSAPP.replace(/\D/g, "");

    window.open(
        `https://wa.me/${numero}?text=${mensaje}`,
        "_blank",
        "noopener,noreferrer"
    );
}

function enviarPedidoWhatsApp() {
    if (!NUMERO_WHATSAPP) {
        mostrarMensaje(
            "Falta configurar el número de WhatsApp de Skenzi Home en tienda.js."
        );
        return;
    }

  const carrito = leerCarrito().filter(item => item.id !== idProducto);

    if (!carrito.length) {
        mostrarMensaje("Tu carrito está vacío.");
        return;
    }

    let total = 0;
    const lineas = [];

    for (const item of carrito) {
        const producto = PRODUCTOS.find(p => p.id === item.id);

        if (!producto || !productoTienePrecio(producto)) continue;

        if (producto.id.startsWith("demo-")) {
            mostrarMensaje(
                "El carrito contiene productos de demostración. Configura tus productos reales antes de hacer un pedido."
            );
            return;
        }

        const subtotal = producto.precio * item.cantidad;
        total += subtotal;

        lineas.push(
            `- ${producto.nombre} x ${item.cantidad}: ${FORMATO_COP.format(subtotal)}`
        );
    }

    if (!lineas.length) {
        mostrarMensaje("No hay productos válidos para enviar el pedido.");
        return;
    }

    const mensaje = encodeURIComponent(
        `Hola, Skenzi Home. Quiero realizar el siguiente pedido:\n\n${lineas.join("\n")}\n\nTotal de productos: ${FORMATO_COP.format(total)}\n\nPor favor, confirmen disponibilidad, costo del domicilio y medios de pago.`
    );

    const numero = NUMERO_WHATSAPP.replace(/\D/g, "");

    window.open(
        `https://wa.me/${numero}?text=${mensaje}`,
        "_blank",
        "noopener,noreferrer"
    );
}
/* ==========================================================
   9. EVENTOS DE LA TIENDA
   ========================================================== */

document.addEventListener("click", evento => {
    const botonAgregar = evento.target.closest("[data-agregar]");

    if (botonAgregar) {
        agregarAlCarrito(botonAgregar.dataset.agregar);
        return;
    }

    const botonConsultar = evento.target.closest("[data-consultar]");

    if (botonConsultar) {
        consultarProducto(botonConsultar.dataset.consultar);
        return;
    }

    const botonQuitar = evento.target.closest("[data-quitar]");

    if (botonQuitar) {
        quitarDelCarrito(botonQuitar.dataset.quitar);
    }
});


/* ==========================================================
   10. CAMBIOS DE CANTIDAD EN EL CARRITO
   ========================================================== */

document.addEventListener("change", evento => {
    const entradaCantidad = evento.target.closest("[data-cantidad]");

    if (entradaCantidad) {
        cambiarCantidad(
            entradaCantidad.dataset.cantidad,
            entradaCantidad.value
        );
    }
});


/* ==========================================================
   11. BOTÓN PARA REALIZAR EL PEDIDO
   ========================================================== */

function configurarBotonPedido() {
    const boton = document.getElementById("pedido-whatsapp");

    if (!boton) return;

    boton.addEventListener("click", enviarPedidoWhatsApp);
}


/* ==========================================================
   12. INICIO DE LA TIENDA SKENZI HOME
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    configurarMenu();
    configurarBusqueda();
    configurarBotonPedido();

    const categoriaActual = document.body.dataset.categoria;
    const paginaActual = document.body.dataset.pagina;

    if (categoriaActual) {
        const productosCategoria = PRODUCTOS.filter(producto =>
            producto.activo &&
            producto.categoria === categoriaActual
        );

        mostrarProductos(productosCategoria, "galeria-productos");
    } else if (paginaActual === "ofertas") {
        const ofertas = PRODUCTOS.filter(producto =>
            producto.activo && producto.oferta
        );

        mostrarProductos(ofertas, "galeria-productos");
    } else if (paginaActual === "novedades") {
        const novedades = PRODUCTOS.filter(producto =>
            producto.activo && producto.novedad
        );

        mostrarProductos(novedades, "galeria-productos");
    } else {
        const productosActivos = PRODUCTOS.filter(producto =>
            producto.activo
        );

        mostrarProductos(productosActivos, "galeria-productos");
    }

    mostrarOfertaDelDia();
    mostrarCarruselOfertas();
    configurarFlechasOfertas();
    actualizarContadorCarrito();

    if (document.getElementById("lista-carrito")) {
        mostrarCarrito();
    }
});
