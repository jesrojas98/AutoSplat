/**
 * Crea el usuario superadmin leyendo credenciales desde .env.
 * Ejecutar UNA sola vez: npm run seed:admin
 */
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: resolve(__dirname, '../../.env') })

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPERADMIN_EMAIL', 'SUPERADMIN_PASSWORD']
for (const key of REQUIRED) {
  if (!process.env[key]) { console.error(`Falta la variable de entorno: ${key}`); process.exit(1) }
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  const email = process.env.SUPERADMIN_EMAIL!
  const password = process.env.SUPERADMIN_PASSWORD!

  console.log(`Creando superadmin: ${email}`)

  // 1. Crear en Supabase Auth (si ya existe, obtener su ID)
  let userId: string

  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = (existing?.users ?? []).find((u: { email?: string }) => u.email === email)

  if (found) {
    userId = found.id
    console.log('Usuario ya existe en Auth — actualizando contraseña y metadata...')
    await supabase.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { role: 'admin', full_name: 'Administrador' },
      email_confirm: true,
    })
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: 'Administrador' },
    })
    if (error) { console.error('Error creando usuario:', error.message); process.exit(1) }
    userId = data.user!.id
    console.log('Usuario creado en Auth:', userId)
  }

  // 2. Upsert en la tabla users
  const { error: dbError } = await supabase.from('users').upsert({
    id: userId,
    email,
    name: 'Administrador',
    password_hash: '',
    role: 'admin',
  })

  if (dbError) { console.error('Error en tabla users:', dbError.message); process.exit(1) }

  console.log(`✓ Superadmin listo. Inicia sesión con: ${email}`)
}

run()
