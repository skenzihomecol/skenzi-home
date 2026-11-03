
/* ==========================================
   SKENZI HOME — CONEXIÓN SUPABASE
   ========================================== */

"use strict";

const SKENZI_SUPABASE_URL =
    "https://xjqoforlmxmpykjynlsm.supabase.co";

const SKENZI_SUPABASE_KEY =
    "sb_publishable_ovZCy27ft6esmpYC2PSLSQ_AOpFH0Zv";

if (!window.supabase) {
    console.error("No se pudo cargar Supabase.");
} else {

    window.skenziDB = window.supabase.createClient(
        SKENZI_SUPABASE_URL,
        SKENZI_SUPABASE_KEY
    );

    console.log("Conexión de Skenzi Home preparada.");
}
