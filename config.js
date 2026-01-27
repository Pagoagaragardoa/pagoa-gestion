// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
// ⚠️ IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase

const SUPABASE_URL = 'https://fvvmsdeqdtuiylyuufod.supabase.co';  // Ejemplo: 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1zZGVxZHR1aXlseXV1Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDY5NzYsImV4cCI6MjA4NTA4Mjk3Nn0.aTWmHvr2C5qXtNEEvjQb3rVQ4bNSr3cjubif3nBJTaI'; // La clave larga que empieza con eyJ...

// Verificar que las credenciales están configuradas
if (SUPABASE_URL === 'TU_PROJECT_URL_AQUI' || SUPABASE_ANON_KEY === 'TU_ANON_KEY_AQUI') {
    console.error('❌ ERROR: Debes configurar tus credenciales de Supabase en config.js');
    alert('ERROR: Las credenciales de Supabase no están configuradas. Por favor, edita el archivo config.js');
}

// Inicializar cliente de Supabase
let supabase;

try {
    // Verificar que la librería de Supabase esté cargada
    if (typeof window.supabase === 'undefined') {
        console.error('❌ ERROR: La librería de Supabase no se ha cargado correctamente');
        throw new Error('Supabase library not loaded');
    }
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('🟢 Supabase inicializado correctamente');
    console.log('🔗 URL:', SUPABASE_URL);
} catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
    alert('Error crítico: No se pudo conectar con Supabase. Verifica la configuración.');
}
