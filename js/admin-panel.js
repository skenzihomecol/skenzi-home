
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
const productoDestacado = document.getElementById(
    "producto-destacado"
);
   const productoNovedad = document.getElementById(
    "producto-novedad"
);
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
let productoEnEdicion = null;
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

        
        // BOTÓN IMPRIMIR
        lista.querySelectorAll(".boton-imprimir-etiqueta")
            .forEach(boton => {
                boton.addEventListener("click", () => {
                    const producto = productos.find(
                        p => p.id === boton.dataset.id
                    );
                    if (producto) imprimirEtiqueta(producto);
                });
            });

        // BOTÓN EDITAR
        lista.querySelectorAll(".boton-editar-producto")
            .forEach(boton => {
                boton.addEventListener("click", () => {
                    const p = productos.find(
                        item => item.id === boton.dataset.id
                    );

                    if (!p) return;

                    productoEnEdicion = p;
                    formulario.reset();

                    document.getElementById("producto-nombre").value = p.nombre || "";
                    document.getElementById("producto-descripcion").value = p.descripcion || "";
                    document.getElementById("producto-categoria").value = p.categoria_id || "";
                   document.getElementById("producto-proveedor").value = p.proveedor || "";
                    document.getElementById("producto-costo").value = p.costo_compra;
                    document.getElementById("producto-precio").value = p.precio_venta;
                    document.getElementById("producto-stock").value = p.existencias;
                    document.getElementById("producto-stock-minimo").value = p.stock_minimo;
                    document.getElementById("producto-codigo").value = p.codigo_barras || "";

                    document.getElementById("producto-activo").checked = !!p.activo;
                    document.getElementById("producto-publicado").checked = !!p.activo;
if (productoDestacado) {
    productoDestacado.checked = !!p.es_destacado;

}
                   if (productoNovedad) {
    productoNovedad.checked = !!p.es_novedad;
}
                    imagenPrincipal.value = "";
                    imagenesAdicionales.value = "";

                    vistaPrincipal.innerHTML = p.imagen_url
                        ? `<img src="${escapar(p.imagen_url)}" style="max-width:150px;max-height:150px;object-fit:contain">`
                        : "";

                    const adicionales = Array.isArray(p.imagenes_adicionales)
                        ? p.imagenes_adicionales : [];

                    vistaAdicionales.innerHTML = adicionales.map(url =>
                        `<img src="${escapar(url)}" style="max-width:120px;max-height:120px;object-fit:contain">`
                    ).join("");

                    mensaje.textContent = "";
                    botonGuardar.textContent = "ACTUALIZAR PRODUCTO";
                    modal.hidden = false;
                });
            });

        // BOTÓN ELIMINAR
        lista.querySelectorAll(".boton-eliminar-producto")
            .forEach(boton => {
                boton.addEventListener("click", async () => {
                    const p = productos.find(
                        item => item.id === boton.dataset.id
                    );

                    if (!p) return;

                    if (!confirm(`¿Deseas eliminar "${p.nombre}"?`)) return;

                    try {
                        boton.disabled = true;

                        const { error } = await db
                            .from("productos")
                            .delete()
                            .eq("id", p.id);

                        if (error) throw error;

                        alert("Producto eliminado correctamente.");
                        await cargarProductos();

                    } catch (error) {
                        console.error("Error eliminando:", error);
                        alert("No se pudo eliminar: " + error.message);
                        boton.disabled = false;
                    }
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
productoEnEdicion = null;
botonGuardar.textContent = "GUARDAR PRODUCTO";
        formulario.reset();

        document.getElementById("producto-stock").value = 0;

        document.getElementById("producto-stock-minimo").value = 2;

        document.getElementById("producto-activo").checked = true;

        document.getElementById("producto-publicado").checked = false;
if (productoDestacado) {
    productoDestacado.checked = false;
   
}
       if (productoNovedad) {
    productoNovedad.checked = false;
}
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

formulario.addEventListener("submit", async evento => {

    evento.preventDefault();

    const rutasSubidas = [];

    mensaje.style.color = "#A34E43";
    mensaje.textContent = "";

    botonGuardar.disabled = true;
    botonGuardar.textContent = productoEnEdicion
        ? "ACTUALIZANDO..."
        : "GUARDANDO...";

    try {

        const archivoPrincipal = imagenPrincipal.files?.[0];

        const archivosAdicionales = Array.from(
            imagenesAdicionales.files || []
        );

        // Si es nuevo, la imagen principal es obligatoria.
        if (!productoEnEdicion && !archivoPrincipal) {
            throw new Error("Selecciona la fotografía principal.");
        }

        if (archivosAdicionales.length > 2) {
            throw new Error("Solo puedes subir dos fotografías adicionales.");
        }

        const categoriaId =
            document.getElementById("producto-categoria").value;
const proveedor =
    document.getElementById("producto-proveedor").value;

if (!proveedor) {
    throw new Error("Selecciona un proveedor.");
}
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
            throw new Error("Revisa los costos, precios y cantidades.");
        }

        // CONSERVAR O CAMBIAR IMAGEN PRINCIPAL
        let imagenUrl = productoEnEdicion?.imagen_url || null;

        if (archivoPrincipal) {

            mensaje.textContent = "Subiendo fotografía principal...";

            const principal = await subirImagen(archivoPrincipal);

            rutasSubidas.push(principal.ruta);

            imagenUrl = principal.url;
        }

        // CONSERVAR O CAMBIAR FOTOGRAFÍAS ADICIONALES
        let urlsAdicionales = Array.isArray(
            productoEnEdicion?.imagenes_adicionales
        )
            ? [...productoEnEdicion.imagenes_adicionales]
            : [];

        if (archivosAdicionales.length > 0) {

            urlsAdicionales = [];

            for (let i = 0; i < archivosAdicionales.length; i++) {

                mensaje.textContent =
                    `Subiendo fotografía adicional ${i + 1}...`;

                const resultado = await subirImagen(
                    archivosAdicionales[i]
                );

                rutasSubidas.push(resultado.ruta);

                urlsAdicionales.push(resultado.url);
            }
        }

        const activo =
            document.getElementById("producto-activo").checked &&
            document.getElementById("producto-publicado").checked;

        const datosProducto = {

            nombre: document.getElementById(
                "producto-nombre"
            ).value.trim(),

            descripcion: document.getElementById(
                "producto-descripcion"
            ).value.trim(),

            categoria_id: categoriaId,
proveedor: proveedor,
            costo_compra: costo,

            precio_venta: precio,

            existencias: existencias,

            stock_minimo: stockMinimo,

            codigo_barras: document.getElementById(
                "producto-codigo"
            ).value.trim() || null,

            imagen_url: imagenUrl,

            imagenes_adicionales: urlsAdicionales,

            activo: activo,

            es_novedad: productoEnEdicion?.es_novedad ?? false,

           es_destacado: productoDestacado?.checked ?? false,

            en_oferta: productoEnEdicion?.en_oferta ?? false
        };

        mensaje.textContent = productoEnEdicion
            ? "Actualizando producto..."
            : "Guardando producto...";

        let resultado;

        if (productoEnEdicion) {

            // ACTUALIZAR EL PRODUCTO EXISTENTE
            resultado = await db
                .from("productos")
                .update(datosProducto)
                .eq("id", productoEnEdicion.id);

        } else {

            // CREAR UN PRODUCTO NUEVO
            resultado = await db
                .from("productos")
                .insert([datosProducto]);
        }

        if (resultado.error) {
            throw resultado.error;
        }
// Si se seleccionó como destacado, quitar
// esa condición de los demás productos.
if (datosProducto.es_destacado) {

    let consulta = db
        .from("productos")
        .update({ es_destacado: false })
        .eq("es_destacado", true);

    if (productoEnEdicion) {
        consulta = consulta.neq("id", productoEnEdicion.id);
    }

    const { error: errorDestacados } = await consulta;

    if (errorDestacados) {
        console.error(
            "No se pudieron actualizar los otros destacados:",
            errorDestacados
        );

        throw errorDestacados;
    }
}
        mensaje.style.color = "#394E3C";

        mensaje.textContent = productoEnEdicion
            ? "¡Producto actualizado correctamente!"
            : "¡Producto guardado correctamente!";

        productoEnEdicion = null;

        await cargarProductos();

        formulario.reset();

        imagenPrincipal.value = "";
        imagenesAdicionales.value = "";

        vistaPrincipal.innerHTML = "";
        vistaAdicionales.innerHTML = "";

        setTimeout(() => {
            cerrarFormularioProducto();
        }, 1200);

    } catch (error) {

        console.error("Error guardando producto:", error);

        await limpiarImagenesSubidas(rutasSubidas);

        mensaje.style.color = "#A34E43";

        mensaje.textContent =
            "No se pudo guardar: " + error.message;

    } finally {

        botonGuardar.disabled = false;

        botonGuardar.textContent = "GUARDAR PRODUCTO";
    }

});

    // ======================================
    // GUARDAR PRODUCTO EN SUPABASE
    // ======================================

   
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
