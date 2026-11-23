
document.addEventListener("DOMContentLoaded", () => {
  cargarNovedades();
  actualizarContadorCarrito();
  configurarBusqueda();
});

// CARGAR PRODUCTOS PRÓXIMOS

async function cargarNovedades() {
  const galeria = document.getElementById("galeria-novedades");

  if (!window.skenziDB) {
    galeria.innerHTML = `
      <p class="mensaje-vacio">
        No se pudo conectar con la base de datos.
      </p>
    `;
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
      .eq("activo", true)
      .eq("es_novedad", true)
      .order("creado_en", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      galeria.innerHTML = `
        <p class="mensaje-vacio">
          Estamos preparando nuevas sorpresas para ti.
          <br>
          Muy pronto encontrarás aquí nuestros próximos productos.
        </p>
      `;
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
      </p>
    `;
  }
}

// CREAR TARJETA

function crearTarjetaNovedad(producto) {
  const nombre = escaparHTML(producto.nombre || "Producto");
  const descripcion = escaparHTML(
    producto.descripcion || "Próximamente en Skenzi Home."
  );

  const imagen = producto.imagen_url
    ? escaparHTML(producto.imagen_url)
    : "";

  const precio = Number(producto.precio_venta) > 0
    ? `<p class="precio-estimado">
         ${formatearPrecio(producto.precio_venta)}
       </p>`
    : "";

  return `
    <article class="tarjeta-novedad">

      ${
        imagen
          ? `<img
              class="imagen-novedad"
              src="${imagen}"
              alt="${nombre}"
              loading="lazy"
            >`
          : `<div class="imagen-novedad"></div>`
      }

      <div class="contenido-novedad">

        <span class="estado-novedad">PRÓXIMAMENTE</span>

        <h3>${nombre}</h3>

        <p class="descripcion-novedad">
          ${descripcion}
        </p>

        ${precio}

        <p class="fecha-llegada">
          Producto en camino
        </p>

        <button class="btn-aviso" type="button" disabled>
          Aviso de llegada próximamente
        </button>

      </div>
    </article>
  `;
}

// FORMATO DE PRECIO

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(valor);
}

// PROTEGER TEXTO HTML

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caracter]);
}

// CONTADOR DEL CARRITO

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

// BUSCADOR

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
