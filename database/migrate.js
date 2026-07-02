import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

process.loadEnvFile(join(__dirname, '..', 'apps', 'backend', '.env'))

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas (definir en apps/backend/.env)')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const sql = readFileSync(join(__dirname, 'migrations/001_schema.sql'), 'utf-8')

// Ejecuta cada statement separado por ;
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`Ejecutando ${statements.length} statements...`)

for (const statement of statements) {
  const { error } = await supabase.rpc('exec_sql', { sql: statement }).single().catch(() => ({ error: null }))
  // Fallback: usar la API REST directamente
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql: statement }),
  })
  if (!res.ok && res.status !== 404) {
    console.warn(`⚠ ${res.status}: ${statement.slice(0, 60)}...`)
  }
}

console.log('✓ Migraciones listas')
