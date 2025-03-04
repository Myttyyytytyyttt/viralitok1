import { createClient } from '@supabase/supabase-js'

// Credenciales de Supabase para operaciones del servidor
// Usamos la clave service_role para tener permisos completos en las API routes
const supabaseUrl = 'https://okghwljailgdcgjgtkpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2h3bGphaWxnZGNnamd0a3BsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA0OTM0OCwiZXhwIjoyMDU2NjI1MzQ4fQ.gCuSqaO7busaqhvJRlPOEMw0dR1LbzLsF8xQHrYkLPI'

// Opciones de configuración para mejorar la resistencia a errores de conexión
const supabaseOptions = {
  auth: {
    persistSession: false, // No necesitamos persistir la sesión para operaciones del servidor
    autoRefreshToken: false, // No necesitamos auto-refrescar el token
  },
  global: {
    fetch: fetch, // Usar el fetch global
  },
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 5000, // Tiempo de espera en ms
  },
}

// Crea el cliente de Supabase con opciones mejoradas
const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions)

export default supabase