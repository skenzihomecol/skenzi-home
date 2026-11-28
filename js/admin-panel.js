/* ==========================================
   SKENZI HOME — PANEL ADMINISTRATIVO
   INVENTARIO + 3 FOTOGRAFÍAS + ETIQUETAS
   PEDIDOS / RÓTULOS / RECIBOS + VENTAS
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
    const productoDestacado = document.getElementById("producto-destacado");
    const productoNovedad = document.getElementById("producto-novedad");
    const imagenPrincipal = document.getElementById("producto-imagen-principal");
    const imagenesAdicionales = document.getElementById("producto-imagenes-adicionales");
    const vistaPrincipal = document.getElementById("vista-imagen-principal");
    const vistaAdicionales = document.getElementById("vista-imagenes-adicionales");

    // Pestañas y nuevas secciones
    const tabs = document.querySelectorAll(".admin-tab");
    const vistas = document.querySelectorAll(".admin-vista");

    const btnLimpiarExpirados = document.getElementById("btn-limpiar-expirados");
    const btnToggleNuevoPedido = document.getElementById("btn-toggle-nuevo-pedido");
    const formNuevoPedido = document.getElementById("form-nuevo-pedido");
    const btnCancelarPedido = document.getElementById("cancelar-pedido");
    const buscarPedido = document.getElementById("buscar-pedido");
    const filtroEstadoPedido = document.getElementById("filtro-estado-pedido");
    const listaPedidosEl = document.getElementById("lista-pedidos-admin");

    const filtroPeriodoRanking = document.getElementById("filtro-periodo-ranking");

    const modalDocumento = document.getElementById("modal-documento-pedido");
    const btnCerrarDocumento = document.getElementById("cerrar-modal-documento");
    const btnCopiarDocumento = document.getElementById("copiar-documento-pedido");
    const btnImprimirDocumento = document.getElementById("imprimir-documento-pedido");
    const etiquetaDocumento = document.getElementById("tipo-documento-etiqueta");
    const tituloDocumento = document.getElementById("titulo-documento-pedido");
    const contenidoDocumento = document.getElementById("contenido-documento-pedido");

    let productos = [];
    let categorias = [];
    let pedidos = [];
    let productoEnEdicion = null;
    let textoDocumentoActual = "";

    const BUCKET = "productos";
    const STORAGE_PEDIDOS = "skenzi_pedidos_admin";
    const MS_48_HORAS = 48 * 60 * 60 * 1000;
    const MAX_IMAGENES_ADICIONALES = 2;
    const MAX_TAMANO_IMAGEN = 5 * 1024 * 1024;
    const correoAutorizado = "hurtado03444@gmail.com";

    // ======================================
    // VERIFICAR ELEMENTOS Y CONEXIÓN
    // ======================================

    if (!db) {
        if (lista) {
            lista.innerHTML = "<p>No se pudo conectar con Supabase.</p>";
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

    document.getElementById("correo-admin").textContent = usuario.email;

    document.getElementById("cerrar-sesion")
        ?.addEventListener("click", async () => {
            await db.auth.signOut();
            window.location.href = "login-admin.html";
        });

    // ======================================
    // NAVEGACIÓN ENTRE VISTAS / PESTAÑAS
    // ======================================

    function cambiarVista(idVista) {
        tabs.forEach(tab => {
            const activa = tab.dataset.vista === idVista;
            tab.classList.toggle("activa", activa);
        });

        vistas.forEach(vista => {
            const esActiva = vista.id === idVista;
            vista.hidden = !esActiva;
            vista.classList.toggle("activa", esActiva);
        });

        if (idVista === "vista-pedidos") {
            poblarSelectProductosPedido();
            mostrarPedidos();
        } else if (idVista === "vista-ventas") {
            actualizarMetricasYRanking();
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            if (tab.dataset.vista) {
                cambiarVista(tab.dataset.vista);
            }
        });
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
            poblarSelectProductosPedido();
            actualizarMetricasYRanking();

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
            productos.filter(p => Number(p.existencias) <= 0).length;
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

            return (coincideNombre || coincideCodigo) && coincideCategoria;
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
    // PEDIDOS, RÓTULOS, RECIBOS Y LIMPIEZA 48H
    // ======================================

    function leerPedidosLocales() {
        try {
            const raw = localStorage.getItem(STORAGE_PEDIDOS);
            const parsed = JSON.parse(raw || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Error leyendo pedidos:", error);
            return [];
        }
    }

    function guardarPedidosLocales() {
        localStorage.setItem(STORAGE_PEDIDOS, JSON.stringify(pedidos));
    }

    function purgarDatosClientesAntiguos(mostrarAviso = false) {
        const ahora = Date.now();
        let limpiados = 0;

        pedidos = pedidos.map(pedido => {
            const creadaMs = new Date(pedido.creado_en || ahora).getTime();
            const supera48h = (ahora - creadaMs) >= MS_48_HORAS;

            if (supera48h && !pedido.datos_limpiados) {
                limpiados++;
                return {
                    ...pedido,
                    cliente: "Cliente eliminado (48h)",
                    telefono: "—",
                    ciudad: "—",
                    direccion: "Datos eliminados automáticamente tras 2 días",
                    nota: "",
                    datos_limpiados: true
                };
            }
            return pedido;
        });

        if (limpiados > 0) {
            guardarPedidosLocales();
        }

        if (mostrarAviso) {
            alert(
                limpiados > 0
                    ? `Se eliminaron los datos personales de ${limpiados} pedido(s) con más de 48 horas.`
                    : "No hay pedidos con más de 48 horas pendientes de limpieza."
            );
        }

        mostrarPedidos();
    }

    function poblarSelectProductosPedido() {
        const selectProd = document.getElementById("pedido-producto");
        if (!selectProd) return;

        selectProd.innerHTML = `
            <option value="">Seleccionar producto del catálogo</option>
            ${productos.map(p => `
                <option value="${escapar(p.id)}">
                    ${escapar(p.nombre)} (${formatearPrecio(p.precio_venta)} · Stock: ${Number(p.existencias) || 0})
                </option>
            `).join("")}
        `;
    }

    function mostrarPedidos() {
        if (!listaPedidosEl) return;

        const texto = (buscarPedido?.value || "").trim().toLowerCase();
        const estado = filtroEstadoPedido?.value || "";

        const filtrados = pedidos.filter(ped => {
            const coincideTexto =
                !texto ||
                String(ped.codigo || "").toLowerCase().includes(texto) ||
                String(ped.cliente || "").toLowerCase().includes(texto) ||
                String(ped.telefono || "").toLowerCase().includes(texto);

            const coincideEstado = !estado || ped.estado === estado;
            return coincideTexto && coincideEstado;
        });

        if (!filtrados.length) {
            listaPedidosEl.innerHTML = `
                <p class="mensaje-admin">
                    No hay pedidos registrados para mostrar.
                </p>
            `;
            return;
        }

        listaPedidosEl.innerHTML = filtrados.map(ped => {
            const itemsTexto = (ped.items || [])
                .map(i => `${escapar(i.nombre)} x${Number(i.cantidad) || 1}`)
                .join(", ");

            return `
                <article class="producto-admin-card pedido-card">
                    <div class="producto-admin-info
