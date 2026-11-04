/* ==========================================
   SKENZI HOME — PANEL ADMINISTRATIVO
   Inventario e impresión de etiquetas POS-80C
   ========================================== */

"use strict";

document.addEventListener("DOMContentLoaded", iniciarPanel);

async function iniciarPanel() {

    const db = window.skenziAdminDB;

    const lista = document.getElementById("lista-productos-admin");
    const buscar = document.getElementById("buscar-admin");
    const filtro = document.getElementById("filtro-categoria");

    if (!db) {
        lista.innerHTML = "<p>No se pudo conectar con Supabase.</p>";
        return;
    }

    // Verificar sesión
    const { data: sesionData, error: sesionError } =
        await db.auth.getSession();

    const usuario = sesionData?.session?.user;

    if (sesionError || !usuario) {
        window.location.href = "login-admin.html";
        return;
    }

    if (usuario.email?.toLowerCase() !== "hurtado03444@gmail.com") {
        await db.auth.signOut();
        window.location.href = "login-admin.html";
        return;
    }

    document.getElementById("correo-admin").textContent =
        usuario.email;

    // Cerrar sesión
    document.getElementById("cerrar-sesion")
        ?.addEventListener("click", async () => {
            await db.auth.signOut();
            window.location.href = "login-admin.html";
        });

    let productos = [];

    // Cargar inventario
    async function cargarProductos() {

        lista.innerHTML = "<p>Cargando inventario...</p>";

        const { data, error } = await db
            .from("productos")
            .select(`
                id,
                nombre,
                descripcion,
                categoria,
                imagen_url,
                precio,
                stock,
                activo,
                publicado,
                codigo_barras,
                tipo_inventario,
                visitas
            `)
            .order("creado_en", { ascending: false });

        if (error) {
            console.error("Error al cargar productos:", error);
            lista.innerHTML =
                "<p>No fue posible cargar los productos. Revisa la conexión y los permisos.</p>";
            return;
        }

        productos = data || [];

        actualizarResumen();
        mostrarProductos();
    }

    // Resumen
    function actualizarResumen() {

        document.getElementById("total-productos").textContent =
            productos.length;

        document.getElementById("productos-publicados").textContent =
            productos.filter(p => p.activo && p.publicado).length;

        document.getElementById("productos-agotados").textContent =
            productos.filter(p =>
                p.tipo_inventario === "Fisico" &&
                Number(p.stock) <= 0
            ).length;
    }

    // Mostrar productos
    function mostrarProductos() {

        const texto = buscar?.value.trim().toLowerCase() || "";
        const categoria = filtro?.value || "";

        const filtrados = productos.filter(p => {

            const coincideNombre =
                (p.nombre || "").toLowerCase().includes(texto);

            const coincideCodigo =
                (p.codigo_barras || "").toLowerCase().includes(texto);

            const coincideCategoria =
                !categoria || p.categoria === categoria;

            return (coincideNombre || coincideCodigo) &&
                coincideCategoria;
        });

        if (!filtrados.length) {
            lista.innerHTML =
                "<p class='mensaje-admin'>No se encontraron productos.</p>";
            return;
        }

        lista.innerHTML = filtrados.map(p => `

            <article class="producto-admin-card">

                <div class="producto-admin-info">

                    ${p.imagen_url
                        ? `<img src="${escapar(p.imagen_url)}"
                               alt="${escapar(p.nombre)}"
                               class="producto-admin-imagen">`
                        : ""
                    }

                    <div>
                        <h3>${escapar(p.nombre)}</h3>

                        <p>${escapar(p.categoria || "Sin categoría")}</p>

                        <strong>
                            ${formatearPrecio(p.precio)}
                        </strong>

                        <p>
                            Stock: ${Number(p.stock) || 0}
                            · ${escapar(p.tipo_inventario || "Fisico")}
                        </p>

                        <small>
                            ${p.activo && p.publicado
                                ? "Publicado"
                                : "No publicado"}
                        </small>
                    </div>

                </div>

                <button
                    type="button"
                    class="boton-imprimir-etiqueta"
                    data-id="${p.id}">
                    Imprimir etiqueta
                </button>

            </article>

        `).join("");

        lista.querySelectorAll(".boton-imprimir-etiqueta")
            .forEach(boton => {
                boton.addEventListener("click", () => {
                    const producto = productos.find(
                        p => p.id === boton.dataset.id
                    );

                    if (producto) imprimirEtiqueta(producto);
                });
            });
    }

    // Imprimir etiqueta POS-80C
    function imprimirEtiqueta(producto) {

        if (typeof JsBarcode === "undefined") {
            alert("No se ha cargado el generador de códigos de barras.");
            return;
        }

        const codigo = producto.codigo_barras ||
            ("SH" + producto.id.replace(/-/g, "").substring(0, 10))
                .toUpperCase();

        const ventana = window.open("", "_blank", "width=420,height=650");

        if (!ventana) {
            alert("Permite las ventanas emergentes para imprimir.");
            return;
        }

        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        try {
            JsBarcode(svg, codigo, {
                format: "CODE128",
                width: 2,
                height: 48,
                displayValue: true,
                fontSize: 13,
                margin: 2
            });
        } catch (error) {
            ventana.close();
            alert("No se pudo generar el código de barras.");
            return;
        }

        const codigoSVG = svg.outerHTML;

        ventana.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Etiqueta Skenzi Home</title>

                <style>
                    @page {
                        size: 80mm auto;
                        margin: 3mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        width: 74mm;
                        margin: 0 auto;
                        padding: 3mm 0;
                        color: #111;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }

                    .marca {
                        font-size: 17px;
                        font-weight: bold;
                        letter-spacing: 2px;
                    }

                    .producto {
                        font-size: 15px;
                        font-weight: bold;
                        margin: 10px 0 6px;
                        overflow-wrap: anywhere;
                    }

                    .referencia {
                        font-size: 11px;
                        margin-bottom: 8px;
                    }

                    .precio {
                        font-size: 25px;
                        font-weight: bold;
                        margin: 8px 0;
                    }

                    .barcode {
                        width: 100%;
                        height: auto;
                        max-height: 65px;
                    }

                    .pie {
                        font-size: 10px;
                        margin-top: 8px;
                    }

                    @media screen {
                        body {
                            padding: 15px;
                        }
                    }
                </style>
            </head>

            <body>

                <div class="marca">SKENZI HOME</div>

                <div class="producto">
                    ${escapar(producto.nombre)}
                </div>

                <div class="referencia">
                    Ref: ${escapar(codigo)}
                </div>

                <div class="precio">
                    ${formatearPrecio(producto.precio)}
                </div>

                ${codigoSVG}

                <div class="pie">
                    Gracias por tu compra
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                <\/script>

            </body>
            </html>
        `);

        ventana.document.close();
    }
// ======================================
// AGREGAR PRODUCTOS A SUPABASE
// ======================================

const modalProducto = document.getElementById("modal-producto");
const formularioProducto = document.getElementById("form-producto");
const botonNuevoProducto = document.getElementById("nuevo-producto");
const botonCerrarModal = document.getElementById("cerrar-modal-producto");
const botonCancelarProducto = document.getElementById("cancelar-producto");
const botonGuardarProducto = document.getElementById("guardar-producto");
const mensajeProducto = document.getElementById("mensaje-producto");

// Abrir formulario
botonNuevoProducto?.addEventListener("click", () => {
    formularioProducto.reset();
    document.getElementById("producto-stock").value = 0;
    document.getElementById("producto-stock-minimo").value = 2;
    document.getElementById("producto-activo").checked = true;
    document.getElementById("producto-publicado").checked = false;

    mensajeProducto.textContent = "";
    modalProducto.hidden = false;
});

// Cerrar formulario
function cerrarFormularioProducto() {
    modalProducto.hidden = true;
}

botonCerrarModal?.addEventListener("click", cerrarFormularioProducto);
botonCancelarProducto?.addEventListener("click", cerrarFormularioProducto);

// Guardar producto
formularioProducto?.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensajeProducto.style.color = "#A34E43";
    mensajeProducto.textContent = "";

    botonGuardarProducto.disabled = true;
    botonGuardarProducto.textContent = "GUARDANDO...";

    const nuevoProducto = {
        nombre: document.getElementById("producto-nombre").value.trim(),
        descripcion: document.getElementById("producto-descripcion").value.trim(),
        categoria: document.getElementById("producto-categoria").value,
        imagen_url: document.getElementById("producto-imagen").value.trim() || null,
        costo: Number(document.getElementById("producto-costo").value),
        precio: Number(document.getElementById("producto-precio").value),
        stock: Number(document.getElementById("producto-stock").value),
        stock_minimo: Number(document.getElementById("producto-stock-minimo").value),
        codigo_barras: document.getElementById("producto-codigo").value.trim() || null,
        tipo_inventario: document.getElementById("producto-tipo").value,
        activo: document.getElementById("producto-activo").checked,
        publicado: document.getElementById("producto-publicado").checked
    };

    try {
        const { error } = await db
            .from("productos")
            .insert([nuevoProducto]);

        if (error) throw error;

        mensajeProducto.style.color = "#394E3C";
        mensajeProducto.textContent = "¡Producto guardado correctamente!";

        await cargarProductos();

        formularioProducto.reset();

        setTimeout(() => {
            cerrarFormularioProducto();
        }, 1200);

    } catch (error) {
        console.error("Error al guardar producto:", error);
        mensajeProducto.textContent =
            "No se pudo guardar: " + error.message;

    } finally {
        botonGuardarProducto.disabled = false;
        botonGuardarProducto.textContent = "GUARDAR PRODUCTO";
    }
});
    // Eventos de búsqueda y categoría
    buscar?.addEventListener("input", mostrarProductos);
    filtro?.addEventListener("change", mostrarProductos);

    // Formato de precio
    function formatearPrecio(valor) {
        return "$ " + Number(valor || 0).toLocaleString("es-CO");
    }

    // Evitar insertar HTML desde los datos del producto
    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    await cargarProductos();
}
