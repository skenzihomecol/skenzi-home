
/* ==========================================
   SKENZI HOME — CONEXIÓN SUPABASE
   ========================================== */

"use strict";

const SKENZI_SUPABASE_URL =
    "https://qxwrbyqgzzibulpkqilg.supabase.co";

const SKENZI_SUPABASE_KEY =
    "sb_publishable_QAWrSWUCHVy5rb7elEwL7Q_xaJ5k5r3";

if (!window.supabase) {
    console.error("No se pudo cargar Supabase.");
} else {
    window.skenziDB = window.supabase.createClient(
        SKENZI_SUPABASE_URL,
        SKENZI_SUPABASE_KEY
    );

    console.log("Conexión con Skenzi Home preparada.");
}
