import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => {
  // @ts-expect-error process is a nodejs global
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };

  const isWeb = mode === "web";

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isWeb
        ? [
            VitePWA({
              strategies: "injectManifest",
              srcDir: "src",
              filename: "sw.ts",
              registerType: "autoUpdate",
              injectRegister: "auto",
              manifest: {
                name: "QueDesk",
                short_name: "QueDesk",
                description: "Queue-based personal productivity app",
                theme_color: "#4f46e5",
                background_color: "#f5f7fa",
                display: "standalone",
                scope: "/quedesk/",
                start_url: "/quedesk/",
                icons: [
                  {
                    src: "icon-192.png",
                    sizes: "192x192",
                    type: "image/png",
                  },
                  {
                    src: "icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                  },
                  {
                    src: "icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                  },
                ],
                shortcuts: [
                  {
                    name: "Capture to Inbox",
                    short_name: "Capture",
                    description: "Quick capture a task to Inbox",
                    url: "/capture",
                    icons: [
                      {
                        src: "icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                      },
                    ],
                  },
                  {
                    name: "Focus — Today",
                    short_name: "Focus",
                    description: "Open the Today focus sidecar",
                    url: "/focus",
                    icons: [
                      {
                        src: "icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                      },
                    ],
                  },
                ],
              },
            }),
          ]
        : []),
    ],
    clearScreen: false,

    define: isWeb
      ? {
          "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
            env.VITE_SUPABASE_URL ?? "",
          ),
          "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
            env.VITE_SUPABASE_ANON_KEY ?? "",
          ),
        }
      : undefined,

    ...(isWeb
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
