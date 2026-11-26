/* ==========================================
   SKENZI HOME — CATÁLOGO GENERAL
   SUPABASE — ESTRUCTURA REAL
   ========================================== */

"use strict";

const WHATSAPP_CATALOGO = "573137541978";

window.SK_PRODUCTOS = [];
window.SK_CATEGORIAS = [];

const formatoPrecio = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

// CONEXIÓN A SUPABASE
function obtenerConexionSkenzi() {
    return window.skenziDB || window.skenziAdminDB || null;
}

// CARGAR CATEGORÍAS
async function cargarCategorias() {
    const db = obtenerConexionSkenzi();

    if (!db) {
        throw new Error("No existe conexión con Supabase.");
    }

    const { data, error } = await db
        .from("categorias")
        .select("id, nombre")
        .eq("activa", true)
        .order("nombre");

    if (error) throw error;

    window.SK_CATEGORIAS = data || [];

    return window.SK_CATEGORIAS;
}

// CARGAR PRODUCTOS ACTIVOS
async function cargarProductos() {
    const galeria = document.getElementById("galeria-productos");

    if (!galeria) return;

    galeria.innerHTML = `
        <p class="mensaje-carga">
            Cargando nuestros productos...
        </p>
    `;

    try {
        const db = obtenerConexionSkenzi();

        if (!db) {
            throw new Error("No existe conexión con Supabase.");
        }

        // CARGAR CATEGORÍAS
        await cargarCategorias();

        // CONSULTAR PRODUCTOS CON COLUMNAS REALES
        const { data, error } = await db
            .from("productos")
            .select(`
                id,
                codigo_barras,
                sku,
                nombre,
                descripcion,
                categoria_id,
                costo_compra,
                precio_venta,
                existencias,
                stock_minimo,
                proveedor,
                imagen_url,
                imagenes_adicionales,
                es_novedad,
                es_destacado,
                en_oferta,
                activo
            `)
            .eq("activo", true)
            .order("creado_en", { ascending: false });

        if (error) throw error;

        // CONVERTIR DATOS DE SUPABASE
        window.SK_PRODUCTOS = (data || []).map(producto => {

            const categoria = window.SK_CATEGORIAS.find(
                item => item.id === producto.categoria_id
            );

            return {
                id: producto.id,

                nombre: producto.nombre || "Producto sin nombre",

                descripcion: producto.descripcion || "",

                categoria: categoria
                    ? categoria.nombre
                    : "Sin categoría",

                categoriaId: producto.categoria_id || "",

                costo: Number(producto.costo_compra) || 0,

                precio: Number(producto.precio_venta) || 0,

                existencias: Number(producto.existencias) || 0,

                stockMinimo: Number(producto.stock_minimo) || 0,

                imagen: producto.imagen_url || "",

                imagenesAdicionales:
                    Array.isArray(producto.imagenes_adicionales)
                        ? producto.imagenes_adicionales
                        : [],

                codigoBarras: producto.codigo_barras || "",

                sku: producto.sku || "",

                proveedor: producto.proveedor || "",

                esNovedad: producto.es_novedad === true,

                esDestacado: producto.es_destacado === true,

                enOferta: producto.en_oferta === true,

                activo: producto.activo === true
            };
        });

        mostrarCatalogo(window.SK_PRODUCTOS);
        cargarFotografiasBanners();

        console.log(
            "SKENZI HOME — Productos cargados:",
            window.SK_PRODUCTOS.length
        );

        console.log(
            "SKENZI HOME — Categorías cargadas:",
            window.SK_CATEGORIAS.length
        );

    } catch (error) {

        console.error(
            "Error cargando catálogo SKENZI HOME:",
            error
        );

        galeria.innerHTML = `
            <p class="mensaje-carga">
                No fue posible cargar los productos.
                Intenta nuevamente más tarde.
            </p>
        `;
    }
}

// MOSTRAR GALERÍA DE PRODUCTOS
function mostrarCatalogo(productos) {

    const galeria = document.getElementById("galeria-productos");

    if (!galeria) return;

    if (!productos || productos.length === 0) {

        galeria.innerHTML = `
            <p class="mensaje-carga">
                Próximamente tendremos productos disponibles.
            </p>
        `;

        return;
    }

    galeria.innerHTML = productos.map(producto => {

        const precio = producto.precio > 0
            ? formatoPrecio.format(producto.precio)
            : "Consultar precio";

        const imagen = producto.imagen
            ? `
                <img
                    src="${escaparHTML(producto.imagen)}"
                    alt="${escaparHTML(producto.nombre)}"
                    loading="lazy"
                >
            `
            : `
                <div class="imagen-vacia">
                    🛍️
                </div>
            `;

        const enlaceProducto =
            `producto.html?id=${encodeURIComponent(producto.id)}`;

        const tieneExistencias = producto.existencias > 0;

        const puedeAgregar =
            tieneExistencias && producto.precio > 0;

        const textoBoton = !tieneExistencias
            ? "Agotado"
            : producto.precio > 0
                ? "Agregar al carrito"
                : "Consultar precio";

        return `
            <article class="tarjeta-producto">

                <a
                    href="${enlaceProducto}"
                    class="enlace-producto"
                >

                    <div class="imagen-producto">
                        ${imagen}
                    </div>

                    <div class="contenido">

                        <h3>
                            ${escaparHTML(producto.nombre)}
                        </h3>

                        <p class="precio-producto">
                            ${precio}
                        </p>

                        <span class="ver-detalles">
                            Ver detalles →
                        </span>

                    </div>

                </a>

                <button
                    type="button"
                    onclick="agregarAlCarrito('${escaparHTML(producto.id)}')"
                    ${!puedeAgregar ? "disabled" : ""}
                >
                    ${textoBoton}
                </button>

            </article>
        `;

    }).join("");
}

// PROTECCIÓN DE TEXTO HTML
function escaparHTML(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

// FILTRAR POR CATEGORÍA
function filtrarProductosPorCategoria(categoriaId) {

    const productos = categoriaId
        ? window.SK_PRODUCTOS.filter(
            producto => producto.categoriaId === categoriaId
        )
        : window.SK_PRODUCTOS;

    mostrarCatalogo(productos);
}

// HACER FUNCIONES ACCESIBLES DESDE OTROS ARCHIVOS
window.cargarProductos = cargarProductos;
window.mostrarCatalogo = mostrarCatalogo;
window.filtrarProductosPorCategoria = filtrarProductosPorCategoria;
window.escaparHTML = escaparHTML;

// INICIAR CATÁLOGO
document.addEventListener(
    "DOMContentLoaded",
    cargarProductos
);

/* ==========================================
   FOTOGRAFÍAS PARA BANNERS PUBLICITARIOS
   ========================================== */

function cargarFotografiasBanners() {

    const productos = (window.SK_PRODUCTOS || [])
        .filter(p => p.imagen && p.imagen.trim() !== "");

    const contenedores = [
        "banner-productos-1",
        "banner-productos-2",
        "banner-productos-3"
    ];

    contenedores.forEach((id, indice) => {

        const contenedor = document.getElementById(id);

        if (!contenedor) return;

        const inicio = indice * 3;

        let seleccion = productos.slice(inicio, inicio + 3);

        // Si hay pocos productos, reutilizar fotografías disponibles.
        if (seleccion.length === 0) {
            seleccion = productos.slice(0, 3);
        }

        contenedor.innerHTML = seleccion.map(producto => `
            <img
                src="${escaparHTML(producto.imagen)}"
                alt="${escaparHTML(producto.nombre)}"
                loading="lazy"
                title="${escaparHTML(producto.nombre)}"
            >
        `).join("");

    });

}

// HACER DISPONIBLE LA FUNCIÓN
window.cargarFotografiasBanners = cargarFotografiasBanners;
