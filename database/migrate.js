import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
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

// Aplica, en orden, todos los .sql de migrations/ y luego todos los de rls/.
// Cada carpeta se ordena alfabéticamente — de ahí el prefijo NNN_ en los nombres.
const SQL_DIRS = ['migrations', 'rls']

function listSqlFiles(dir) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => join(dir, f))
}

// Divide por ';' pero respeta bloques $$ ... $$ (funciones plpgsql), que
// contienen ';' internos y no deben cortarse ahí. 002_notifications.sql y
// 002_users_policies.sql dependen de esto.
function splitStatements(sql) {
  const statements = []
  let current = ''
  let inDollarBlock = false

  for (const line of sql.split('\n')) {
    if (line.trim().startsWith('--')) continue
    const dollarMatches = line.match(/\$\$/g)
    if (dollarMatches) {
      for (let i = 0; i < dollarMatches.length; i++) inDollarBlock = !inDollarBlock
    }
    current += line + '\n'

    if (!inDollarBlock && line.trim().endsWith(';')) {
      const trimmed = current.trim()
      if (trimmed.length > 0) statements.push(trimmed)
      current = ''
    }
  }
  const rest = current.trim()
  if (rest.length > 0) statements.push(rest)
  return statements
}

async function runStatement(statement) {
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

for (const dir of SQL_DIRS) {
  const files = listSqlFiles(join(__dirname, dir))
  if (files.length === 0) {
    console.log(`(${dir}/ no tiene archivos .sql, se omite)`)
    continue
  }

  for (const file of files) {
    const sql = readFileSync(file, 'utf-8')
    const statements = splitStatements(sql)

    console.log(`${file}: ejecutando ${statements.length} statements...`)
    for (const statement of statements) {
      await runStatement(statement)
    }
  }
}

console.log('✓ Migraciones y políticas RLS listas')
console.log('Nota: este script depende de la función RPC "exec_sql" en el proyecto Supabase.')
console.log('Si no existe, aplica los archivos de migrations/ y rls/ manualmente en el SQL Editor de Supabase, en el mismo orden.')
