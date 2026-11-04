
/* ==========================================
   SKENZI HOME — INICIO DE SESIÓN ADMIN
   ========================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("form-login");
    const correo = document.getElementById("correo");
    const contrasena = document.getElementById("contrasena");
    const boton = document.getElementById("boton-login");
    const mensaje = document.getElementById("mensaje-login");

    if (!formulario) return;

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        mensaje.textContent = "";

        if (!window.skenziAdminDB) {
            mensaje.textContent = "No se pudo conectar con el servidor.";
            return;
        }

        boton.disabled = true;
        boton.textContent = "VERIFICANDO ACCESO...";

        try {

            const { data, error } =
                await window.skenziAdminDB.auth.signInWithPassword({
                    email: correo.value.trim(),
                    password: contrasena.value
                });

            if (error) throw error;

            if (
                data.user?.email?.toLowerCase() !==
                "hurtado03444@gmail.com"
            ) {
                await window.skenziAdminDB.auth.signOut();
                throw new Error("Esta cuenta no tiene acceso administrativo.");
            }

            mensaje.style.color = "#394E3C";
            mensaje.textContent = "Acceso correcto. Bienvenida.";

            window.location.href = "admin-panel.html";

        } catch (error) {

            console.error("Error de inicio de sesión:", error);

            mensaje.style.color = "#A34E43";
            mensaje.textContent =
                error.message || "No fue posible iniciar sesión.";

            boton.disabled = false;
            boton.textContent = "INGRESAR AL PANEL";
        }

    });

});
