
"use strict";

// ==========================================
// SKENZI HOME — NOVEDADES Y REGISTRO DE AVISOS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  cargarNovedades();
  actualizarContadorCarrito();
  configurarBusqueda();
  crearModalAviso();
});

// ==========================================
// CARGAR PRODUCTOS PRÓXIMOS
// ==========================================

async function cargarNovedades() {
  const galeria = document.getElementById("galeria-novedades");

  if (!galeria) return;

  if (!window.skenziDB) {
    galeria.innerHTML = `
      <p class="mensaje-vacio">
        No se pudo conectar con la base de datos.
      </p>`;
    return;
  }

  try {
    const { data, error } = await window.skenziDB
      .from("productos")
      .select(`
        id,
        nombre,
        descripcion,
        precio_venta,
        imagen_url,
        imagenes_adicionales,
        es_novedad,
        activo,
        creado_en
      `)
      .eq("es_novedad", true)
      .order("creado_en", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      galeria.innerHTML = `
        <p class="mensaje-vacio">
          Estamos preparando nuevas sorpresas para ti.
          Muy pronto encontrarás aquí nuestros próximos productos.
        </p>`;
      return;
    }

    galeria.innerHTML = data
      .map(producto => crearTarjetaNovedad(producto))
      .join("");

  } catch (error) {
    console.error("Error al cargar novedades:", error);

    galeria.innerHTML = `
      <p class="mensaje-vacio">
        No fue posible cargar los productos.
        Intenta nuevamente más tarde.
      </p>`;
  }
}

// ==========================================
// CREAR TARJETA
// ==========================================

function crearTarjetaNovedad(producto) {
  const id = escaparHTML(producto.id);
  const nombre = escaparHTML(producto.nombre || "Producto");
  const descripcion = escaparHTML(
    producto.descripcion || "Próximamente en Skenzi Home."
  );

  const imagen = producto.imagen_url
    ? escaparHTML(producto.imagen_url)
    : "";

  const precio = Number(producto.precio_venta) > 0
    ? `<p class="precio-estimado">${formatearPrecio(producto.precio_venta)}</p>`
    : "";

  return `
    <article class="tarjeta-novedad">

      ${
        imagen
          ? `<img class="imagen-novedad"
              src="${imagen}"
              alt="${nombre}"
              loading="lazy">`
          : `<div class="imagen-novedad"></div>`
      }

      <div class="contenido-novedad">

        <span class="estado-novedad">PRÓXIMAMENTE</span>

        <h3>${nombre}</h3>

        <p class="descripcion-novedad">${descripcion}</p>

        ${precio}

        <p class="fecha-llegada">Producto en camino</p>

        <button
          class="btn-aviso"
          type="button"
          data-aviso-id="${id}"
          data-aviso-nombre="${nombre}">
          Avísame cuando llegue
        </button>

      </div>
    </article>
  `;
}

// ==========================================
// CREAR FORMULARIO
// ==========================================

function crearModalAviso() {
  if (document.getElementById("modal-aviso")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-aviso" id="modal-aviso" hidden>

      <div class="contenido-modal-aviso">

        <button
          type="button"
          class="cerrar-modal-aviso"
          id="cerrar-modal-aviso"
          aria-label="Cerrar formulario">
          ×
        </button>

        <span class="etiqueta-modal-aviso">SKENZI HOME</span>

        <h2>¡Te avisaremos!</h2>

        <p id="nombre-producto-aviso">
          Déjanos tus datos para avisarte cuando llegue el producto.
        </p>

        <form id="formulario-aviso">

          <label for="nombre-cliente-aviso">
            Tu nombre
          </label>

          <input
            type="text"
            id="nombre-cliente-aviso"
            maxlength="100"
            placeholder="Escribe tu nombre"
            required>

          <label for="whatsapp-cliente-aviso">
            Número de WhatsApp
          </label>

          <input
            type="tel"
            id="whatsapp-cliente-aviso"
            maxlength="20"
            placeholder="Ej. 3001234567"
            required>

          <label class="aceptacion-aviso">
            <input
              type="checkbox"
              id="acepta-aviso"
              required>

            <span>
              Acepto que Skenzi Home utilice mi nombre y número
              de WhatsApp para contactarme e informarme cuando
              este producto esté disponible.
            </span>
          </label>

          <p class="mensaje-formulario-aviso"
             id="mensaje-formulario-aviso"
             aria-live="polite"></p>

          <button
            type="submit"
            class="btn-registrar-aviso"
            id="btn-registrar-aviso">
            Registrar mi interés
          </button>

        </form>

      </div>
    </div>
  `);

  document.getElementById("cerrar-modal-aviso")
    .addEventListener("click", cerrarModalAviso);

  document.getElementById("modal-aviso")
    .addEventListener("click", evento => {
      if (evento.target.id === "modal-aviso") {
        cerrarModalAviso();
      }
    });

  document.getElementById("formulario-aviso")
    .addEventListener("submit", registrarAviso);

  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") cerrarModalAviso();
  });
}

// ==========================================
// ABRIR FORMULARIO
// ==========================================

function abrirModalAviso(id, nombre) {
  const modal = document.getElementById("modal-aviso");

  document.getElementById("nombre-producto-aviso").textContent =
    `Déjanos tus datos para avisarte cuando "${nombre}" esté disponible.`;

  document.getElementById("formulario-aviso").reset();

  document.getElementById("mensaje-formulario-aviso").textContent = "";

  document.getElementById("formulario-aviso").dataset.productoId = id;
  document.getElementById("formulario-aviso").dataset.productoNombre = nombre;

  modal.hidden = false;
  document.body.classList.add("modal-aviso-abierto");

  document.getElementById("nombre-cliente-aviso").focus();
}

// ==========================================
// CERRAR FORMULARIO
// ==========================================

function cerrarModalAviso() {
  const modal = document.getElementById("modal-aviso");

  if (modal) modal.hidden = true;

  document.body.classList.remove("modal-aviso-abierto");
}

// ==========================================
// REGISTRAR SOLICITUD EN SUPABASE
// ==========================================

async function registrarAviso(evento) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const boton = document.getElementById("btn-registrar-aviso");
  const mensaje = document.getElementById("mensaje-formulario-aviso");

  const nombre = document
    .getElementById("nombre-cliente-aviso")
    .value.trim();

  const whatsappOriginal = document
    .getElementById("whatsapp-cliente-aviso")
    .value.trim();

  const whatsapp = whatsappOriginal.replace(/[^\d+]/g, "");

  const acepta = document.getElementById("acepta-aviso").checked;

  const productoId = formulario.dataset.productoId;
  const productoNombre = formulario.dataset.productoNombre;

  if (!nombre || !whatsapp || !productoId || !productoNombre) {
    mensaje.textContent = "Completa todos los campos.";
    return;
  }

  const digitos = whatsapp.replace(/\D/g, "");

  if (digitos.length < 10 || digitos.length > 13) {
    mensaje.textContent = "Escribe un número de WhatsApp válido.";
    return;
  }

  if (!acepta) {
    mensaje.textContent = "Debes aceptar la autorización para continuar.";
    return;
  }

  if (!window.skenziDB) {
    mensaje.textContent = "No hay conexión con la base de datos.";
    return;
  }

  boton.disabled = true;
  boton.textContent = "Registrando...";

  mensaje.textContent = "";

  try {
    const { error } = await window.skenziDB
      .from("solicitudes_aviso")
      .insert([{
        producto_id: String(productoId),
        producto_nombre: productoNombre,
        nombre_cliente: nombre,
        whatsapp: whatsapp,
        acepta_contacto: true
      }]);

    if (error) throw error;

    mensaje.textContent =
      "¡Registro exitoso! Te avisaremos cuando esté disponible.";

    mensaje.classList.add("exito-aviso");

    formulario.reset();

    setTimeout(() => {
      cerrarModalAviso();
      mensaje.classList.remove("exito-aviso");
    }, 2500);

  } catch (error) {
    console.error("Error registrando aviso:", error);

    mensaje.textContent =
      "No se pudo registrar. Intenta nuevamente.";

  } finally {
    boton.disabled = false;
    boton.textContent = "Registrar mi interés";
  }
}

// ==========================================
// EVENTOS DE BOTONES
// ==========================================

document.addEventListener("click", evento => {
  const boton = evento.target.closest("[data-aviso-id]");

  if (!boton) return;

  abrirModalAviso(
    boton.dataset.avisoId,
    boton.dataset.avisoNombre
  );
});

// ==========================================
// FORMATO DE PRECIO
// ==========================================

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(valor);
}

// ==========================================
// PROTEGER TEXTO HTML
// ==========================================

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}

// ==========================================
// CONTADOR DEL CARRITO
// ==========================================

function actualizarContadorCarrito() {
  const contador = document.getElementById("contador-carrito");

  if (!contador) return;

  try {
    const carrito = JSON.parse(
      localStorage.getItem("skenzi_carrito") || "[]"
    );

    contador.textContent = carrito.reduce(
      (total, producto) =>
        total + (Number(producto.cantidad) || 0),
      0
    );

  } catch {
    contador.textContent = "0";
  }
}

// ==========================================
// BUSCADOR
// ==========================================

function configurarBusqueda() {
  const formulario = document.getElementById("form-busqueda");
  const campo = document.getElementById("buscar-producto");

  if (!formulario || !campo) return;

  formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const busqueda = campo.value.trim();

    if (busqueda) {
      window.location.href =
        `index.html?buscar=${encodeURIComponent(busqueda)}`;
    }
  });
}
