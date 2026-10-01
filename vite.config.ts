import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from "path"

/*
 * `src/api.ts` arma los requests con `import.meta.env.VITE_API_URL`. Si la
 * variable no está, la base queda en "" y el bundle pide /api/* al propio
 * dominio: en Vercel eso es un SPA estático, así que todo /api/* responde 404
 * y el síntoma aparece en el navegador con el build ya publicado, sin forma
 * de distinguirlo de una API caída.
 */
const MISSING_API_URL = [
  "[config] Falta VITE_API_URL.",
  "El bundle va a pedir /api/* al propio dominio y va a recibir 404.",
  "Definila en .env para desarrollo, o en el proyecto de Vercel para producción",
  "(apuntando a la API en Render, sin barra final).",
].join(" ")

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    // loadEnv, no process.env: Vite no expone los .env al archivo de config,
    // así que VITE_API_URL definida en .env llegaría como undefined y el
    // guard dispararía siempre. loadEnv además incluye lo que venga de
    // process.env, que es de donde saca Vercel sus variables.
    const { VITE_API_URL } = loadEnv(mode, process.cwd(), "VITE_")

    if (!VITE_API_URL) {
      // Vercel publica directamente el resultado de este build: el fallo tiene
      // que ser visible antes del deploy. Un build local se deja pasar con una
      // advertencia para no bloquear el trabajo diario.
      if (process.env.VERCEL || process.env.CI) {
        throw new Error(MISSING_API_URL)
      }
      console.warn(MISSING_API_URL)
    }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": "http://localhost:3001",
        "/uploads": "http://localhost:3001",
      },
    },
  }
})
