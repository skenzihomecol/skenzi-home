// ============================================
// SKENZI HOME - PANEL ADMINISTRATIVO
// Conexión con Supabase
// ============================================

const SUPABASE_URL = "https://xjqoforlmxmpykjynlsm.supabase.co";
const SUPABASE_KEY = "PEGA_AQUI_TU_CLAVE_PUBLICA_SB_PUBLISHABLE";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const login = document.getElementById("admin-login");
const panel = document.getElementById("admin-panel");
const formLogin = document.getElementById("form-login");
const mensajeLogin = document.getElementById("mensaje-login");
const mensajeAdmin = document.getElementById("mensaje-admin");

let usuarioAutenticado = false;

// ============================================
// UTILIDADES
// ============================================

function mostrarMensaje(elemento, texto, error = false) {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.style.color = error ? "#b42318" : "#455532";
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}

function dinero(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(valor) || 0);
}

function fecha(valor) {
  if (!valor) return "—";

  const fechaObjeto = new Date(valor);

  if (Number.isNaN(fechaObjeto.getTime())) {
    return escapar(valor);
  }

  return fechaObjeto.toLocaleDateString("es-CO");
}

function mostrarPanel(autenticado) {
  login.classList.toggle("admin-oculto", autenticado);
  panel.classList.toggle("admin-oculto", !autenticado);
}

function prepararTabla(encabezados, filas) {
  if (!filas.length) {
    return "<p>No hay registros para mostrar.</p>";
  }

  return `
    <div style="overflow-x:auto">
      <table class="admin-tabla">
        <thead>
          <tr>${encabezados.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${filas.join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function consultar(tabla, columnas = "*") {
  const { data, error } = await supabaseClient
    .from(tabla)
    .select(columnas);

  if (error) throw error;

  return data || [];
}

function mostrarError(id, error) {
  console.error("Error en " + id, error);

  const contenedor = document.getElementById(id);

  if (contenedor) {
    contenedor.innerHTML = `
      <p style="color:#b42318">
        No se pudieron cargar los datos.
        Revisa los permisos de Supabase.
      </p>
    `;
  }
}

// ============================================
// PRODUCTOS
// ============================================

async function cargarProductos() {
  const contenedor = document.getElementById("lista-productos");
  contenedor.textContent = "Cargando productos...";

  try {
    const productos = await consultar(
      "productos",
      "id,codigo_barras,sku,nombre,categoria_id,costo_compra,precio_venta,existencias,stock_minimo,proveedor,activo"
    );

    const filas = productos.map(p => `
      <tr>
        <td>${escapar(p.sku || p.codigo_barras || "—")}</td>
        <td>${escapar(p.nombre)}</td>
        <td>${dinero(p.costo_compra)}</td>
        <td>${dinero(p.precio_venta)}</td>
        <td>${Number(p.existencias || 0)}</td>
        <td>${p.activo ? "Activo" : "Inactivo"}</td>
      </tr>
    `);

    contenedor.innerHTML = prepararTabla(
      ["SKU / Código", "Producto", "Costo", "Precio", "Existencias", "Estado"],
      filas
    );

  } catch (error) {
    mostrarError("lista-productos", error);
  }
}

// ============================================
// INVENTARIO
// ============================================

async function cargarInventario() {
  const contenedor = document.getElementById("lista-inventario");
  contenedor.textContent = "Cargando inventario...";

  try {
    const [productos, movimientos] = await Promise.all([
      consultar(
        "productos",
        "id,nombre,existencias,stock_minimo,activo"
      ),
      consultar(
        "movimientos_inventario",
        "id,producto_id,tipo,cantidad,motivo,venta_id,fecha"
      )
    ]);

    const mapaProductos = new Map(
      productos.map(p => [p.id, p.nombre])
    );

    const alertas = productos.filter(p =>
      p.activo && Number(p.existencias || 0) <= Number(p.stock_minimo || 0)
    );

    const filas = movimientos
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .map(m => `
        <tr>
          <td>${fecha(m.fecha)}</td>
          <td>${escapar(mapaProductos.get(m.producto_id) || "Producto no encontrado")}</td>
          <td>${escapar(m.tipo)}</td>
          <td>${Number(m.cantidad || 0)}</td>
          <td>${escapar(m.motivo || "—")}</td>
        </tr>
      `);

    contenedor.innerHTML = `
      <h3>Productos con stock bajo: ${alertas.length}</h3>
      ${alertas.length
        ? `<ul>${alertas.map(p =>
            `<li>${escapar(p.nombre)}: ${Number(p.existencias || 0)} unidades</li>`
          ).join("")}</ul>`
        : "<p>No hay alertas de stock bajo.</p>"
      }
      <h3>Movimientos registrados</h3>
      ${prepararTabla(
        ["Fecha", "Producto", "Tipo", "Cantidad", "Motivo"],
        filas
      )}
    `;

  } catch (error) {
    mostrarError("lista-inventario", error);
  }
}

// ============================================
// VENTAS Y PEDIDOS
// ============================================

async function cargarVentas() {
  const contenedor = document.getElementById("lista-ventas");
  contenedor.textContent = "Cargando ventas y pedidos...";

  try {
    const ventas = await consultar(
      "ventas",
      "id,numero_venta,fecha,canal,cliente_nombre,cliente_telefono,cliente_direccion,metodo_pago,estado_pago,estado_pedido,costo_envio,notas"
    );

    const filas = ventas
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .map(v => `
        <tr>
          <td>${escapar(v.numero_venta ?? v.id)}</td>
          <td>${fecha(v.fecha)}</td>
          <td>${escapar(v.cliente_nombre || "Sin nombre")}</td>
          <td>${escapar(v.cliente_telefono || "—")}</td>
          <td>${escapar(v.estado_pedido || "Pendiente")}</td>
          <td>${escapar(v.estado_pago || "Pendiente")}</td>
          <td>
            <button class="admin-boton" type="button"
              onclick="imprimirComprobante('${v.id}')">
              Recibo
            </button>
            <button class="admin-boton" type="button"
              onclick="imprimirRotulo('${v.id}')">
              Rótulo
            </button>
          </td>
        </tr>
      `);

    contenedor.innerHTML = prepararTabla(
      ["N.º", "Fecha", "Cliente", "Teléfono", "Estado del pedido", "Estado del pago", "Imprimir"],
      filas
    );

  } catch (error) {
    mostrarError("lista-ventas", error);
  }
}

// ============================================
// IMPRIMIR RECIBO
// ============================================

async function imprimirComprobante(ventaId) {
  try {
    const { data: venta, error } = await supabaseClient
      .from("ventas")
      .select("*")
      .eq("id", ventaId)
      .single();

    if (error) throw error;

    const detalles = await consultar("detalles_venta");

    const productosVenta = detalles.filter(
      d => d.venta_id === ventaId
    );

    const subtotal = productosVenta.reduce(
      (total, d) =>
        total + Number(d.cantidad || 0) * Number(d.precio_unitario || 0),
      0
    );

    const envio = Number(venta.costo_envio || 0);
    const total = subtotal + envio;

    const lineas = productosVenta.map(d => `
      <tr>
        <td>${escapar(d.nombre_producto)}</td>
        <td>${Number(d.cantidad || 0)}</td>
        <td>${dinero(d.precio_unitario)}</td>
        <td>${dinero(Number(d.cantidad || 0) * Number(d.precio_unitario || 0))}</td>
      </tr>
    `).join("");

    const ventana = window.open("", "_blank");

    if (!ventana) {
      alert("El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para esta página.");
      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Recibo Skenzi Home</title>
        <style>
          body{font-family:Arial,sans-serif;max-width:760px;margin:30px auto;padding:20px;color:#222}
          h1{color:#555b35}
          table{width:100%;border-collapse:collapse;margin-top:20px}
          th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}
          .total{text-align:right;margin-top:20px;line-height:1.8}
          @media print{button{display:none}}
        </style>
      </head>
      <body>
        <h1>Skenzi Home</h1>
        <h2>Recibo de venta</h2>
        <p><b>Número:</b> ${escapar(venta.numero_venta ?? venta.id)}</p>
        <p><b>Fecha:</b> ${fecha(venta.fecha)}</p>
        <p><b>Cliente:</b> ${escapar(venta.cliente_nombre || "—")}</p>
        <p><b>Teléfono:</b> ${escapar(venta.cliente_telefono || "—")}</p>
        <p><b>Dirección:</b> ${escapar(venta.cliente_direccion || "—")}</p>
        <table>
          <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
          <tbody>${lineas}</tbody>
        </table>
        <div class="total">
          <p>Subtotal: ${dinero(subtotal)}</p>
          <p>Envío: ${dinero(envio)}</p>
          <h2>Total: ${dinero(total)}</h2>
        </div>
        <p>Estado del pedido: ${escapar(venta.estado_pedido || "Pendiente")}</p>
        <p>Estado del pago: ${escapar(venta.estado_pago || "Pendiente")}</p>
        <p>Gracias por comprar en Skenzi Home.</p>
        <button onclick="window.print()">Imprimir recibo</button>
      </body>
      </html>
    `);

    ventana.document.close();

  } catch (error) {
    console.error(error);
    alert("No se pudo generar el recibo. Comprueba que la venta y sus detalles estén registrados.");
  }
}

// ============================================
// IMPRIMIR RÓTULO DE ENVÍO
// ============================================

async function imprimirRotulo(ventaId) {
  try {
    const { data: venta, error } = await supabaseClient
      .from("ventas")
      .select("*")
      .eq("id", ventaId)
      .single();

    if (error) throw error;

    const ventana = window.open("", "_blank");

    if (!ventana) {
      alert("Permite las ventanas emergentes para imprimir el rótulo.");
      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Rótulo Skenzi Home</title>
        <style>
          body{font-family:Arial,sans-serif;margin:20px}
          .rotulo{border:2px solid #222;padding:24px;max-width:500px}
          h1{margin-top:0;color:#555b35}
          .dato{margin:14px 0;font-size:17px}
          @media print{button{display:none}}
        </style>
      </head>
      <body>
        <div class="rotulo">
          <h1>SKENZI HOME</h1>
          <h2>DATOS DEL DESTINATARIO</h2>
          <div class="dato"><b>Pedido:</b> ${escapar(venta.numero_venta ?? venta.id)}</div>
          <div class="dato"><b>Cliente:</b> ${escapar(venta.cliente_nombre || "—")}</div>
          <div class="dato"><b>Teléfono:</b> ${escapar(venta.cliente_telefono || "—")}</div>
          <div class="dato"><b>Dirección:</b> ${escapar(venta.cliente_direccion || "—")}</div>
          <div class="dato"><b>Pago:</b> ${escapar(venta.metodo_pago || "Por confirmar")}</div>
          <div class="dato"><b>Estado:</b> ${escapar(venta.estado_pedido || "Pendiente")}</div>
        </div>
        <p><button onclick="window.print()">Imprimir rótulo</button></p>
      </body>
      </html>
    `);

    ventana.document.close();

  } catch (error) {
    console.error(error);
    alert("No se pudo generar el rótulo de este pedido.");
  }
}

// Permite que los botones de la tabla accedan a estas funciones.
window.imprimirComprobante = imprimirComprobante;
window.imprimirRotulo = imprimirRotulo;

// ============================================
// GASTOS
// ============================================

async function cargarGastos() {
  const contenedor = document.getElementById("lista-gastos");
  contenedor.textContent = "Cargando gastos...";

  try {
    const gastos = await consultar(
      "gastos",
      "id,concepto,categoria,valor,fecha,metodo_pago,notas"
    );

    const filas = gastos
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .map(g => `
        <tr>
          <td>${fecha(g.fecha)}</td>
          <td>${escapar(g.concepto)}</td>
          <td>${escapar(g.categoria || "—")}</td>
          <td>${dinero(g.valor)}</td>
          <td>${escapar(g.metodo_pago || "—")}</td>
          <td>${escapar(g.notas || "—")}</td>
        </tr>
      `);

    const total = gastos.reduce(
      (suma, g) => suma + Number(g.valor || 0),
      0
    );

    contenedor.innerHTML = `
      <h3>Total de gastos registrados: ${dinero(total)}</h3>
      ${prepararTabla(
        ["Fecha", "Concepto", "Categoría", "Valor", "Método de pago", "Notas"],
        filas
      )}
    `;

  } catch (error) {
    mostrarError("lista-gastos", error);
  }
}

// ============================================
// INFORMES
// ============================================

async function cargarInformes() {
  const contenedor = document.getElementById("lista-informes");
  contenedor.textContent = "Calculando informes...";

  try {
    const [ventas, gastos, productos] = await Promise.all([
      consultar("ventas", "id,fecha,estado_pedido,estado_pago"),
      consultar("gastos", "valor,fecha"),
      consultar("productos", "id,nombre,existencias,stock_minimo,activo")
    ]);

    const totalGastos = gastos.reduce(
      (suma, g) => suma + Number(g.valor || 0),
      0
    );

    const pedidosPendientes = ventas.filter(v =>
      String(v.estado_pedido || "").toLowerCase().includes("pendiente")
    ).length;

    const stockBajo = productos.filter(p =>
      p.activo && Number(p.existencias || 0) <= Number(p.stock_minimo || 0)
    );

    contenedor.innerHTML = `
      <div class="admin-tarjetas">
        <article class="admin-tarjeta">
          <h3>Ventas registradas</h3>
          <div class="admin-valor">${ventas.length}</div>
        </article>
        <article class="admin-tarjeta">
          <h3>Gastos acumulados</h3>
          <div class="admin-valor">${dinero(totalGastos)}</div>
        </article>
        <article class="admin-tarjeta">
          <h3>Pedidos pendientes</h3>
          <div class="admin-valor">${pedidosPendientes}</div>
        </article>
        <article class="admin-tarjeta">
          <h3>Productos con stock bajo</h3>
          <div class="admin-valor">${stockBajo.length}</div>
        </article>
      </div>
      <h3>Productos que requieren revisión</h3>
      ${stockBajo.length
        ? `<ul>${stockBajo.map(p =>
            `<li>${escapar(p.nombre)}: ${Number(p.existencias || 0)} unidades; mínimo ${Number(p.stock_minimo || 0)}</li>`
          ).join("")}</ul>`
        : "<p>No hay productos con stock bajo.</p>"
      }
      <p>Estos informes utilizan los registros existentes. Las ganancias requieren calcular los costos de los productos vendidos.</p>
    `;

  } catch (error) {
    mostrarError("lista-informes", error);
  }
}

// ============================================
// ACTUALIZAR RESUMEN
// ============================================

async function contarRegistros(tabla) {
  const { count, error } = await supabaseClient
    .from(tabla)
    .select("*", { count: "exact", head: true });

  if (error) throw error;

  return count || 0;
}

async function cargarResumen() {
  try {
    const [productos, ventas, gastos] = await Promise.all([
      consultar("productos", "existencias,activo"),
      contarRegistros("ventas"),
      contarRegistros("gastos")
    ]);

    const activos = productos.filter(p => p.activo);

    const unidades = activos.reduce(
      (suma, p) => suma + Number(p.existencias || 0),
      0
    );

    document.getElementById("total-productos").textContent = activos.length;
    document.getElementById("total-existencias").textContent = unidades;
    document.getElementById("total-ventas").textContent = ventas;
    document.getElementById("total-gastos").textContent = gastos;

    mostrarMensaje(mensajeAdmin, "Resumen actualizado correctamente.");

  } catch (error) {
    console.error("Error en resumen:", error);

    mostrarMensaje(
      mensajeAdmin,
      "No se pudieron cargar todos los datos. Revisa la consola del navegador.",
      true
    );
  }
}

// ============================================
// CARGAR SECCIÓN SELECCIONADA
// ============================================

async function cargarSeccion(nombre) {
  if (!usuarioAutenticado) return;

  const acciones = {
    productos: cargarProductos,
    inventario: cargarInventario,
    ventas: cargarVentas,
    gastos: cargarGastos,
    informes: cargarInformes
  };

  if (acciones[nombre]) {
    await acciones[nombre]();
  }
}

document.querySelectorAll("[data-seccion]").forEach(boton => {
  boton.addEventListener("click", async () => {
    const destino = boton.dataset.seccion;

    document.querySelectorAll('[id^="seccion-"]').forEach(seccion => {
      seccion.classList.add("admin-oculto");
    });

    const activa = document.getElementById(`seccion-${destino}`);

    if (activa) {
      activa.classList.remove("admin-oculto");
    }

    await cargarSeccion(destino);
  });
});

// ============================================
// INICIAR SESIÓN
// ============================================

formLogin.addEventListener("submit", async evento => {
  evento.preventDefault();

  const email = document.getElementById("correo-admin").value.trim();
  const password = document.getElementById("clave-admin").value;
  const boton = formLogin.querySelector('button[type="submit"]');

  boton.disabled = true;
  mostrarMensaje(mensajeLogin, "Verificando acceso...");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (!data.session) {
      throw new Error("No se pudo establecer la sesión.");
    }

    usuarioAutenticado = true;
    mostrarPanel(true);
    formLogin.reset();

    await cargarResumen();
    mostrarMensaje(mensajeAdmin, "Sesión iniciada correctamente.");

  } catch (error) {
    mostrarMensaje(
      mensajeLogin,
      error.message || "No fue posible iniciar sesión.",
      true
    );
  } finally {
    boton.disabled = false;
  }
});

// ============================================
// CERRAR SESIÓN
// ============================================

document.getElementById("cerrar-sesion").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    mostrarMensaje(mensajeAdmin, error.message, true);
    return;
  }

  usuarioAutenticado = false;
  mostrarPanel(false);
  mostrarMensaje(mensajeLogin, "Sesión cerrada correctamente.");
});

// ============================================
// COMPROBAR SESIÓN EXISTENTE
// ============================================

async function comprobarSesion() {
  mostrarPanel(false);

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    mostrarMensaje(mensajeLogin, "No se pudo comprobar la sesión.", true);
    return;
  }

  if (data.session) {
    usuarioAutenticado = true;
    mostrarPanel(true);
    await cargarResumen();
  }
}

comprobarSesion();
