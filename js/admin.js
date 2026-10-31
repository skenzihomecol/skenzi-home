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
  if (login) login.classList.toggle("admin-oculto", autenticado);
  if (panel) panel.classList.toggle("admin-oculto", !autenticado);
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
        No se pudieron cargar los datos. Revisa los permisos de Supabase.
      </p>
    `;
  }
}

// ============================================
// PRODUCTOS - ADMINISTRACIÓN COMPLETA
// ============================================

async function cargarProductos() {
  const contenedor = document.getElementById("lista-productos");
  if (!contenedor) return;

  contenedor.innerHTML = `
    <h3>Agregar producto</h3>

    <form id="form-producto" class="admin-form-producto">
      <input type="hidden" id="producto-id">

      <label for="producto-nombre">Nombre del producto *</label>
      <input class="admin-campo" id="producto-nombre" required>

      <label for="producto-descripcion">Descripción</label>
      <textarea class="admin-campo" id="producto-descripcion" rows="3"></textarea>

      <label for="producto-categoria">Categoría *</label>
      <select class="admin-campo" id="producto-categoria" required>
        <option value="">Cargando categorías...</option>
      </select>

      <label for="producto-sku">SKU</label>
      <input class="admin-campo" id="producto-sku">

      <label for="producto-codigo">Código de barras</label>
      <input class="admin-campo" id="producto-codigo">

      <label for="producto-costo">Costo de compra (COP) *</label>
      <input class="admin-campo" id="producto-costo" type="number" min="0" step="1" required>

      <label for="producto-precio">Precio de venta (COP) *</label>
      <input class="admin-campo" id="producto-precio" type="number" min="0" step="1" required>

      <label for="producto-existencias">Existencias iniciales *</label>
      <input class="admin-campo" id="producto-existencias" type="number" min="0" step="1" required>

      <label for="producto-stock-minimo">Stock mínimo</label>
      <input class="admin-campo" id="producto-stock-minimo" type="number" min="0" step="1" value="2">

      <label for="producto-proveedor">Proveedor</label>
      <input class="admin-campo" id="producto-proveedor">

      <label for="producto-imagen">Fotografía del producto</label>
      <input class="admin-campo" id="producto-imagen" type="file" accept="image/*">

      <img id="producto-vista-previa" alt="Vista previa" style="display:none;max-width:220px;max-height:220px;object-fit:contain;border-radius:10px;margin:10px 0;">

      <label><input type="checkbox" id="producto-novedad"> Marcar como novedad</label><br><br>
      <label><input type="checkbox" id="producto-destacado"> Producto destacado</label><br><br>
      <label><input type="checkbox" id="producto-oferta"> Producto en oferta</label><br><br>

      <button class="admin-boton" type="submit">Guardar producto</button>
      <button class="admin-boton" type="button" id="cancelar-edicion" style="display:none;">Cancelar edición</button>

      <p id="mensaje-producto" role="status"></p>
    </form>

    <hr style="margin:30px 0;">
    <h3>Productos registrados</h3>
    <div id="tabla-productos">Cargando productos...</div>
  `;

  const formulario = document.getElementById("form-producto");
  const selectorCategoria = document.getElementById("producto-categoria");
  const archivoImagen = document.getElementById("producto-imagen");
  const vistaPrevia = document.getElementById("producto-vista-previa");
  const mensaje = document.getElementById("mensaje-producto");
  const botonCancelar = document.getElementById("cancelar-edicion");

  let productosActuales = [];
  let imagenActual = "";
  let imagenSeleccionada = null;

  // Cargar categorías dinámicamente desde Supabase
  try {
    const categorias = await consultar("categorias", "id,nombre,activa");
    const categoriasActivas = (categorias || []).sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));

    selectorCategoria.innerHTML = '<option value="">Selecciona una categoría</option>';
    categoriasActivas.forEach(cat => {
      const opcion = document.createElement("option");
      opcion.value = cat.id;
      opcion.textContent = cat.nombre;
      selectorCategoria.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar categorías:", error);
    selectorCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
  }

  // Vista previa de la imagen
  if (archivoImagen) {
    archivoImagen.addEventListener("change", () => {
      imagenSeleccionada = archivoImagen.files?.[0] || null;
      if (!imagenSeleccionada) {
        vistaPrevia.style.display = imagenActual ? "block" : "none";
        vistaPrevia.src = imagenActual;
        return;
      }
      vistaPrevia.src = URL.createObjectURL(imagenSeleccionada);
      vistaPrevia.style.display = "block";
    });
  }

  async function actualizarLista() {
    const tabla = document.getElementById("tabla-productos");
    if (!tabla) return;
    tabla.textContent = "Cargando productos...";

    try {
      productosActuales = await consultar(
        "productos",
        "id,codigo_barras,sku,nombre,descripcion,categoria_id,costo_compra,precio_venta,existencias,stock_minimo,proveedor,imagen_url,es_novedad,es_destacado,en_oferta,activo"
      );

      if (!productosActuales.length) {
        tabla.innerHTML = "<p>Aún no hay productos registrados.</p>";
        return;
      }

      tabla.innerHTML = `
        <div style="overflow-x:auto">
          <table class="admin-tabla">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Existencias</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${productosActuales.map(p => `
                <tr>
                  <td>
                    ${p.imagen_url ? `<img src="${escapar(p.imagen_url)}" style="width:50px;height:50px;object-fit:contain;">` : "Sin foto"}
                  </td>
                  <td>${escapar(p.nombre)}</td>
                  <td>${dinero(p.precio_venta)}</td>
                  <td>${Number(p.existencias || 0)}</td>
                  <td>${p.activo ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button type="button" class="admin-boton" data-editar-producto="${escapar(p.id)}">Editar</button>
                    <button type="button" class="admin-boton" data-eliminar-producto="${escapar(p.id)}">Desactivar</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      // Editar producto
      tabla.querySelectorAll("[data-editar-producto]").forEach(boton => {
        boton.addEventListener("click", () => {
          const producto = productosActuales.find(p => String(p.id) === String(boton.dataset.editarProducto));
          if (!producto) return;

          document.getElementById("producto-id").value = producto.id;
          document.getElementById("producto-nombre").value = producto.nombre || "";
          document.getElementById("producto-descripcion").value = producto.descripcion || "";
          selectorCategoria.value = producto.categoria_id || "";
          document.getElementById("producto-sku").value = producto.sku || "";
          document.getElementById("producto-codigo").value = producto.codigo_barras || "";
          document.getElementById("producto-costo").value = producto.costo_compra ?? 0;
          document.getElementById("producto-precio").value = producto.precio_venta ?? 0;
          document.getElementById("producto-existencias").value = producto.existencias ?? 0;
          document.getElementById("producto-stock-minimo").value = producto.stock_minimo ?? 0;
          document.getElementById("producto-proveedor").value = producto.proveedor || "";
          document.getElementById("producto-novedad").checked = !!producto.es_novedad;
          document.getElementById("producto-destacado").checked = !!producto.es_destacado;
          document.getElementById("producto-oferta").checked = !!producto.en_oferta;

          imagenActual = producto.imagen_url || "";
          imagenSeleccionada = null;
          vistaPrevia.src = imagenActual;
          vistaPrevia.style.display = imagenActual ? "block" : "none";

          botonCancelar.style.display = "inline-block";
          formulario.querySelector('[type="submit"]').textContent = "Guardar cambios";
          formulario.scrollIntoView({ behavior: "smooth" });
        });
      });

      // Eliminar / Desactivar producto
      tabla.querySelectorAll("[data-eliminar-producto]").forEach(boton => {
        boton.addEventListener("click", async () => {
          const producto = productosActuales.find(p => String(p.id) === String(boton.dataset.eliminarProducto));
          if (!producto ||
