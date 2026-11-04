
/* ==========================================
   SKENZI HOME — ACCESO Y RECUPERACIÓN ADMIN
   ========================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("form-login");
    const correo = document.getElementById("correo");
    const contrasena = document.getElementById("contrasena");
    const boton = document.getElementById("boton-login");
    const mensaje = document.getElementById("mensaje-login");
    const recuperar = document.getElementById("recuperar-clave");

    if (!window.skenziAdminDB) {
        mensaje.textContent = "No se pudo conectar con Supabase.";
        return;
    }

    // INICIAR SESIÓN
    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        mensaje.textContent = "";
        boton.disabled = true;
        boton.textContent = "VERIFICANDO ACCESO...";

        try {

            const { data, error } =
                await window.skenziAdminDB.auth.signInWithPassword({
                    email: correo.value.trim(),
                    password: contrasena.value
                });

            if (error) throw error;

            const correosAutorizados = [
    "hurtado03444@gmail.com",
    "trendylovers9@gmail.com"
];

if (!correosAutorizados.includes(data.user?.email?.toLowerCase())) {
    await window.skenziAdminDB.auth.signOut();
    throw new Error("Esta cuenta no tiene acceso administrativo.");
}
              

            mensaje.style.color = "#394E3C";
            mensaje.textContent = "Acceso correcto. Bienvenida.";

            window.location.href = "admin-panel.html";

        } catch (error) {

            console.error("Error de inicio de sesión:", error);

            mensaje.style.color = "#A34E43";
            mensaje.textContent = error.message;

            boton.disabled = false;
            boton.textContent = "INGRESAR AL PANEL";
        }

    });

    // RECUPERAR CONTRASEÑA
    recuperar.addEventListener("click", async (evento) => {

        evento.preventDefault();

        const email = correo.value.trim();

        mensaje.textContent = "";
        mensaje.style.color = "#A34E43";

        if (!email) {
            mensaje.textContent =
                "Primero escribe tu correo electrónico.";
            correo.focus();
            return;
        }

        recuperar.style.pointerEvents = "none";
        recuperar.textContent = "ENVIANDO CORREO...";

        try {

            const { error } =
                await window.skenziAdminDB.auth.resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            "https://skenzihomecol.github.io/skenzi-home/actualizar-clave.html"
                    }
                );

            if (error) throw error;

            mensaje.style.color = "#394E3C";
            mensaje.textContent =
                "Solicitud enviada. Revisa tu correo y la carpeta de spam.";

        } catch (error) {

            console.error("Error al recuperar contraseña:", error);

            mensaje.textContent =
                error.message || "No se pudo enviar el correo.";

        } finally {

            recuperar.style.pointerEvents = "auto";
            recuperar.textContent = "¿Olvidaste tu contraseña?";

        }

    });

});
