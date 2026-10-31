"use strict";

/* =====================================================
   SKENZI HOME — SISTEMA PRINCIPAL DE LA TIENDA
   ===================================================== */

const NUMERO_WHATSAPP = "573137541978"; // Tu número comercial

const SUPABASE_URL = "https://xjqoforlmxmpykjynlsm.supabase.co";
const SUPABASE_KEY = "sb_publishable_ovZCy27ft6esmpYC2PSLSQ_AOpFH0Zv";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let PRODUCTOS = [];

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

const leerCarrito = () => {
    try {
        const datos = JSON.parse(localStorage.getItem("skenzi_carrito") || "[]");
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
};

const guardarCarrito = productos => {
    localStorage.setItem("skenzi_carrito", JSON.stringify(productos));
};

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
    const cantidad = leerCarrito().reduce((total, p) => total + p.cantidad, 0);
    document.querySelectorAll("[data-contador-carrito]").forEach(el => {
        el.textContent = cantidad;
    });
}

function productoTienePrecio(producto) {
    return Number.isFinite(Number(producto.precio)) && Number(producto.precio) > 0;
}

function obtenerImagen(producto) {
    if (producto.imagen) {
        return `<img src="${escapar(producto.imagen)}" alt="${escapar(producto.nombre)}" loading="lazy">`;
    }
    return `<span aria-hidden="true">🛍️</span>`;
}

function tarjetaProducto(producto) {
    const precio = productoTienePrecio(producto)
        ? FORMATO_COP.format(producto.precio)
        : "Precio por confirmar";

    const boton = productoTienePrecio(producto)
        ? `<button type="button" data-agregar="${escapar(producto.id)}">Agregar al carrito</button>`
        : `<button type="button" data-consultar="${escapar(producto.id)}">Consultar producto</button>`;

    return `
        <article class="tarjeta">
            <div class="producto-imagen">
                ${obtenerImagen(producto)}
            </div>
            <div class="producto-cuerpo">
                <h3>${escapar(producto.nombre)}</h3>
                <p class="precio">${precio}</p>
                <p class="estado">Disponibilidad: ${escapar(producto.disponible || "Por confirmar")}</p>
                <div class="acciones-producto">
                    ${boton}
                </div>
            </div>
        </article>
    `;
}

function mostrarProductos(lista, idContenedor = "galeria-productos") {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;

    if (!lista.length) {
        contenedor.innerHTML = `<div class="vacio">No hay productos publicados en esta sección.</div>`;
        return;
    }

    contenedor.innerHTML = lista.map(tarjetaProducto).join("");
}

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
}

function configurarBusqueda() {
    const formulario = document.querySelector("[data-busqueda]");
    if (!formulario) return;

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        const entrada = formulario.querySelector("input");
        const texto = (entrada?.value || "").trim().toLowerCase();

        const resultados = PRODUCTOS.filter(p => {
            if (!p.activo) return false;
            return p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto);
        });

        mostrarProductos(resultados, "galeria-productos");
        document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
    });
}

function agregarAlCarrito(idProducto) {
    const producto = PRODUCTOS.find(item => String(item.id) === String(idProducto));
    if (!producto) {
        mostrarMensaje("No encontramos este producto.");
        return;
    }

    const carrito = leerCarrito();
    const existente = carrito.find(item => String(item.id) === String(idProducto));

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ id: producto.id, cantidad: 1 });
    }

    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarMensaje("Producto agregado al carrito.");
}

function quitarDelCarrito(idProducto) {
    const carrito = leerCarrito().filter(item => String(item.id) !== String(idProducto));
    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarCarrito();
}

function cambiarCantidad(idProducto, cantidad) {
    const carrito = leerCarrito();
    const item = carrito.find(producto => String(producto.id) === String(idProducto));
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

    const carrito = leerCarrito();
    if (!carrito.length) {
        contenedor.innerHTML = `<div class="vacio"><p>Tu carrito está vacío.</p></div>`;
        if (totalElemento) totalElemento.textContent = FORMATO_COP.format(0);
        return;
    }

    let total = 0;
    contenedor.innerHTML = carrito.map(item => {
        const producto = PRODUCTOS.find(p => String(p.id) === String(item.id));
        if (!producto) return "";

        const subtotal = producto.precio * item.cantidad;
        total += subtotal;

        return `
            <article class="item-carrito" style="display:flex; gap:15px; margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:15px;">
                <div style="width:80px;">${obtenerImagen(producto)}</div>
                <div>
                    <h3>${escapar(producto.nombre)}</h3>
                    <p>Precio: ${FORMATO_COP.format(producto.precio)}</p>
                    <label>Cantidad: <input type="number" min="1" value="${item.cantidad}" data-cantidad="${escapar(item.id)}"></label>
                    <p>Subtotal: ${FORMATO_COP.format(subtotal)}</p>
                    <button type="button" data-quitar="${escapar(item.id)}">Quitar</button>
                </div>
            </article>
        `;
    }).join("");

    if (totalElemento) totalElemento.textContent = FORMATO_COP.format(total);
}

function enviarPedidoWhatsApp() {
    if (!NUMERO_WHATSAPP) {
        mostrarMensaje("Falta configurar el número de WhatsApp.");
        return;
    }

    const carrito = leerCarrito();
    if (!carrito.length) {
        mostrarMensaje("Tu carrito está vacío.");
        return;
    }

    let total = 0;
    const lineas = [];

    for (const item of carrito) {
        const producto = PRODUCTOS.find(p => String(p.id) === String(item.id));
        if (!producto) continue;

        const subtotal = producto.precio * item.cantidad;
        total += subtotal;
        lineas.push(`- ${producto.nombre} x ${item.cantidad}: ${FORMATO_COP.format(subtotal)}`);
    }

    const mensaje = encodeURIComponent(
        `Hola, Skenzi Home. Quiero realizar el siguiente pedido:\n\n${lineas.join("\n")}\n\nTotal productos: ${FORMATO_COP.format(total)}\n\nPor favor confirmen disponibilidad y costo de envío.`
    );

    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`, "_blank");
}

document.addEventListener("click", evento => {
    const btnAgregar = evento.target.closest("[data-agregar]");
    if (btnAgregar) agregarAlCarrito(btnAgregar.dataset.agregar);

    const btnQuitar = evento.target.closest("[data-quitar]");
    if (btnQuitar) quitarDelCarrito(btnQuitar.dataset.quitar);
});

document.addEventListener("change", evento => {
    const inputCant = evento.target.closest("[data-cantidad]");
    if (inputCant) cambiarCantidad(inputCant.dataset.cantidad, inputCant.value);
});

document.addEventListener("DOMContentLoaded", async () => {
    configurarMenu();
    configurarBusqueda();
    
    const btnPedido = document.getElementById("pedido-whatsapp");
    if (btnPedido) btnPedido.addEventListener("click", enviarPedidoWhatsApp);

    try {
        const { data: productosSupabase, error } = await supabaseClient
            .from("productos")
            .select("id, nombre, descripcion, precio_venta, existencias, imagen_url, activo, categoria_id")
            .eq("activo", true);

        if (!error && productosSupabase) {
            PRODUCTOS = productosSupabase.map(p => ({
                id: p.id,
                nombre: p.nombre,
                descripcion: p.descripcion || "",
                precio: Number(p.precio_venta) || 0,
                disponible: Number(p.existencias) > 0 ? "Disponible" : "Agotado",
                imagen: p.imagen_url || "",
                categoriaId: p.categoria_id,
                activo: p.activo
            }));
        }
    } catch (err) {
        console.error("Error al conectar con Supabase:", err);
    }

   const urlParams = new URLSearchParams(window.location.search);
    const catFiltro = urlParams.get("categoria");

    if (catFiltro) {
        // Filtro por categoría seleccionada
        const filtrados = PRODUCTOS.filter(p => String(p.categoriaId) === String(catFiltro));
        mostrarProductos(filtrados, "galeria-productos");
    } else {
        mostrarProductos(PRODUCTOS, "galeria-productos");
    }

    actualizarContadorCarrito();
    if (document.getElementById("lista-carrito")) mostrarCarrito();
});
