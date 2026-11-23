
// ==========================================
// MOSTRAR GALERÍA DE HOGAR
// PRODUCTOS + TARJETAS ESPECIALES
// ==========================================

function mostrarHogar() {

    const galeria = document.getElementById("galeria-hogar");

    const titulo = document.getElementById("titulo-catalogo-hogar");

    if (!galeria) return;


    // FILTRAR PRODUCTOS

    const productosFiltrados = productosHogar.filter(producto => {

        const categoria = normalizarHogar(
            producto.categorias?.nombre
        );

        if (categoriaSeleccionadaHogar === "todos") {
            return true;
        }

        if (categoriaSeleccionadaHogar === "hogar") {
            return [
                "hogar",
                "muebles",
                "hogar y muebles",
                "hogar y mueble"
            ].includes(categoria);
        }

        if (categoriaSeleccionadaHogar === "organizadores") {
            return categoria.includes("organizador");
        }

        if (categoriaSeleccionadaHogar === "cocina") {
            return categoria.includes("cocina");
        }

        if (categoriaSeleccionadaHogar === "textiles") {
            return categoria.includes("textil") ||
                   categoria.includes("cortina");
        }

        return false;

    });


    // ACTUALIZAR TÍTULO

    if (titulo) {

        const titulos = {

            todos: "Productos para el hogar",

            hogar: "Hogar y Muebles",

            organizadores: "Organizadores",

            cocina: "Productos de Cocina",

            textiles: "Cortinas"

        };

        titulo.textContent =
            titulos[categoriaSeleccionadaHogar] ||
            "Productos para el hogar";

    }


    // SI NO HAY PRODUCTOS

    if (!productosFiltrados.length) {

        galeria.innerHTML = `
            <p class="mensaje-vacio">
                Todavía no hay productos disponibles
                en esta categoría.
            </p>
        `;

        return;
    }


    // CREAR TARJETAS DE PRODUCTOS

    const crearTarjeta = producto => {

        const precio = Number(producto.precio_venta) || 0;

        const existencias = Number(producto.existencias) || 0;

        const imagen = producto.imagen_url;

        return `

            <article class="producto producto-hogar">

                <button
                    type="button"
                    class="producto-ver-detalle"
                    data-ver-hogar="${escaparHogar(producto.id)}"
                    aria-label="Ver ${escaparHogar(producto.nombre)}"
                >

                    ${imagen

                        ? `<img
                            src="${escaparHogar(imagen)}"
                            alt="${escaparHogar(producto.nombre)}"
                            loading="lazy"
                           >`

                        : `<div class="imagen-sin-producto">
                                🛍️
                           </div>`

                    }

                    <h3>
                        ${escaparHogar(producto.nombre)}
                    </h3>

                </button>


                <div class="producto-contenido">

                    <p class="precio">

                        ${precio > 0

                            ? PRECIO_HOGAR.format(precio)

                            : "Consultar precio"

                        }

                    </p>


                    <button
                        type="button"
                        data-agregar-hogar="${escaparHogar(producto.id)}"
                        ${existencias <= 0 || precio <= 0 ? "disabled" : ""}
                    >

                        ${existencias > 0 && precio > 0

                            ? "Añadir al carrito"

                            : "No disponible"

                        }

                    </button>

                </div>

            </article>

        `;

    };


    // DIVIDIR PRODUCTOS EN DOS GRUPOS

    const puntoMedio = Math.ceil(
        productosFiltrados.length / 2
    );

    const primeraParte = productosFiltrados.slice(
        0,
        puntoMedio
    );

    const segundaParte = productosFiltrados.slice(
        puntoMedio
    );


    // TARJETAS ESPECIALES

    const bloqueEspecial = `

        <section
            class="tarjetas-especiales-hogar"
            aria-label="Productos especiales"
        >

            <!-- PRODUCTO DESTACADO -->

            <article class="tarjeta-especial-hogar">

                <span class="etiqueta-especial">
                    DESTACADO DE LA SEMANA
                </span>

                <div id="producto-destacado-hogar">

                    <p>Cargando producto destacado...</p>

                </div>

            </article>


            <!-- PRODUCTO POPULAR -->

            <article class="tarjeta-especial-hogar">

                <span class="etiqueta-especial">
                    MÁS POPULAR DEL MES
                </span>

                <div id="producto-popular-hogar">

                    <p>
                        Próximamente conocerás
                        el favorito de nuestros clientes.
                    </p>

                </div>

            </article>

        </section>

    `;


    // ORGANIZAR TODA LA GALERÍA

    galeria.innerHTML =

        primeraParte.map(crearTarjeta).join("")

        +

        bloqueEspecial

        +

        segundaParte.map(crearTarjeta).join("");


    // CARGAR PRODUCTOS ESPECIALES

    mostrarProductoDestacadoHogar();

    mostrarProductoPopularHogar();

}
