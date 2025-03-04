import supabase from './supabase'

async function createTokensTable() {
  // Esta es una función que normalmente se ejecutaría una sola vez para configurar la tabla
  // No es necesario ejecutarla en el ciclo normal de la aplicación
  try {
    // Crear la tabla tokens si no existe
    const { error } = await supabase.rpc('create_tokens_table')
    
    if (error) {
      console.error('Error al crear la tabla de tokens:', error)
      
      // Si el RPC no existe, intenta crear la tabla manualmente con SQL
      console.log('Intentando crear la tabla manualmente...')
      
      // Nota: Esto es solo para fines de desarrollo.
      // En un entorno de producción, las migraciones deberían manejarse con herramientas adecuadas
      const { error: sqlError } = await supabase.from('tokens').select('count(*)').limit(1)
      
      if (sqlError && sqlError.code === '42P01') { // Tabla no existe
        console.log('La tabla no existe, creándola...')
        // Definir la estructura de la tabla en SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS tokens (
            id SERIAL PRIMARY KEY,
            address TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            tiktok_url TEXT NOT NULL,
            tiktok_id TEXT,
            creator TEXT NOT NULL,
            timestamp BIGINT NOT NULL,
            signature TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
        
        // Ejecutar SQL personalizado (requiere permisos adecuados)
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
        
        if (createError) {
          console.error('No se pudo crear la tabla manualmente:', createError)
          console.log('Por favor, crea la tabla manualmente en la consola de Supabase')
        } else {
          console.log('Tabla de tokens creada correctamente')
        }
      }
    } else {
      console.log('Tabla de tokens creada o verificada correctamente')
    }
  } catch (err) {
    console.error('Error en la creación de la tabla:', err)
  }
}

export default createTokensTable 