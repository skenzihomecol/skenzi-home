
/* ==========================================
   SKENZI HOME — CONEXIÓN ADMINISTRACIÓN
   PROYECTO: variedades-skenzi
   ========================================== */

"use strict";

const ADMIN_SUPABASE_URL =
    "https://qxwrbyqgzzibulpkqilg.supabase.co";

const ADMIN_SUPABASE_KEY =
    "sb_publishable_QAWrSWUCHVy5rb7elEwL7Q_xaJ5k5r3";

if (!window.supabase) {
    console.error("No se cargó la biblioteca de Supabase.");
} else {
    window.skenziAdminDB = window.supabase.createClient(
        ADMIN_SUPABASE_URL,
        ADMIN_SUPABASE_KEY
    );
}
