// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
// ⚠️ IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase

const SUPABASE_URL = 'https://fvvmsdeqdtuiylyuufod.supabase.co';  // Ejemplo: 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dm1zZGVxZHR1aXlseXV1Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDY5NzYsImV4cCI6MjA4NTA4Mjk3Nn0.aTWmHvr2C5qXtNEEvjQb3rVQ4bNSr3cjubif3nBJTaI'; // La clave larga que empieza con eyJ...

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar conexión
console.log('🟢 Supabase inicializado correctamente');
