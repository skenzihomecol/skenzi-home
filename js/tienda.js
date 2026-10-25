javascript
"use strict";

/* =====================================================
   SKENZI HOME — SISTEMA PRINCIPAL DE LA TIENDA
   Catálogo, categorías, ofertas, búsqueda y carrito
   ===================================================== */

/* 1. CONFIGURACIÓN */

const NUMERO_WHATSAPP = ""; // Escribe aquí el número comercial con indicativo del país, solo números.

const CATEGORIAS = [
    { id: "hogar", nombre: "Hogar", icono: "🏠" },
    { id: "deporte", nombre: "Deporte", icono: "🏃" },
    { id: "tecnologia", nombre: "Tecnología", icono: "💻" },
    { id: "industrial", nombre: "Industrial", icono: "🛠️" },
    { id: "juguetes", nombre: "Juguetes", icono: "🧸" },
    { id: "belleza", nombre: "Belleza", icono: "💄" }
];

/*
  IMPORTANTE:
  Estos productos son ejemplos. Reemplázalos por productos reales.
  precioAnterior solo se utiliza cuando es mayor que precio.
  oferta y novedad deben ser true o false.
*/

const PRODUCTOS = [
    {
        id: "demo-hogar-1",
        nombre: "Organizador para el hogar (ejemplo)",
        categoria: "hogar",
        precio: 0,
        precioAnterior: 0,
        disponible: "Por confirmar",
        imagen: "",
        descripcion: "Producto de ejemplo.",
        oferta: false,
        novedad: false,
        destacado: false,
        activo: true
    },
    {
        id: "demo-deporte-1",
        nombre: "Accesorio deportivo (ejemplo)",
        categoria: "deporte",
        precio: 0,
        precioAnterior: 0,
        disponible: "Por confirmar",
        imagen: "",
        descripcion: "Producto de ejemplo.",
        oferta: false,
        novedad: false,
        destacado: false,
        activo: true
    },
    {
        id: "demo-tecnologia-1",
        nombre: "Accesorio tecnológico (ejemplo)",
        categoria: "tecnologia",
        precio: 0,
        precioAnterior: 0,
        disponible: "Por confirmar",
        imagen: "",
        descripcion: "Producto de ejemplo.",
        oferta: false,
        novedad: false,
        destacado: false,
        activo: true
    },
    {
        id: "demo-industrial-1",
        nombre: "Herramienta (ejemplo)",
        categoria: "industrial",
        precio: 0,
        precioAnterior: 0,
        disponible: "Por confirmar",
        imagen: "",
        descripcion: "Producto de ejemplo.",
        oferta: false,
        novedad: false,
        destacado: false,
        activo: true
    },
    {
        id: "demo-juguetes-1",
        nombre: "Juego recreativo (ejemplo)",
        categoria: "juguetes",
        precio: 0,
        precioAnterior: 0,
        disponible: "Por confirmar",
        imagen: "",
        descripcion: "Producto de ejemplo.",
        oferta: false,
        novedad: false,
        destacado: false,
        activo: true
    },
    {
        id: "demo-belleza-1",
        nombre: "Accesorio de belleza (ejemplo)",
        categoria: "belleza",
        precio: 0,
        precioAnterior: 0,
        disponible: "Por confirmar",
        imagen: "",
        descripcion: "Producto de ejemplo.",
        oferta: false,
        novedad: false,
        destacado: false,
        activo: true
    }
];

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

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
    localStorage.setItem("skenzi_carrito", JSON.stringify(productos));
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

    document.querySelectorAll("[data-contador-carrito]").forEach(elemento => {
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
        return `<p class="precio-anterior">${FORMATO_COP.format(anterior)}</p>`;
    }

    return "";
}

function obtenerDescuento(producto) {
    const anterior = Number(producto.precioAnterior);
    const actual = Number(producto.precio);

    if (anterior > actual && actual > 0) {
        const porcentaje = Math.round((1 - actual / anterior) * 100);

        return `
            <span class="descuento-oferta">
                ${porcentaje}% OFF
            </span>
        `;
    }

    return "";
}


/* 3. TARJETAS DE PRODUCTOS */

function tarjetaProducto(producto) {
    const precio = productoTienePrecio(producto)
        ? FORMATO_COP.format(producto.precio)
        : "Precio por confirmar";

    const oferta = producto.oferta
        ? '<span class="etiqueta-oferta">OFERTA</span>'
        : "";

    const boton = productoTienePrecio(producto)
        ? `
            <button type="button" data-agregar="${escapar(producto.id)}">
                Agregar al carrito
            </button>
        `
        : `
            <button type="button" data-consultar="${escapar(producto.id)}">
                Consultar producto
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


/* 4. GALERÍA DE OFERTAS */

function mostrarOfertaDelDia() {
    const contenedor = document.getElementById("producto-oferta-dia");

    if (!contenedor) return;

    const ofertas = PRODUCTOS.filter(producto =>
        producto.activo &&
        producto.oferta &&
        productoTienePrecio(producto)
    );

    const destacado = ofertas.find(producto => producto.destacado) || ofertas[0];

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

                <div class="acciones-producto">
                    <button
                        type="button"
                        data-agregar="${escapar(destacado.id)}"
                    >
                        Agregar al carrito
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


/* 5. MENÚ DE CATEGORÍAS */

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


/* 6. BÚSQUEDA */

function configurarBusqueda() {
    const formulario = document.querySelector("[data-busqueda]");

    if (!formulario) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();

        const entrada = formulario.querySelector("input");
        const consulta = (entrada?.value || "").trim().toLowerCase();

        if (!consulta) {
            mostrarMensaje("Escribe el nombre del producto que deseas buscar.");
            return;
        }

        const resultados = PRODUCTOS.filter(producto =>
            producto.activo &&
            `${producto.nombre} ${producto.descripcion} ${producto.categoria}`
                .toLowerCase()
                .includes(consulta)
        );

        const destino = document.querySelector("[data-listado-productos]")
            ? "galeria-productos"
            : "productos";

        mostrarProductos(resultados, destino);

        const catalogo = document.getElementById("catalogo") ||
            document.getElementById(destino);

        catalogo?.scrollIntoView({ behavior: "smooth" });

        if (!resultados.length) {
            mostrarMensaje("No encontramos productos con ese nombre.");
        }
    });
}


/* 7. CARRITO */

function agregarAlCarrito(id) {
    const producto = PRODUCTOS.find(item => item.id === id);

    if (!producto || !producto.activo) {
        mostrarMensaje("Este producto ya no está disponible.");
        return;
    }

    if (!productoTienePrecio(producto)) {
        mostrarMensaje("Consulta el precio y la disponibilidad antes de comprar.");
        return;
    }

    const carrito = leerCarrito();
    const existente = carrito.find(item => item.id === id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarMensaje("Producto agregado al carrito.");
}

function configurarCarrito() {
    const contenedor = document.getElementById("lista-carrito");

    if (!contenedor) return;

    function pintarCarrito() {
        const carrito = leerCarrito();

        if (!carrito.length) {
            contenedor.innerHTML = `
                <div class="vacio">
                    Tu carrito está vacío.
                    Explora nuestras categorías para encontrar productos.
                </div>
            `;
        } else {
            contenedor.innerHTML = carrito.map(item => `
                <div class="fila-carrito">
                    <strong>${escapar(item.nombre)}</strong>

                    <span>
                        ${FORMATO_COP.format(item.precio * item.cantidad)}
                    </span>

                    <div>
                        <button type="button" data-restar="${escapar(item.id)}">
                            −
                        </button>

                        ${item.cantidad}

                        <button type="button" data-sumar="${escapar(item.id)}">
                            +
                        </button>

                        <button type="button" data-quitar="${escapar(item.id)}">
                            Quitar
                        </button>
                    </div>
                </div>
            `).join("");
        }

        const total = carrito.reduce(
            (suma, item) => suma + item.precio * item.cantidad,
            0
        );

        const elementoTotal = document.getElementById("total-carrito");

        if (elementoTotal) {
            elementoTotal.textContent = FORMATO_COP.format(total);
        }

        actualizarContadorCarrito();
    }

    contenedor.addEventListener("click", evento => {
        const boton = evento.target.closest("button");

        if (!boton) return;

        let carrito = leerCarrito();

        if (boton.dataset.sumar) {
            const item = carrito.find(
                producto => producto.id === boton.dataset.sumar
            );

            if (item) item.cantidad++;
        }

        if (boton.dataset.restar) {
            const item = carrito.find(
                producto => producto.id === boton.dataset.restar
            );

            if (item) item.cantidad--;

            carrito = carrito.filter(item => item.cantidad > 0);
        }

        if (boton.dataset.quitar) {
            carrito = carrito.filter(
                item => item.id !== boton.dataset.quitar
            );
        }

        guardarCarrito(carrito);
        pintarCarrito();
    });

    document.getElementById("vaciar-carrito")?.addEventListener("click", () => {
        guardarCarrito([]);
        pintarCarrito();
    });

    document.getElementById("pedido-whatsapp")?.addEventListener("click", () => {
        const carrito = leerCarrito();

        if (!carrito.length) {
            mostrarMensaje("Agrega productos antes de preparar el pedido.");
            return;
        }

        const valor = id =>
            document.getElementById(id)?.value.trim() || "";

        const nombre = valor("cliente-nombre");
        const telefono = valor("cliente-telefono");
        const ciudad = valor("cliente-ciudad");
        const direccion = valor("cliente-direccion");

        if (!nombre || !telefono || !ciudad || !direccion) {
            mostrarMensaje("Completa nombre, teléfono, ciudad y dirección.");
            return;
        }

        if (!NUMERO_WHATSAPP) {
            mostrarMensaje(
                "Falta configurar el número comercial en js/tienda.js."
            );
            return;
        }

        const productos = carrito.map(item =>
            `• ${item.nombre} x${item.cantidad} — ${
                FORMATO_COP.format(item.precio * item.cantidad)
            }`
        ).join("\n");

        const total = carrito.reduce(
            (suma, item) => suma + item.precio * item.cantidad,
            0
        );

        const mensaje = [
            "Hola, quiero confirmar disponibilidad y hacer un pedido en Skenzi Home.",
            `Nombre: ${nombre}`,
            `Teléfono: ${telefono}`,
            `Ciudad: ${ciudad}`,
            `Dirección: ${direccion}`,
            "Productos:",
            productos,
            `Subtotal: ${FORMATO_COP.format(total)}`,
            "Envío: por confirmar.",
            "Pago: sujeto a confirmación."
        ].join("\n");

        window.open(
            `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`,
            "_blank",
            "noopener"
        );
    });

    pintarCarrito();
}


/* 8. EVENTOS GENERALES */

document.addEventListener("click", evento => {
    const botonAgregar = evento.target.closest("[data-agregar]");

    if (botonAgregar) {
        agregarAlCarrito(botonAgregar.dataset.agregar);
        return;
    }

    const botonConsultar = evento.target.closest("[data-consultar]");

    if (botonConsultar) {
        const producto = PRODUCTOS.find(
            item => item.id === botonConsultar.dataset.consultar
        );

        if (producto) {
            mostrarMensaje(
                `Consulta el precio y la disponibilidad de: ${producto.nombre}.`
            );
        }
    }
});


/* 9. INICIO DE LA TIENDA */

document.addEventListener("DOMContentLoaded", () => {
    configurarMenu();
    configurarBusqueda();
    configurarCarrito();

    const categoriaActual = document.body.dataset.categoria;
    const paginaActual = document.body.dataset.pagina;

    if (categoriaActual) {
        mostrarProductos(
            PRODUCTOS.filter(producto =>
                producto.activo &&
                producto.categoria === categoriaActual
            )
        );
    } else if (paginaActual === "ofertas") {
        mostrarProductos(
            PRODUCTOS.filter(producto =>
                producto.activo && producto.oferta
            )
        );
    } else if (paginaActual === "novedades") {
        mostrarProductos(
            PRODUCTOS.filter(producto =>
                producto.activo && producto.novedad
            )
        );
    } else if (paginaActual === "catalogo") {
        const contenedorGeneral = document.querySelector(
            "[data-listado-productos]"
        );

        mostrarProductos(
            PRODUCTOS.filter(producto => producto.activo),
            contenedorGeneral ? contenedorGeneral.id : "productos"
        );
    }

    mostrarOfertaDelDia();
    mostrarCarruselOfertas();
    configurarFlechasOfertas();
    actualizarContadorCarrito();
});
