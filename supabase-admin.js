
/* ==========================================
   SKENZI HOME — CONEXIÓN ADMINISTRATIVA
   PROYECTO UNIFICADO
   ========================================== */

"use strict";

const ADMIN_SUPABASE_URL =
    "https://xjqoforlmxmpykjynlsm.supabase.co";

const ADMIN_SUPABASE_KEY =
    "sb_publishable_ovZCy27ft6esmpYC2PSLSQ_AOpFH0Zv";

if (!window.supabase) {
    console.error("No se cargó la biblioteca de Supabase.");
} else {
    window.skenziAdminDB =
        window.skenziDB ||
        window.supabase.createClient(
            ADMIN_SUPABASE_URL,
            ADMIN_SUPABASE_KEY
        );

    console.log("Conexión administrativa preparada.");
}
