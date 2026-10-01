/**
 * Crea (o actualiza) el usuario admin en Supabase Auth usando las credenciales
 * que ya estan en .env, para no tener que escribirlas a mano en el dashboard.
 *
 *   pnpm admin:user
 *
 * No imprime ni registra la contraseña.
 */

import { createClient } from "@supabase/supabase-js"

const URL = process.env.SUPABASE_URL?.trim()
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const EMAIL = process.env.ADMIN_EMAIL?.trim()
const PASSWORD = process.env.ADMIN_PASSWORD

if (!URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.")
  process.exit(1)
}
if (!EMAIL || !PASSWORD) {
  console.error("Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en el entorno.")
  process.exit(1)
}
if (PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD debe tener al menos 8 caracteres.")
  process.exit(1)
}

const supabase = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const email = EMAIL.toLowerCase()

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listError) {
  console.error("No se pudieron listar los usuarios:", listError.message)
  process.exit(1)
}

const existing = list.users.find((u) => (u.email || "").toLowerCase() === email)

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  })
  if (error) {
    console.error("No se pudo actualizar el usuario:", error.message)
    process.exit(1)
  }
  console.log(`Usuario actualizado: ${email} (${existing.id})`)
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error) {
    console.error("No se pudo crear el usuario:", error.message)
    process.exit(1)
  }
  console.log(`Usuario creado: ${email} (${data.user.id})`)
}

console.log("Listo. Ya podes entrar al panel con ese email y la clave de .env")