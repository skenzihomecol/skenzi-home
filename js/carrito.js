
"use strict";

const CLAVE_CARRITO = "skenzi_carrito";
const NUMERO_WHATSAPP = "573105001079";

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

let productosCarrito = [];

function leerCarrito() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "[]");
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

async function cargarCarrito() {
    const lista = document.getElementById("lista-carrito");
    if (!lista) return;

    const carrito = leerCarrito();

    if (!carrito.length) {
        productosCarrito = [];
        mostrarCarrito();
        return;
    }

    try {
        if (!window.skenziDB) {
            throw new Error("No hay conexión con la base de datos.");
        }

        const ids = carrito.map(item => item.id);

        const { data, error } = await window.skenziDB
            .from("productos")
            .select("id,nombre,precio,stock,imagen_url,activo,publicado,tipo_inventario")
            .in("id", ids);

        if (error) throw error;

        productosCarrito = data || [];
        mostrarCarrito();

    } catch (error) {
        console.error("Error al cargar el carrito:", error);
        lista.innerHTML = `
            <p class="carrito-vacio">
                No pudimos cargar tus productos. Intenta nuevamente.
            </p>
        `;
    }
}

function mostrarCarrito() {
    const lista = document.getElementById("lista-carrito");
    if (!lista) return;

    const carrito = leerCarrito();

    if (!carrito.length) {
        lista.innerHTML = `
            <div class="carrito-vacio">
                <h3>Tu carrito está vacío</h3>
                <p>Descubre nuestros productos y agrega tus favoritos.</p>
                <a href="index.html">Ir a la tienda</a>
            </div>
        `;
        actualizarResumen(0, 0);
        return;
    }

    let total = 0;
    let cantidadTotal = 0;

    lista.innerHTML = carrito.map(item => {
        const producto = productosCarrito.find(
            p => String(p.id) === String(item.id)
        );

        if (!producto) {
            return `
                <p class="carrito-vacio">
                    No encontramos uno de los productos. Puedes eliminarlo del carrito.
                    <button type="button" data-quitar="${escapar(item.id)}">
                        Eliminar
                    </button>
                </p>
            `;
        }

        const precio = Number(producto.precio) || 0;
        const cantidad = Number(item.cantidad) || 1;
        const subtotal = precio * cantidad;
        const imagen = producto.imagen_url
            ? `<img src="${escapar(producto.imagen_url)}" alt="${escapar(producto.nombre)}">`
            : `<div class="imagen-vacia">🛍️</div>`;

        total += subtotal;
        cantidadTotal += cantidad;

        const bajoPedido = producto.tipo_inventario === "Bajo pedido";

        return `
            <article class="item-carrito">
                ${imagen}

                <div class="detalle-carrito">
                    <h3>${escapar(producto.nombre)}</h3>
                    <p>Precio: ${FORMATO_COP.format(precio)}</p>

                    <p>
                        ${bajoPedido
                            ? "Disponible bajo pedido"
                            : `Existencias: ${Number(producto.stock) || 0}`}
                    </p>

                    <label>
                        Cantidad:
                        <input
                            class="cantidad-carrito"
                            type="number"
                            min="1"
                            value="${cantidad}"
                            data-cantidad="${escapar(item.id)}"
                        >
                    </label>

                    <p>
                        Subtotal:
                        <strong>${FORMATO_COP.format(subtotal)}</strong>
                    </p>

                    <button
                        class="boton-quitar"
                        type="button"
                        data-quitar="${escapar(item.id)}"
                    >
                        Eliminar producto
                    </button>
                </div>
            </article>
        `;
    }).join("");

    actualizarResumen(cantidadTotal, total);
}

function actualizarResumen(cantidad, total) {
    const cantidadElemento = document.getElementById("cantidad-productos");
    const subtotalElemento = document.getElementById("subtotal-carrito");
    const totalElemento = document.getElementById("total-carrito");

    if (cantidadElemento) cantidadElemento.textContent = cantidad;
    if (subtotalElemento) subtotalElemento.textContent = FORMATO_COP.format(total);
    if (totalElemento) totalElemento.textContent = FORMATO_COP.format(total);
}

function cambiarCantidad(id, cantidad) {
    const carrito = leerCarrito();
    const item = carrito.find(p => String(p.id) === String(id));
    const producto = productosCarrito.find(p => String(p.id) === String(id));

    if (!item || !producto) return;

    const nuevaCantidad = Math.floor(Number(cantidad));
    const bajoPedido = producto.tipo_inventario === "Bajo pedido";

    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 1) {
        alert("Ingresa una cantidad válida.");
        mostrarCarrito();
        return;
    }

    if (!bajoPedido && nuevaCantidad > Number(producto.stock)) {
        alert("La cantidad supera las existencias disponibles.");
        mostrarCarrito();
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarCarrito(carrito);
    mostrarCarrito();
}

function quitarProducto(id) {
    guardarCarrito(
        leerCarrito().filter(item => String(item.id) !== String(id))
    );
    mostrarCarrito();
}

function vaciarCarrito() {
    if (!leerCarrito().length) return;

    if (!confirm("¿Quieres eliminar todos los productos del carrito?")) {
        return;
    }

    guardarCarrito([]);
    productosCarrito = [];
    mostrarCarrito();
}

async function enviarPedido() {
    const carrito = leerCarrito();

    if (!carrito.length) {
        alert("Tu carrito está vacío.");
        return;
    }

    const cliente = {
        nombre: document.getElementById("nombre-cliente").value.trim(),
        celular: document.getElementById("celular-cliente").value.trim(),
        ciudad: document.getElementById("ciudad-cliente").value.trim(),
        barrio: document.getElementById("barrio-cliente").value.trim(),
        direccion: document.getElementById("direccion-cliente").value.trim(),
        indicaciones: document.getElementById("indicaciones-cliente").value.trim()
    };

    const metodoPago = document.getElementById("metodo-pago").value;

    if (!cliente.nombre || !cliente.celular || !cliente.ciudad ||
        !cliente.direccion || !metodoPago) {
        alert("Completa todos los campos obligatorios.");
        return;
    }

    if (!productosCarrito.length) {
        alert("Espera a que carguen los productos del carrito.");
        return;
    }

    const items = [];

    for (const item of carrito) {
        const producto = productosCarrito.find(
            p => String(p.id) === String(item.id)
        );

        if (!producto || !producto.activo || !producto.publicado) {
            alert("Uno de los productos ya no está disponible.");
            return;
        }

        const cantidad = Math.floor(Number(item.cantidad));
        const bajoPedido = producto.tipo_inventario === "Bajo pedido";

        if (!Number.isInteger(cantidad) || cantidad < 1) {
            alert("Revisa las cantidades de los productos.");
            return;
        }

        if (!bajoPedido && cantidad > Number(producto.stock)) {
            alert(`No hay suficientes existencias de ${producto.nombre}.`);
            return;
        }

        items.push({
            id: producto.id,
            cantidad
        });
    }

    const boton = document.getElementById("pedido-whatsapp");
    boton.disabled = true;
    boton.textContent = "REGISTRANDO PEDIDO...";

    try {
        const { data, error } = await window.skenziDB.rpc(
            "crear_pedido_tienda",
            {
                p_cliente: cliente,
                p_items: items,
                p_metodo_pago: metodoPago,
                p_domicilio: 0,
                p_observaciones: cliente.indicaciones || null
            }
        );

        if (error) throw error;

        const pedido = Array.isArray(data) ? data[0] : data;

        if (!pedido || !pedido.numero) {
            throw new Error("No recibimos el número del pedido.");
        }

        const lineas = items.map(item => {
            const producto = productosCarrito.find(
                p => String(p.id) === String(item.id)
            );

            return `- ${producto.nombre} x ${item.cantidad}`;
        });

        const mensaje = [
            "NUEVO PEDIDO - SKENZI HOME",
            "",
            `Pedido: #${pedido.numero}`,
            "Estado: PENDIENTE DE CONFIRMACIÓN",
            "",
            "DATOS DEL CLIENTE",
            `Nombre: ${cliente.nombre}`,
            `Celular: ${cliente.celular}`,
            `Ciudad: ${cliente.ciudad}`,
            `Barrio: ${cliente.barrio || "No indicado"}`,
            `Dirección: ${cliente.direccion}`,
            `Indicaciones: ${cliente.indicaciones || "Ninguna"}`,
            `Pago: ${metodoPago}`,
            "",
            "PRODUCTOS",
            ...lineas,
            "",
            `Subtotal: ${FORMATO_COP.format(Number(pedido.subtotal))}`,
            "Domicilio: Por confirmar",
            `Total productos: ${FORMATO_COP.format(Number(pedido.total))}`,
            "",
            "Por favor, confirmar disponibilidad y envío."
        ].join("\n");

        guardarCarrito([]);
        alert(
            `¡Pedido registrado! Tu número de pedido es ${pedido.numero}. Está pendiente de confirmación.`
        );

        window.location.href =
            `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

    } catch (error) {
        console.error("Error al registrar el pedido:", error);
        alert(
            "No pudimos registrar tu pedido. No se ha enviado a WhatsApp. " +
            "Detalle: " + (error.message || "Error desconocido")
        );
    } finally {
        boton.disabled = false;
        boton.textContent = "ENVIAR PEDIDO";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarCarrito();

    document.addEventListener("click", evento => {
        const quitar = evento.target.closest("[data-quitar]");
        if (quitar) quitarProducto(quitar.dataset.quitar);
    });

    document.addEventListener("change", evento => {
        const cantidad = evento.target.closest("[data-cantidad]");
        if (cantidad) {
            cambiarCantidad(cantidad.dataset.cantidad, cantidad.value);
        }
    });

    document.getElementById("vaciar-carrito")
        ?.addEventListener("click", vaciarCarrito);

    document.getElementById("pedido-whatsapp")
        ?.addEventListener("click", enviarPedido);
});
