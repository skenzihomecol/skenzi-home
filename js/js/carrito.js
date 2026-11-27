/* ==========================================
   SKENZI HOME — CARRITO DE COMPRAS
   ========================================== */

"use strict";

const CLAVE_CARRITO = "skenzi_carrito";
const NUMERO_WHATSAPP = "573137541978";

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// Tarifas internas por barrio (no visibles en el selector)
const TARIFAS_BARRIOS_CALI = {
    "20 de Julio": 8000,
    "2 Vipasa": 12000,
    "Acueducto San Antonio": 8000,
    "Agua Blanca": 8000,
    "Alameda": 8000,
    "Álamos Popular": 8000,
    "Alfaguara": 15000,
    "Alférez Real": 8000,
    "Alfonso Barberena": 8000,
    "Alfonso Bonilla Aragón": 10000,
    "Alfonzo López 1.ª Etapa": 8000,
    "Alfonzo López 2.ª Etapa": 8000,
    "Alfonzo López 3.ª Etapa": 8000,
    "Alirio Mora Beltrán": 10000,
    "Alto Aguacatal": 12000,
    "Alto Nápoles": 12000,
    "Altos de Menga": 8000,
    "Altos de Normandía - Bataclán": 8000,
    "Altos de Santa Isabel": 8000,
    "Andrés Sanín": 8000,
    "Antonio Nariño": 10000,
    "Aranjuez": 8000,
    "Arboledas": 8000,
    "Área Libre - Parque del Amor": 8000,
    "Arroyohondo": 8000,
    "Asturias": 8000,
    "Atanasio Girardot": 8000,
    "Bajo Aguacatal": 12000,
    "Bajo Palermo": 12000,
    "Bajo Salomia": 8000,
    "Bajos de Ciudad Córdoba (Llano Verde)": 10000,
    "Barrio Residencial el Bosque": 8000,
    "Base Aérea": 8000,
    "Belalcázar": 8000,
    "Belén": 10000,
    "Belisario Caicedo": 8000,
    "Bellavista": 10000,
    "Bello Horizonte": 8000,
    "Benjamín Herrera": 8000,
    "Bochalema": 12000,
    "Bolivariano": 8000,
    "Bosques del Limonar": 8000,
    "Bretaña": 8000,
    "Brisas de los Álamos": 8000,
    "Brisas de los Andes": 8000,
    "Brisas de Mayo": 10000,
    "Brisas del Guabito": 8000,
    "Brisas del Limonar": 10000,
    "Bueno Madrid": 8000,
    "Buenos Aires": 8000,
    "Caldas": 8000,
    "Calima": 8000,
    "Calimio": 8000,
    "Calimio Desepaz": 12000,
    "Calipso": 10000,
    "Cambulos": 8000,
    "Camino Real Los Fundadores": 8000,
    "Caney": 10000,
    "Cañaveralejo": 8000,
    "Cañaverales": 8000,
    "Cementerio Carabineros": 8000,
    "Centenario": 8000,
    "Champagnat": 8000,
    "Chapinero": 8000,
    "Charco Azul": 10000,
    "Chiminangos 1.ª Etapa": 8000,
    "Chiminangos 2.ª Etapa": 8000,
    "Chipichape": 8000,
    "Chorros alto (después de calle 2da oeste)": 12000,
    "Ciudad 2000": 10000,
    "Ciudad Campestre": 8000,
    "Ciudad Capri": 8000,
    "Ciudad Córdoba": 10000,
    "Ciudad del Campo": 12000,
    "Ciudad Jardín": 8000,
    "Ciudad Jardín y Pance": 10000,
    "Ciudad los Álamos": 8000,
    "Ciudad Modelo": 8000,
    "Ciudad Pacífica": 12000,
    "Ciudad Talanga": 12000,
    "Ciudad Universitaria": 8000,
    "Ciudadela Comfandi": 8000,
    "Ciudadela del Río - CVC": 12000,
    "Ciudadela Paso ancho": 8000,
    "Club Campestre": 8000,
    "Colinas del Sur": 8000,
    "Colseguros Andes": 8000,
    "Compartir": 12000,
    "Comuneros I": 10000,
    "Condominio Miramontes": 10000,
    "Cortijo": 8000,
    "Cristales": 8000,
    "Cristóbal Colón": 8000,
    "Cuarto de Legua": 8000,
    "Cuarteles de Nápoles": 8000,
    "Dapa (parte baja)": 10000,
    "Departamental": 8000,
    "Desepaz Invicali": 12000,
    "Doce de Octubre": 8000,
    "Eduardo Santos": 8000,
    "El Bosque": 8000,
    "El Calvario": 8000,
    "El Cedro": 8000,
    "El Diamante": 10000,
    "El Dorado": 8000,
    "El Gran Limonar - Cataya": 8000,
    "El Hoyo": 8000,
    "El Ingenio": 8000,
    "El Jardín": 8000,
    "El Jordán alto": 12000,
    "El Jordán bajo": 8000,
    "El Lido": 8000,
    "El Limonar": 10000,
    "El Mortiñal": 10000,
    "El Nacional": 8000,
    "El Paraíso": 8000,
    "El Peñón": 8000,
    "El Piloto": 8000,
    "El Poblado I": 10000,
    "El Poblado II": 10000,
    "El Pondaje": 10000,
    "El Prado": 8000,
    "El Recuerdo": 8000,
    "El Retén": 12000,
    "El Retiro": 10000,
    "El Sena": 8000,
    "El Trébol": 8000,
    "El Troncal": 8000,
    "El Vergel": 10000,
    "El Vivero": 8000,
    "Eucarístico": 8000,
    "Evaristo García": 8000,
    "Farallones": 8000,
    "Fátima": 8000,
    "Fenalco Kennedy": 8000,
    "Fepicol": 8000,
    "Flora Industrial": 8000,
    "Floralia I": 8000,
    "Floralia IA": 8000,
    "Floralia I Sector II": 8000,
    "Floralia II": 8000,
    "Floralia III": 8000,
    "Fonaviemcali": 8000,
    "Francisco Eladio Ramírez": 8000,
    "Galindo": 8000,
    "Granada": 8000,
    "Guabal": 8000,
    "Guadalupe": 8000,
    "Guayaquil": 8000,
    "Guillermo Valencia": 8000,
    "Haciendas de Alferez": 10000,
    "Horizontes": 8000,
    "Ignacio Rengifo": 8000,
    "Industrial": 8000,
    "Industria de Licores": 8000,
    "Jamundí": 15000,
    "Jardín de Pance": 10000,
    "Jockey Club": 10000,
    "Jorge Eliécer Gaitán": 8000,
    "Jorge Holguín Garcés": 8000,
    "Jorge Isaacs": 8000,
    "Jorge María Córdoba": 8000,
    "Jorge Zawadsky": 8000,
    "José Manuel Marroquín 1": 10000,
    "José Manuel Marroquín 2": 10000,
    "Juanambú": 8000,
    "Juanchito": 12000,
    "Julio Rincón": 8000,
    "Junín": 8000,
    "La Alborada": 10000,
    "La Alianza": 8000,
    "La Barraquera": 12000,
    "La Base": 8000,
    "La Campiña": 8000,
    "La Cascada": 8000,
    "La Esmeralda": 8000,
    "La Esperanza": 8000,
    "La Estatua": 12000,
    "La Flora": 8000,
    "La Floresta": 8000,
    "La Fortaleza": 8000,
    "La Fortuna": 12000,
    "La Gracia": 12000,
    "La Hacienda": 8000,
    "La Independencia": 8000,
    "La Isla": 8000,
    "La Legua": 12000,
    "La Libertad": 8000,
    "La Merced": 8000,
    "La Nueva Base": 8000,
    "La Patria Cañaveral": 8000,
    "La Paz": 8000,
    "La Playa": 8000,
    "La Playita": 12000,
    "La Primavera": 8000,
    "La Rivera I": 8000,
    "La Rivera II": 8000,
    "La Selva": 8000,
    "La Sultana": 12000,
    "Las Acacias": 8000,
    "Las Américas": 8000,
    "Las Ceibas": 8000,
    "Las Dalias": 12000,
    "Las Delicias": 8000,
    "Las Fresas": 12000,
    "Las Garzas": 12000,
    "Las Granjas": 8000,
    "Las Malvinas": 12000,
    "Las Orquídeas": 10000,
    "Las Quintas de don Simón": 8000,
    "Las Vegas": 8000,
    "Las Veraneras": 8000,
    "Laureano Gómez": 10000,
    "León XIII": 8000,
    "Lili": 10000,
    "Lleras-Cinta larga": 10000,
    "Lleras Camargo": 10000,
    "Lleras Restrepo": 10000,
    "Los Alcázares I": 8000,
    "Los Alcázares II": 8000,
    "Los Andes": 8000,
    "Los Chorros hasta el hospital": 8000,
    "Los Comuneros II": 10000,
    "Los Conquistadores": 8000,
    "Los Guadales": 8000,
    "Los Guayacanes": 8000,
    "Los Lagos I": 10000,
    "Los Lagos II": 10000,
    "Los Libertadores": 8000,
    "Los Líderes": 12000,
    "Los Lotes": 12000,
    "Los Naranjos": 15000,
    "Los Pinos": 8000,
    "Los Portales": 8000,
    "Los Robles": 10000,
    "Los Samanes": 8000,
    "Los Sauces": 8000,
    "Lourdes": 8000,
    "Manuel María Buenaventura": 8000,
    "Manuela Beltrán": 10000,
    "Manzanares": 8000,
    "Maracaibo": 8000,
    "Marco Fidel Suárez": 8000,
    "Mariano Ramos": 10000,
    "Mario Correa Rengifo": 8000,
    "Marroquín III": 10000,
    "Más allá de Alfaguara": 20000,
    "Mata de Guadua": 12000,
    "Mayapan": 8000,
    "Meléndez alto": 12000,
    "Meléndez bajo": 8000,
    "Menga alto": 12000,
    "Menga bajo": 8000,
    "Metropolitano del Norte": 8000,
    "Miraflores": 8000,
    "Mojica": 10000,
    "Municipal": 8000,
    "Nápoles alto": 10000,
    "Nápoles bajo": 8000,
    "Naranjos 1": 10000,
    "Naranjos 2": 10000,
    "Navarro-La Chanca": 8000,
    "Normandia alto": 12000,
    "Normandia bajo": 8000,
    "Nueva Floresta": 8000,
    "Nuevo Horizonte": 10000,
    "Nuevo Rey": 8000,
    "Nuevo Tequendama": 8000,
    "Oasis de Comfandi": 8000,
    "Obrero": 8000,
    "Olaya Herrera": 8000,
    "Olímpico": 8000,
    "Omar Torrijos": 10000,
    "Pacará": 8000,
    "Palmeras del norte": 8000,
    "Palmas I": 12000,
    "Palmas II": 12000,
    "Pampa Linda": 8000,
    "Panamericano": 8000,
    "Parcelaciones Pance": 8000,
    "Pasamacho": 8000,
    "Paseo de los Almendros": 8000,
    "Paso del Comercio": 8000,
    "Patio Bonito": 12000,
    "Petecuy I etapa": 8000,
    "Petecuy II etapa": 8000,
    "Petecuy III etapa": 8000,
    "Pizamos 1": 12000,
    "Pizamos 2": 12000,
    "Pizamos 3": 12000,
    "Plantan de Tratamiento Puerto Mallarino": 12000,
    "Plaza de Toros": 8000,
    "Plazas Verdes": 8000,
    "Poblado Campestre": 15000,
    "Popular": 8000,
    "Porvenir": 8000,
    "Potrero Grande": 12000,
    "Prados de Oriente": 8000,
    "Prados del Limonar": 8000,
    "Prados del Norte": 8000,
    "Prados del Sur": 8000,
    "Primitivo Crespo": 8000,
    "Primero de Mayo": 8000,
    "Promociones Populares": 10000,
    "Pueblo Joven": 10000,
    "Puente Azul": 12000,
    "Puertas del Sol": 10000,
    "Puerto Mallarino": 8000,
    "Puerto Nuevo": 8000,
    "Rafael Uribe Uribe": 8000,
    "Reamanso de Ciudad Jardín": 10000,
    "Refugio": 8000,
    "Remanso": 12000,
    "República de Israel": 10000,
    "Ricardo Balcázar": 10000,
    "Rodeo": 8000,
    "Rodrigo Lara Bonilla": 10000,
    "Saavedra Galindo": 8000,
    "Salomia": 8000,
    "San Antonio": 8000,
    "San Benito": 8000,
    "San Carlos": 8000,
    "San Cayetano": 8000,
    "San Cristóbal": 8000,
    "San Fernando Nuevo": 8000,
    "San Fernando Viejo": 8000,
    "San Judas Tadeo 1": 8000,
    "San Judas Tadeo 2": 8000,
    "San Juan Bosco": 8000,
    "San Luís I": 8000,
    "San Luís II": 8000,
    "San Marino": 8000,
    "San Nicolás": 8000,
    "San Pascual": 8000,
    "San Pedro": 8000,
    "San Pedro Claver": 8000,
    "San Vicente": 8000,
    "Santa Anita": 8000,
    "Santa Bárbara": 8000,
    "Santa Clara": 12000,
    "Santa Elena": 8000,
    "Santa Fe": 8000,
    "Santa Isabel": 8000,
    "Santa Mónica": 8000,
    "Santa Mónica Belalcázar": 8000,
    "Santa Mónica Popular": 8000,
    "Santa Rita": 8000,
    "Santa Rosa": 8000,
    "Santa Teresita": 8000,
    "Santander": 8000,
    "Sector Alto Jordán": 12000,
    "Sector Asprosocial - Diamante": 10000,
    "Sector Bosque Municipal": 8000,
    "Sector Cañaveralejo Guadalupe": 8000,
    "Sector La Luna": 8000,
    "Sector La Patria Cañaveral": 8000,
    "Sector Laguna del Pondaje": 10000,
    "Siete de Agosto": 8000,
    "Siloé": 10000,
    "Simón Bolívar": 8000,
    "Sindical": 8000,
    "Sucre": 8000,
    "Sultana-Berlín-San Francisco": 8000,
    "Tejares": 8000,
    "Terranova": 15000,
    "Terrón Colorado I": 12000,
    "Terrón Colorado II": 12000,
    "Tierra Blanca": 10000,
    "Torres de Comfandi": 8000,
    "Tres de Julio": 8000,
    "Ulpiano Lloreda": 10000,
    "Unicentro": 8000,
    "Unidad Deportiva A": 8000,
    "Unidad Panamericana": 8000,
    "Unidad Residencial El Coliseo": 8000,
    "Unidad Residencial Santiago de Cali": 8000,
    "Unión de Vivienda Popular": 10000,
    "Urb. Aguacatal": 12000,
    "Urb. Barranquilla": 8000,
    "Urb. Boyacá": 8000,
    "Urb. Cañaveralejo": 8000,
    "Urb. Ciudad Jardín": 8000,
    "Urb. Colseguros": 8000,
    "Urb. Cortijo": 8000,
    "Urb. La Base": 8000,
    "Urb. La Flora": 8000,
    "Urb. La Merced": 8000,
    "Urb. Militar": 8000,
    "Urb. Nueva Granada": 8000,
    "Urb. Río Lili": 8000,
    "Urb. San Joaquín": 8000,
    "Urb. Tequendama": 8000,
    "Urb. Venezuela": 8000,
    "Vallado": 10000,
    "Valle del Lili": 8000,
    "Valle Grande": 12000,
    "Venezuela": 8000,
    "Verdanza": 10000,
    "Versalles": 8000,
    "Villa Blanca": 10000,
    "Villa del Lago": 10000,
    "Villa del Mar": 12000,
    "Villa del Prado": 8000,
    "Villa del Sol": 8000,
    "Villa del Sur": 8000,
    "Villa Luz": 12000,
    "Villa Mercedes I": 12000,
    "Villa Nueva": 8000,
    "Villacolombia": 8000,
    "Villas de Veracruz": 8000,
    "Vipasa": 8000,
    "Vista Hermosa": 12000,
    "Yira Castro": 10000,
    "Otro barrio de Cali": 10000
};

let productosCarrito = [];
let subtotalActualCarrito = 0;
let cantidadActualCarrito = 0;

// LEER CARRITO
function leerCarrito() {
    try {
        const datos = JSON.parse(
            localStorage.getItem(CLAVE_CARRITO) || "[]"
        );
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

// GUARDAR CARRITO
function guardarCarrito(carrito) {
    localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(carrito)
    );
}

// ESCAPAR TEXTO
function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// OBTENER BARRIO Y TARIFA INTERNA
function obtenerDatosEnvio() {
    const selectBarrio = document.getElementById("barrio-select");
    const inputBarrio = document.getElementById("barrio-cliente");
    const contenedorManual = document.getElementById("contenedor-barrio-manual");

    if (!selectBarrio) {
        return {
            barrio: inputBarrio ? inputBarrio.value.trim() : "",
            costoEnvio: 0,
            requiereSeleccion: false,
            seleccionado: true
        };
    }

    const valorSelect = (selectBarrio.value || "").trim();

    if (contenedorManual) {
        contenedorManual.style.display = valorSelect === "Otro barrio de Cali" ? "flex" : "none";
    }

    let barrioFinal = valorSelect;
    if (valorSelect === "Otro barrio de Cali" && inputBarrio) {
        barrioFinal = inputBarrio.value.trim() || "Otro barrio de Cali";
    } else if (inputBarrio && valorSelect) {
        inputBarrio.value = valorSelect;
    }

    const tarifaMapa = Object.prototype.hasOwnProperty.call(TARIFAS_BARRIOS_CALI, valorSelect)
        ? Number(TARIFAS_BARRIOS_CALI[valorSelect])
        : 0;

    const opcionActiva = selectBarrio.selectedOptions?.[0] || selectBarrio.options?.[selectBarrio.selectedIndex];
    const tarifaAtributo = Number(opcionActiva?.dataset?.envio ?? opcionActiva?.getAttribute?.("data-envio") ?? 0);

    const costoEnvio = tarifaMapa > 0 ? tarifaMapa : (Number.isFinite(tarifaAtributo) ? tarifaAtributo : 0);

    return {
        barrio: barrioFinal,
        costoEnvio,
        requiereSeleccion: true,
        seleccionado: Boolean(valorSelect)
    };
}

// REFRESCAR SOLO ENVÍO Y TOTAL A PAGAR
function refrescarTotalesEnPantalla() {
    const cantidadElemento = document.getElementById("cantidad-productos");
    const subtotalElemento = document.getElementById("subtotal-carrito");
    const envioElemento = document.getElementById("envio-carrito");
    const totalElemento = document.getElementById("total-carrito");

    const { costoEnvio } = obtenerDatosEnvio();
    const envioAplicado = cantidadActualCarrito > 0 ? costoEnvio : 0;
    const totalFinal = subtotalActualCarrito + envioAplicado;

    if (cantidadElemento) {
        cantidadElemento.textContent = cantidadActualCarrito;
    }

    if (subtotalElemento) {
        subtotalElemento.textContent = FORMATO_COP.format(subtotalActualCarrito);
    }

    if (envioElemento) {
        envioElemento.textContent = FORMATO_COP.format(envioAplicado);
    }

    if (totalElemento) {
        totalElemento.textContent = FORMATO_COP.format(totalFinal);
    }
}

// CARGAR PRODUCTOS DESDE SUPABASE
async function cargarCarrito() {
    const lista = document.getElementById("lista-carrito");
    if (!lista) return;

    const carrito = leerCarrito();

    if (!carrito.length) {
        mostrarCarrito();
        return;
    }

    try {
        if (!window.skenziDB) {
            throw new Error("No hay conexión con Supabase.");
        }

        const ids = carrito.map(item => item.id);

        const { data, error } = await window.skenziDB
            .from("productos")
            .select(`
                id,
                nombre,
                precio_venta,
                existencias,
                imagen_url,
                activo
            `)
            .in("id", ids);

        if (error) throw error;

        productosCarrito = data || [];
        mostrarCarrito();
    } catch (error) {
        console.error("Error al cargar el carrito:", error);
        lista.innerHTML = `
            <p class="carrito-vacio">
                No pudimos cargar tus productos.
                Intenta nuevamente.
            </p>
        `;
    }
}

// MOSTRAR PRODUCTOS
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

    let subtotalProductos = 0;
    let cantidadTotal = 0;

    lista.innerHTML = carrito.map(item => {
        const producto = productosCarrito.find(
            p => String(p.id) === String(item.id)
        );

        if (!producto) return "";

        const precio = Number(producto.precio_venta) || 0;
        const cantidad = Number(item.cantidad) || 1;
        const subtotal = precio * cantidad;

        subtotalProductos += subtotal;
        cantidadTotal += cantidad;

        const imagen = producto.imagen_url
            ? `<img src="${escapar(producto.imagen_url)}"
                alt="${escapar(producto.nombre)}">`
            : `<div class="imagen-vacia">🛍️</div>`;

        return `
            <article class="item-carrito">
                ${imagen}
                <div class="detalle-carrito">
                    <h3>${escapar(producto.nombre)}</h3>
                    <p>Precio: ${FORMATO_COP.format(precio)}</p>
                    <label>
                        Cantidad:
                        <input
                            class="cantidad-carrito"
                            type="number"
                            min="1"
                            max="${Number(producto.existencias) || 1}"
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

    actualizarResumen(cantidadTotal, subtotalProductos);
}

// ACTUALIZAR RESUMEN
function actualizarResumen(cantidad, subtotal) {
    cantidadActualCarrito = Number(cantidad) || 0;
    subtotalActualCarrito = Number(subtotal) || 0;
    refrescarTotalesEnPantalla();
}

// CAMBIAR CANTIDAD
function cambiarCantidad(id, cantidad) {
    const carrito = leerCarrito();
    const item = carrito.find(p => String(p.id) === String(id));
    const producto = productosCarrito.find(p => String(p.id) === String(id));

    if (!item || !producto) return;

    const nuevaCantidad = Math.floor(Number(cantidad));

    if (
        !Number.isFinite(nuevaCantidad) ||
        nuevaCantidad < 1 ||
        nuevaCantidad > Number(producto.existencias)
    ) {
        mostrarCarrito();
        alert("La cantidad supera las unidades disponibles.");
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarCarrito(carrito);
    mostrarCarrito();
}

// ELIMINAR PRODUCTO
function quitarProducto(id) {
    const carrito = leerCarrito().filter(item => String(item.id) !== String(id));
    guardarCarrito(carrito);
    productosCarrito = productosCarrito.filter(p => String(p.id) !== String(id));
    mostrarCarrito();
}

// VACIAR CARRITO
function vaciarCarrito() {
    if (!leerCarrito().length) return;
    if (!confirm("¿Quieres eliminar todos los productos del carrito?")) {
        return;
    }
    guardarCarrito([]);
    productosCarrito = [];
    mostrarCarrito();
}

// REGISTRAR PEDIDO EN SUPABASE Y ENVIAR POR WHATSAPP
async function enviarPedido() {
    const btnEnviar = document.getElementById("pedido-whatsapp");
    const carrito = leerCarrito();

    if (!carrito.length) {
        alert("Tu carrito está vacío.");
        return;
    }

    if (!window.skenziDB) {
        alert("No hay conexión con Supabase.");
        return;
    }

    const nombre = (document.getElementById("nombre-cliente")?.value || "").trim();
    const celular = (document.getElementById("celular-cliente")?.value || "").trim();
    const ciudad = (document.getElementById("ciudad-cliente")?.value || "").trim();
    const direccion = (document.getElementById("direccion-cliente")?.value || "").trim();
    const indicaciones = (document.getElementById("indicaciones-cliente")?.value || "").trim();
    const metodoPago = (document.getElementById("metodo-pago")?.value || "").trim();
    const { barrio, costoEnvio, requiereSeleccion, seleccionado } = obtenerDatosEnvio();

    if (!nombre || !celular || !ciudad || !direccion || !metodoPago) {
        alert("Por favor completa todos los campos obligatorios (*).");
        return;
    }

    if (requiereSeleccion && !seleccionado) {
        alert("Por favor selecciona tu barrio para calcular el envío.");
        return;
    }

    let subtotalCalculado = 0;
    const lineas = [];
    const itemsPayload = [];

    for (const item of carrito) {
        const producto = productosCarrito.find(
            p => String(p.id) === String(item.id)
        );

        if (!producto) continue;

        const precio = Number(producto.precio_venta) || 0;
        const cantidad = Number(item.cantidad) || 1;

        if (
            !producto.activo ||
            Number(producto.existencias) < cantidad ||
            precio <= 0
        ) {
            alert(`Debes revisar la disponibilidad de ${producto.nombre}.`);
            return;
        }

        const subtotalItem = precio * cantidad;
        subtotalCalculado += subtotalItem;

        lineas.push(
            `- ${producto.nombre} x ${cantidad}: ${FORMATO_COP.format(subtotalItem)}`
        );

        itemsPayload.push({
            id: producto.id,
            cantidad
        });
    }

    if (!itemsPayload.length) {
        alert("No hay productos disponibles para realizar el pedido.");
        return;
    }

    const textoOriginal = btnEnviar ? btnEnviar.textContent : "ENVIAR PEDIDO";
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = "REGISTRANDO PEDIDO...";
    }

    try {
        const { data, error } = await window.skenziDB.rpc("crear_pedido_tienda", {
            p_cliente: {
                nombre,
                celular,
                ciudad,
                barrio,
                direccion,
                indicaciones
            },
            p_items: itemsPayload,
            p_metodo_pago: metodoPago,
            p_domicilio: costoEnvio,
            p_observaciones: `Barrio: ${barrio || "No especificado"} | Envío: ${FORMATO_COP.format(costoEnvio)}`
        });

        if (error) {
            throw new Error(error.message || "Error al registrar el pedido.");
        }

        const fila = Array.isArray(data) ? data[0] : data;
        const numeroPedido = fila?.numero ?? "";
        const subtotalFinal = Number(fila?.subtotal ?? subtotalCalculado) || subtotalCalculado;
        const totalFinal = Number(fila?.total ?? (subtotalFinal + costoEnvio)) || (subtotalFinal + costoEnvio);

        const mensaje = [
            `Hola, Skenzi Home. Quiero realizar el pedido #${numeroPedido}:`,
            "",
            ...lineas,
            "",
            `Subtotal productos: ${FORMATO_COP.format(subtotalFinal)}`,
            `Envío (${barrio || ciudad}): ${FORMATO_COP.format(costoEnvio)}`,
            `Total a pagar: ${FORMATO_COP.format(totalFinal)}`,
            "",
            `Cliente: ${nombre} (${celular})`,
            `Dirección: ${direccion}${barrio ? `, ${barrio}` : ""} - ${ciudad}`,
            indicaciones ? `Indicaciones: ${indicaciones}` : null,
            `Método de pago: ${metodoPago}`
        ].filter(Boolean).join("\n");

        guardarCarrito([]);
        productosCarrito = [];
        mostrarCarrito();

        alert(`¡Pedido registrado! Tu número de pedido es ${numeroPedido}. Está pendiente de confirmación.`);

        const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
        alert(`No pudimos registrar tu pedido. No se ha enviado a WhatsApp. Detalle: ${error.message}`);
    } finally {
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = textoOriginal;
        }
    }
}

// EVENTOS
document.addEventListener("DOMContentLoaded", () => {
    cargarCarrito();

    const selectBarrio = document.getElementById("barrio-select");
    selectBarrio?.addEventListener("change", refrescarTotalesEnPantalla);
    selectBarrio?.addEventListener("input", refrescarTotalesEnPantalla);

    document.getElementById("barrio-cliente")?.addEventListener("input", refrescarTotalesEnPantalla);

    document.addEventListener("click", evento => {
        const quitar = evento.target.closest("[data-quitar]");
        if (quitar) {
            quitarProducto(quitar.dataset.quitar);
        }
    });

    document.addEventListener("change", evento => {
        const cantidad = evento.target.closest("[data-cantidad]");
        if (cantidad) {
            cambiarCantidad(
                cantidad.dataset.cantidad,
                cantidad.value
            );
        }
    });

    document.getElementById("vaciar-carrito")
        ?.addEventListener("click", vaciarCarrito);

    document.getElementById("pedido-whatsapp")
        ?.addEventListener("click", enviarPedido);
});
