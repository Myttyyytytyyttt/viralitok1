import { createClient } from '@supabase/supabase-js'

// Credenciales de Supabase para operaciones del servidor
// Usamos la clave service_role para tener permisos completos en las API routes
const supabaseUrl = 'https://okghwljailgdcgjgtkpl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2h3bGphaWxnZGNnamd0a3BsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTA0OTM0OCwiZXhwIjoyMDU2NjI1MzQ4fQ.gCuSqaO7busaqhvJRlPOEMw0dR1LbzLsF8xQHrYkLPI'

// Crea el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase