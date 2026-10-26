
// ============================================
// SKENZI HOME - PANEL ADMINISTRATIVO
// Conexión con Supabase
// ============================================

const SUPABASE_URL = "https://xjqoforlmxmpykjynlsm.supabase.co";
const SUPABASE_KEY = "sb_publishable_ovZCy27ft6esmpYC2PSLSQ_AOpFH0Zv";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const login = document.getElementById("admin-login");
const panel = document.getElementById("admin-panel");
const formLogin = document.getElementById("form-login");
const mensajeLogin = document.getElementById("mensaje-login");
const mensajeAdmin = document.getElementById("mensaje-admin");

// --------------------------------------------
// MOSTRAR MENSAJES
// --------------------------------------------

function mostrarMensaje(elemento, mensaje, error = false) {
  elemento.textContent = mensaje;
  elemento.style.color = error ? "#b42318" : "#455532";
}

// --------------------------------------------
// MOSTRAR U OCULTAR EL PANEL
// --------------------------------------------

function mostrarPanel(autenticado) {
  login.classList.toggle("admin-oculto", autenticado);
  panel.classList.toggle("admin-oculto", !autenticado);
}

// --------------------------------------------
// INICIAR SESIÓN
// --------------------------------------------

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email = document
    .getElementById("correo-admin")
    .value.trim();

  const password = document
    .getElementById("clave-admin")
    .value;

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

    mostrarPanel(true);
    formLogin.reset();

    mostrarMensaje(
      mensajeAdmin,
      "Sesión iniciada. Comprobando el acceso a los datos..."
    );

    await cargarResumen();

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

// --------------------------------------------
// CERRAR SESIÓN
// --------------------------------------------

document
  .getElementById("cerrar-sesion")
  .addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      mostrarMensaje(mensajeAdmin, error.message, true);
      return;
    }

    mostrarPanel(false);
    mostrarMensaje(mensajeLogin, "Sesión cerrada correctamente.");
  });

// --------------------------------------------
// NAVEGACIÓN ENTRE SECCIONES
// --------------------------------------------

document.querySelectorAll("[data-seccion]").forEach((boton) => {
  boton.addEventListener("click", () => {
    const destino = boton.dataset.seccion;

    document.querySelectorAll('[id^="seccion-"]').forEach((seccion) => {
      seccion.classList.add("admin-oculto");
    });

    const seccionActiva = document.getElementById(
      `seccion-${destino}`
    );

    if (seccionActiva) {
      seccionActiva.classList.remove("admin-oculto");
    }
  });
});

// --------------------------------------------
// CONSULTAR RESUMEN DEL NEGOCIO
// --------------------------------------------

async function contarRegistros(tabla, columna = "id") {
  const { count, error } = await supabaseClient
    .from(tabla)
    .select(columna, { count: "exact", head: true });

  if (error) throw error;

  return count ?? 0;
}

async function cargarResumen() {
  try {
    const { data: productos, error: errorProductos } =
      await supabaseClient
        .from("productos")
        .select("existencias")
        .eq("activo", true);

    if (errorProductos) throw errorProductos;

    const unidades = (productos || []).reduce(
      (total, producto) => total + Number(producto.existencias || 0),
      0
    );

    const totalVentas = await contarRegistros("ventas");
    const totalGastos = await contarRegistros("gastos");

    document.getElementById("total-productos").textContent =
      productos.length;

    document.getElementById("total-existencias").textContent =
      unidades;

    document.getElementById("total-ventas").textContent =
      totalVentas;

    document.getElementById("total-gastos").textContent =
      totalGastos;

    mostrarMensaje(
      mensajeAdmin,
      "Resumen actualizado correctamente."
    );

  } catch (error) {
    console.error("Error al cargar el resumen:", error);

    mostrarMensaje(
      mensajeAdmin,
      "El inicio de sesión puede funcionar, pero todavía falta configurar o verificar los permisos de lectura de las tablas. No se modificaron datos.",
      true
    );
  }
}

// --------------------------------------------
// COMPROBAR SESIÓN AL ABRIR LA PÁGINA
// --------------------------------------------

async function comprobarSesion() {
  mostrarPanel(false);

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    mostrarMensaje(
      mensajeLogin,
      "No se pudo comprobar la sesión. Intenta de nuevo.",
      true
    );
    return;
  }

  if (data.session) {
    mostrarPanel(true);
    await cargarResumen();
  }
}

comprobarSesion();
