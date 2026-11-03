
/* ==========================================
   SKENZI HOME — JAVASCRIPT DE INICIO
   ========================================== */

"use strict";

// MENÚ DE CATEGORÍAS
const botonCategorias = document.getElementById("boton-categorias");
const listaCategorias = document.getElementById("lista-categorias");

if (botonCategorias && listaCategorias) {

    botonCategorias.addEventListener("click", (evento) => {
        evento.stopPropagation();

        const abierto = listaCategorias.classList.toggle("abierto");

        botonCategorias.setAttribute(
            "aria-expanded",
            String(abierto)
        );
    });

    document.addEventListener("click", (evento) => {

        if (!listaCategorias.contains(evento.target)) {
            listaCategorias.classList.remove("abierto");
            botonCategorias.setAttribute("aria-expanded", "false");
        }

    });

    document.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {
            listaCategorias.classList.remove("abierto");
            botonCategorias.setAttribute("aria-expanded", "false");
        }

    });

}

// BUSCADOR DE PRODUCTOS
const formularioBusqueda = document.getElementById("form-busqueda");

if (formularioBusqueda) {

    formularioBusqueda.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const entrada = document.getElementById("buscar-producto");

        const busqueda = entrada.value.trim();

        if (!busqueda) {
            entrada.focus();
            return;
        }

        // Cuando conectemos el catálogo,
        // enviaremos la búsqueda a sus productos.

        const parametros = new URLSearchParams({
            buscar: busqueda
        });

        window.location.href =
            "buscar.html?" + parametros.toString();

    });

}

// CONTADOR DEL CARRITO
function actualizarContadorCarrito() {

    const contador = document.getElementById("contador-carrito");

    if (!contador) return;

    try {

        const carrito = JSON.parse(
            localStorage.getItem("skenzi_carrito") || "[]"
        );

        const cantidad = carrito.reduce(
            (total, producto) => total + Number(producto.cantidad || 0),
            0
        );

        contador.textContent = cantidad;

    } catch (error) {

        console.error("Error al leer el carrito:", error);

        contador.textContent = "0";

    }

}

// INICIAR PÁGINA
document.addEventListener("DOMContentLoaded", () => {

    actualizarContadorCarrito();

    console.log("Skenzi Home: página principal iniciada.");

});

/* ==========================================
   AGREGAR PRODUCTOS AL CARRITO
   ========================================== */

function agregarAlCarrito(idProducto) {

    const producto = window.SK_PRODUCTOS?.find(
        p => String(p.id) === String(idProducto)
    );

    if (!producto) {
        alert("No encontramos este producto.");
        return;
    }

    if (producto.existencias <= 0 || producto.precio <= 0) {
        alert("Este producto no está disponible para compra.");
        return;
    }

    const carrito = JSON.parse(
        localStorage.getItem("skenzi_carrito") || "[]"
    );

    const existente = carrito.find(
        p => String(p.id) === String(idProducto)
    );

    if (existente) {

        if (existente.cantidad >= producto.existencias) {
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

    actualizarContadorCarrito();

    alert("¡Producto agregado a tu carrito!");
}
