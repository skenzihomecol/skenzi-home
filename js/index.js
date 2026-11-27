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

        if (
            !listaCategorias.contains(evento.target) &&
            !botonCategorias.contains(evento.target)
        ) {
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

// CONTADOR DEL CARRITO (ENCABEZADO + BOTÓN FLOTANTE)
function actualizarContadorCarrito() {

    const contador = document.getElementById("contador-carrito");
    const contadorFlotante = document.getElementById("contador-carrito-flotante");

    try {

        const carrito = JSON.parse(
            localStorage.getItem("skenzi_carrito") || "[]"
        );

        const cantidad = Array.isArray(carrito)
            ? carrito.reduce(
                (total, producto) => total + Number(producto.cantidad || 0),
                0
            )
            : 0;

        if (contador) contador.textContent = cantidad;
        if (contadorFlotante) contadorFlotante.textContent = cantidad;

    } catch (error) {

        console.error("Error al leer el carrito:", error);

        if (contador) contador.textContent = "0";
        if (contadorFlotante) contadorFlotante.textContent = "0";

    }

}

// INICIAR PÁGINA
document.addEventListener("DOMContentLoaded", () => {

    actualizarContadorCarrito();

    console.log("Skenzi Home: página principal iniciada.");

});

window.addEventListener("storage", actualizarContadorCarrito);

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

/* ==========================================
   CARRUSEL PUBLICITARIO SKENZI HOME
   ========================================== */

(function iniciarCarruselSkenzi() {

    const carrusel = document.getElementById("carrusel-skenzi");
    const pista = document.getElementById("carrusel-pista");
    const anterior = document.getElementById("banner-anterior");
    const siguiente = document.getElementById("banner-siguiente");
    const indicadores = document.getElementById("banner-indicadores");

    if (!carrusel || !pista || !anterior || !siguiente || !indicadores) {
        return;
    }

    const banners = Array.from(
        pista.querySelectorAll(".banner-publicitario")
    );

    if (!banners.length) return;

    let indiceActual = 0;
    let intervalo = null;

    // CREAR INDICADORES
    indicadores.innerHTML = banners.map((banner, indice) => `
        <button
            type="button"
            class="${indice === 0 ? "activo" : ""}"
            aria-label="Ir al anuncio ${indice + 1}"
            aria-current="${indice === 0 ? "true" : "false"}"
            data-indice="${indice}">
        </button>
    `).join("");

    const puntos = Array.from(
        indicadores.querySelectorAll("button")
    );

    // MOSTRAR BANNER
    function mostrarBanner(indice) {

        indiceActual = (indice + banners.length) % banners.length;

        pista.style.transform =
            `translateX(-${indiceActual * 100}%)`;

        puntos.forEach((punto, i) => {
            punto.classList.toggle("activo", i === indiceActual);
            punto.setAttribute(
                "aria-current",
                i === indiceActual ? "true" : "false"
            );
        });
    }

    // AVANZAR
    function avanzar() {
        mostrarBanner(indiceActual + 1);
    }

    // RETROCEDER
    function retroceder() {
        mostrarBanner(indiceActual - 1);
    }

    // BOTONES LATERALES
    siguiente.addEventListener("click", () => {
        avanzar();
        reiniciarIntervalo();
    });

    anterior.addEventListener("click", () => {
        retroceder();
        reiniciarIntervalo();
    });

    // INDICADORES
    puntos.forEach(punto => {
        punto.addEventListener("click", () => {
            mostrarBanner(Number(punto.dataset.indice));
            reiniciarIntervalo();
        });
    });

    // CAMBIO AUTOMÁTICO CADA 5 SEGUNDOS
    function iniciarIntervalo() {
        intervalo = setInterval(avanzar, 5000);
    }

    function detenerIntervalo() {
        clearInterval(intervalo);
    }

    function reiniciarIntervalo() {
        detenerIntervalo();
        iniciarIntervalo();
    }

    // PAUSAR AL PASAR EL CURSOR
    carrusel.addEventListener("mouseenter", detenerIntervalo);
    carrusel.addEventListener("mouseleave", iniciarIntervalo);

    // INICIAR
    mostrarBanner(0);
    iniciarIntervalo();

    console.log("Carrusel publicitario Skenzi Home iniciado.");

})();
