// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
// ⚠️ REEMPLAZA ESTAS CREDENCIALES CON LAS TUYAS

const SUPABASE_CONFIG = {
    url: 'https://fvvmsdeqdtuiylyuufod.supabase.co',  // Ejemplo: 'https://abcdefgh.supabase.co'
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1zZGVxZHR1aXlseXV1Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDY5NzYsImV4cCI6MjA4NTA4Mjk3Nn0.aTWmHvr2C5qXtNEEvjQb3rVQ4bNSr3cjubif3nBJTaI'      // Tu clave anon que empieza con eyJ...
};

// ⚠️ IMPORTANTE: Reemplaza los valores de arriba con tus credenciales reales

// Verificar configuración
if (SUPABASE_CONFIG.url === 'TU_PROJECT_URL_AQUI' || SUPABASE_CONFIG.key === 'TU_ANON_KEY_AQUI') {
    console.error('❌ ERROR: Configura tus credenciales de Supabase en config.js');
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #fee; font-family: sans-serif;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ Error de Configuración</h1>
                <p style="color: #666; margin-bottom: 20px;">Las credenciales de Supabase no están configuradas.</p>
                <p style="color: #666;">Por favor, edita el archivo <code>config.js</code> con tus credenciales.</p>
            </div>
        </div>
    `;
} else {
    console.log('✅ Configuración de Supabase cargada');
    console.log('🔗 URL:', SUPABASE_CONFIG.url);
}
