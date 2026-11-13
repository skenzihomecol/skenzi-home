
/* ==========================================
   SKENZI HOME — PANEL ADMINISTRATIVO
   INVENTARIO + 3 FOTOGRAFÍAS + ETIQUETAS
   SUPABASE — ESTRUCTURA REAL
   ========================================== */

"use strict";

document.addEventListener("DOMContentLoaded", iniciarPanel);

async function iniciarPanel() {

    const db = window.skenziAdminDB;

    const lista = document.getElementById("lista-productos-admin");
    const buscar = document.getElementById("buscar-admin");
    const filtro = document.getElementById("filtro-categoria");

    const modal = document.getElementById("modal-producto");
    const formulario = document.getElementById("form-producto");

    const botonNuevo = document.getElementById("nuevo-producto");
    const botonCerrar = document.getElementById("cerrar-modal-producto");
    const botonCancelar = document.getElementById("cancelar-producto");
    const botonGuardar = document.getElementById("guardar-producto");

    const mensaje = document.getElementById("mensaje-producto");

    const imagenPrincipal = document.getElementById(
        "producto-imagen-principal"
    );

    const imagenesAdicionales = document.getElementById(
        "producto-imagenes-adicionales"
    );

    const vistaPrincipal = document.getElementById(
        "vista-imagen-principal"
    );

    const vistaAdicionales = document.getElementById(
        "vista-imagenes-adicionales"
    );

    let productos = [];
    let categorias = [];

    const BUCKET = "productos";
    const MAX_IMAGENES_ADICIONALES = 2;
    const MAX_TAMANO_IMAGEN = 5 * 1024 * 1024;

    const correoAutorizado = "hurtado03444@gmail.com";

    // ======================================
    // VERIFICAR ELEMENTOS Y CONEXIÓN
    // ======================================

    if (!db) {
        if (lista) {
            lista.innerHTML =
                "<p>No se pudo conectar con Supabase.</p>";
        }
        console.error("No existe skenziAdminDB.");
        return;
    }

    if (!lista || !formulario || !modal) {
        console.error("Faltan elementos del panel administrativo.");
        return;
    }

    // ======================================
    // VERIFICAR SESIÓN
    // ======================================

    const { data: sesionData, error: sesionError } =
        await db.auth.getSession();

    const usuario = sesionData?.session?.user;

    if (sesionError || !usuario) {
        window.location.href = "login-admin.html";
        return;
    }

    if (usuario.email?.toLowerCase() !== correoAutorizado) {
        await db.auth.signOut();
        window.location.href = "login-admin.html";
        return;
    }

    document.getElementById("correo-admin").textContent =
        usuario.email;

    // ======================================
    // CERRAR SESIÓN
    // ======================================

    document.getElementById("cerrar-sesion")
        ?.addEventListener("click", async () => {

            await db.auth.signOut();

            window.location.href = "login-admin.html";
        });

    // ======================================
    // CARGAR CATEGORÍAS REALES
    // ======================================

    async function cargarCategorias() {

        const { data, error } = await db
            .from("categorias")
            .select("id, nombre, activa")
            .eq("activa", true)
            .order("nombre");

        if (error) throw error;

        categorias = data || [];

        const selectCategoria =
            document.getElementById("producto-categoria");

        if (selectCategoria) {

            selectCategoria.innerHTML = `
                <option value="">Seleccionar categoría</option>
                ${categorias.map(categoria => `
                    <option value="${escapar(categoria.id)}">
                        ${escapar(categoria.nombre)}
                    </option>
                `).join("")}
            `;
        }

        if (filtro) {

            filtro.innerHTML = `
                <option value="">Todas las categorías</option>
                ${categorias.map(categoria => `
                    <option value="${escapar(categoria.id)}">
                        ${escapar(categoria.nombre)}
                    </option>
                `).join("")}
            `;
        }

        console.log("Categorías cargadas:", categorias.length);
    }

    // ======================================
    // CARGAR INVENTARIO
    // ======================================

    async function cargarProductos() {

        lista.innerHTML = `
            <p class="mensaje-admin">Cargando inventario...</p>
        `;

        try {

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
                    activo,
                    creado_en
                `)
                .order("creado_en", { ascending: false });

            if (error) throw error;

            productos = (data || []).map(producto => {

                const categoria = categorias.find(
                    item => item.id === producto.categoria_id
                );

                return {
                    ...producto,
                    categoria_nombre: categoria
                        ? categoria.nombre
                        : "Sin categoría"
                };
            });

            actualizarResumen();
            mostrarProductos();

            console.log(
                "Inventario cargado:",
                productos.length
            );

        } catch (error) {

            console.error("Error cargando inventario:", error);

            lista.innerHTML = `
                <p class="mensaje-admin">
                    No fue posible cargar los productos:
                    ${escapar(error.message)}
                </p>
            `;
        }
    }

    // ======================================
    // RESUMEN DEL INVENTARIO
    // ======================================

    function actualizarResumen() {

        document.getElementById("total-productos").textContent =
            productos.length;

        document.getElementById("productos-publicados").textContent =
            productos.filter(p => p.activo === true).length;

        document.getElementById("productos-agotados").textContent =
            productos.filter(p =>
                Number(p.existencias) <= 0
            ).length;
    }

    // ======================================
    // MOSTRAR PRODUCTOS
    // ======================================

    function mostrarProductos() {

        const texto = buscar?.value.trim().toLowerCase() || "";
        const categoriaId = filtro?.value || "";

        const filtrados = productos.filter(p => {

            const coincideNombre =
                (p.nombre || "").toLowerCase().includes(texto);

            const coincideCodigo =
                (p.codigo_barras || "").toLowerCase().includes(texto);

            const coincideCategoria =
                !categoriaId || p.categoria_id === categoriaId;

            return (coincideNombre || coincideCodigo) &&
                coincideCategoria;
        });

        if (!filtrados.length) {

            lista.innerHTML = `
                <p class="mensaje-admin">
                    No se encontraron productos.
                </p>
            `;

            return;
        }

        lista.innerHTML = filtrados.map(p => {

            const imagenes = [
                p.imagen_url,
                ...(Array.isArray(p.imagenes_adicionales)
                    ? p.imagenes_adicionales
                    : [])
            ].filter(Boolean);

            return `
                <article class="producto-admin-card">

                    <div class="producto-admin-info">

                        ${p.imagen_url ? `
                            <img
                                src="${escapar(p.imagen_url)}"
                                alt="${escapar(p.nombre)}"
                                class="producto-admin-imagen"
                            >
                        ` : ""}

                        <div>

                            <h3>${escapar(p.nombre)}</h3>

                            <p>
                                ${escapar(p.categoria_nombre)}
                            </p>

                            <strong>
                                ${formatearPrecio(p.precio_venta)}
                            </strong>

                            <p>
                                Stock: ${Number(p.existencias) || 0}
                            </p>

                            <small>
                                ${p.activo ? "Activo" : "Inactivo"}
                                · ${imagenes.length} fotografía(s)
                            </small>

                        </div>

                    </div>

                    <button
                        type="button"
                        class="boton-imprimir-etiqueta"
                        data-id="${escapar(p.id)}"
                    >
                        Imprimir etiqueta
                    </button>


<div class="acciones-producto-admin">

    <button
        type="button"
        class="boton-editar-producto"
        data-id="${escapar(p.id)}">
        Editar producto
    </button>

    <button
        type="button"
        class="boton-eliminar-producto"
        data-id="${escapar(p.id)}">
        Eliminar
    </button>

</div>

                </article>
            `;

        }).join("");

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

    // ======================================
    // FORMATO DE PRECIO
    // ======================================

    function formatearPrecio(valor) {

        return "$ " + Number(valor || 0).toLocaleString("es-CO");
    }

    // ======================================
    // PROTECCIÓN HTML
    // ======================================

    function escapar(valor) {

        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    // ======================================
    // PREVISUALIZAR FOTOGRAFÍA PRINCIPAL
    // ======================================

    function mostrarVistaPrincipal() {

        if (!vistaPrincipal || !imagenPrincipal) return;

        const archivo = imagenPrincipal.files?.[0];

        vistaPrincipal.innerHTML = "";

        if (!archivo) return;

        const imagen = document.createElement("img");

        imagen.src = URL.createObjectURL(archivo);
        imagen.alt = "Fotografía principal";

        imagen.style.maxWidth = "150px";
        imagen.style.maxHeight = "150px";
        imagen.style.objectFit = "contain";

        vistaPrincipal.appendChild(imagen);
    }

    // ======================================
    // PREVISUALIZAR FOTOGRAFÍAS ADICIONALES
    // ======================================

    function mostrarVistasAdicionales() {

        if (!vistaAdicionales || !imagenesAdicionales) return;

        const archivos = Array.from(imagenesAdicionales.files || []);

        vistaAdicionales.innerHTML = "";

        if (archivos.length > MAX_IMAGENES_ADICIONALES) {

            imagenesAdicionales.value = "";

            alert("Solo puedes seleccionar dos fotografías adicionales.");

            return;
        }

        archivos.forEach((archivo, indice) => {

            const imagen = document.createElement("img");

            imagen.src = URL.createObjectURL(archivo);
            imagen.alt = `Fotografía adicional ${indice + 1}`;

            imagen.style.maxWidth = "120px";
            imagen.style.maxHeight = "120px";
            imagen.style.objectFit = "contain";

            vistaAdicionales.appendChild(imagen);
        });
    }

    imagenPrincipal?.addEventListener(
        "change",
        mostrarVistaPrincipal
    );

    imagenesAdicionales?.addEventListener(
        "change",
        mostrarVistasAdicionales
    );

    // ======================================
    // VALIDAR FOTOGRAFÍAS
    // ======================================

    function validarImagen(archivo) {

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(archivo.type)) {
            throw new Error(
                "Solo se permiten imágenes JPG, PNG o WEBP."
            );
        }

        if (archivo.size > MAX_TAMANO_IMAGEN) {
            throw new Error(
                "Cada fotografía debe pesar máximo 5 MB."
            );
        }
    }

    // ======================================
    // SUBIR UNA FOTOGRAFÍA A STORAGE
    // ======================================

    async function subirImagen(archivo) {

        validarImagen(archivo);

        const extension = archivo.name
            .split(".")
            .pop()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const nombreArchivo =
            `${crypto.randomUUID()}.${extension}`;

        const ruta = `productos/${nombreArchivo}`;

        const { error } = await db.storage
            .from(BUCKET)
            .upload(ruta, archivo, {
                cacheControl: "3600",
                upsert: false,
                contentType: archivo.type
            });

        if (error) throw error;

        const { data } = db.storage
            .from(BUCKET)
            .getPublicUrl(ruta);

        return {
            ruta,
            url: data.publicUrl
        };
    }

    // ======================================
    // ELIMINAR ARCHIVOS SI FALLA EL GUARDADO
    // ======================================

    async function limpiarImagenesSubidas(rutas) {

        if (!rutas.length) return;

        const { error } = await db.storage
            .from(BUCKET)
            .remove(rutas);

        if (error) {
            console.error(
                "No se pudieron limpiar las imágenes:",
                error
            );
        }
    }

    // ======================================
    // ABRIR FORMULARIO
    // ======================================

    function abrirFormularioProducto() {

        formulario.reset();

        document.getElementById("producto-stock").value = 0;

        document.getElementById("producto-stock-minimo").value = 2;

        document.getElementById("producto-activo").checked = true;

        document.getElementById("producto-publicado").checked = false;

        imagenPrincipal.value = "";
        imagenesAdicionales.value = "";

        vistaPrincipal.innerHTML = "";
        vistaAdicionales.innerHTML = "";

        mensaje.textContent = "";

        modal.hidden = false;
    }

    botonNuevo?.addEventListener(
        "click",
        abrirFormularioProducto
    );

    // ======================================
    // CERRAR FORMULARIO
    // ======================================

    function cerrarFormularioProducto() {

        modal.hidden = true;
    }

    botonCerrar?.addEventListener(
        "click",
        cerrarFormularioProducto
    );

    botonCancelar?.addEventListener(
        "click",
        cerrarFormularioProducto
    );

    // ======================================
    // GUARDAR PRODUCTO EN SUPABASE
    // ======================================

    formulario.addEventListener("submit", async evento => {

        evento.preventDefault();

        const rutasSubidas = [];

        mensaje.style.color = "#A34E43";
        mensaje.textContent = "";

        botonGuardar.disabled = true;
        botonGuardar.textContent = "GUARDANDO...";

        try {

            const archivoPrincipal = imagenPrincipal.files?.[0];

            const archivosAdicionales = Array.from(
                imagenesAdicionales.files || []
            );

            if (!archivoPrincipal) {
                throw new Error(
                    "Selecciona la fotografía principal."
                );
            }

            if (archivosAdicionales.length > 2) {
                throw new Error(
                    "Solo puedes subir dos fotografías adicionales."
                );
            }

            if (archivosAdicionales.some(
                archivo => archivo.name === archivoPrincipal.name
            )) {
                console.warn(
                    "Hay fotografías con el mismo nombre de archivo."
                );
            }

            const categoriaId =
                document.getElementById("producto-categoria").value;

            if (!categoriaId) {
                throw new Error("Selecciona una categoría.");
            }

            const costo = Number(
                document.getElementById("producto-costo").value
            );

            const precio = Number(
                document.getElementById("producto-precio").value
            );

            const existencias = Number(
                document.getElementById("producto-stock").value
            );

            const stockMinimo = Number(
                document.getElementById("producto-stock-minimo").value
            );

            if (
                !Number.isFinite(costo) ||
                !Number.isFinite(precio) ||
                !Number.isInteger(existencias) ||
                !Number.isInteger(stockMinimo) ||
                costo < 0 ||
                precio < 0 ||
                existencias < 0 ||
                stockMinimo < 0
            ) {
                throw new Error(
                    "Revisa los costos, precios y cantidades."
                );
            }

            // SUBIR FOTOGRAFÍA PRINCIPAL

            mensaje.textContent =
                "Subiendo fotografía principal...";

            const principal = await subirImagen(archivoPrincipal);

            rutasSubidas.push(principal.ruta);

            // SUBIR FOTOGRAFÍAS ADICIONALES

            const urlsAdicionales = [];

            for (let i = 0; i < archivosAdicionales.length; i++) {

                mensaje.textContent =
                    `Subiendo fotografía adicional ${i + 1}...`;

                const resultado = await subirImagen(
                    archivosAdicionales[i]
                );

                rutasSubidas.push(resultado.ruta);

                urlsAdicionales.push(resultado.url);
            }

            // DATOS CON LOS NOMBRES REALES DE SUPABASE

            const activo =
                document.getElementById("producto-activo").checked &&
                document.getElementById("producto-publicado").checked;

            const nuevoProducto = {

                nombre: document.getElementById(
                    "producto-nombre"
                ).value.trim(),

                descripcion: document.getElementById(
                    "producto-descripcion"
                ).value.trim(),

                categoria_id: categoriaId,

                costo_compra: costo,

                precio_venta: precio,

                existencias: existencias,

                stock_minimo: stockMinimo,

                codigo_barras: document.getElementById(
                    "producto-codigo"
                ).value.trim() || null,

                imagen_url: principal.url,

                imagenes_adicionales: urlsAdicionales,

                activo: activo,

                es_novedad: false,

                es_destacado: false,

                en_oferta: false
            };

            // GUARDAR EN TABLA PRODUCTOS

            mensaje.textContent =
                "Guardando producto en la base de datos...";

            const { error } = await db
                .from("productos")
                .insert([nuevoProducto]);

            if (error) throw error;

            mensaje.style.color = "#394E3C";

            mensaje.textContent =
                "¡Producto guardado correctamente!";

            // ACTUALIZAR INVENTARIO

            await cargarProductos();

            formulario.reset();

            vistaPrincipal.innerHTML = "";
            vistaAdicionales.innerHTML = "";

            setTimeout(() => {
                cerrarFormularioProducto();
            }, 1200);

        } catch (error) {

            console.error(
                "Error guardando producto:",
                error
            );

            await limpiarImagenesSubidas(rutasSubidas);

            mensaje.style.color = "#A34E43";

            mensaje.textContent =
                "No se pudo guardar: " + error.message;

        } finally {

            botonGuardar.disabled = false;

            botonGuardar.textContent =
                "GUARDAR PRODUCTO";
        }
    });

    // ======================================
    // BÚSQUEDA Y FILTROS
    // ======================================

    buscar?.addEventListener(
        "input",
        mostrarProductos
    );

    filtro?.addEventListener(
        "change",
        mostrarProductos
    );

    // ======================================
    // IMPRIMIR ETIQUETA POS-80C
    // ======================================

    function imprimirEtiqueta(producto) {

        if (typeof JsBarcode === "undefined") {

            alert(
                "No se ha cargado el generador de códigos de barras."
            );

            return;
        }

        const codigo = producto.codigo_barras ||
            ("SH" + producto.id.replace(/-/g, "").substring(0, 10))
                .toUpperCase();

        const ventana = window.open(
            "",
            "_blank",
            "width=420,height=650"
        );

        if (!ventana) {

            alert(
                "Permite las ventanas emergentes para imprimir."
            );

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

            alert(
                "No se pudo generar el código de barras."
            );

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
                    ${formatearPrecio(producto.precio_venta)}
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
    // INICIAR PANEL
    // ======================================

    try {

        await cargarCategorias();

        await cargarProductos();

        console.log(
            "Panel administrativo SKENZI HOME iniciado."
        );

    } catch (error) {

        console.error(
            "Error iniciando panel:",
            error
        );

        lista.innerHTML = `
            <p class="mensaje-admin">
                No se pudo iniciar el panel:
                ${escapar(error.message)}
            </p>
        `;
    }
}
