import crypto from "node:crypto"

const PASSWORD = process.env.ADMIN_PASSWORD || "admin"
const tokens = new Map()

export function isDefaultPassword() {
  return PASSWORD === "admin"
}

export function checkPassword(password) {
  return String(password ?? "") === PASSWORD
}

export function issueToken() {
  const token = crypto.randomBytes(24).toString("hex")
  tokens.set(token, Date.now())
  return token
}

export function verifyToken(token) {
  if (!token) return false
  return tokens.has(token)
}

export function isValidPassword() {
  return !isDefaultPassword()
}