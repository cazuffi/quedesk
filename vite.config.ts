import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => {
  // @ts-expect-error process is a nodejs global
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };

  return {
    plugins: [react(), tailwindcss()],
    clearScreen: false,

    define:
      mode === "web"
        ? {
            "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
              env.VITE_SUPABASE_URL ?? "",
            ),
            "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
              env.VITE_SUPABASE_ANON_KEY ?? "",
            ),
          }
        : undefined,

    ...(mode === "web"
      ? {
          base: "/quedesk/",
          server: { port: 3000, strictPort: true },
          build: { outDir: "dist-web" },
        }
      : {
          server: {
            port: 1420,
            strictPort: true,
            host: host || false,
            hmr: host
              ? { protocol: "ws", host, port: 1421 }
              : undefined,
            watch: { ignored: ["**/src-tauri/**"] },
          },
        }),
  };
});
