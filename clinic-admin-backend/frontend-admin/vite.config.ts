import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    proxy: {
      // ✅ Proxy para todas las operaciones WAHA (WhatsApp API)
      '^/api/(sessions|[a-zA-Z0-9_-]+/(start|stop|restart|auth))': {
        target: 'http://pampaservers.com:60513',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('WAHA proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending WAHA Request:', req.method, req.url);
            // ✅ Agregar API Key automáticamente para WAHA
            proxyReq.setHeader('X-Api-Key', 'pampaserver2025enservermuA!');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('WAHA Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // ✅ Proxy para el backend MongoDB local
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('MongoDB Backend proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to MongoDB Backend:', req.method, req.url);
            // ✅ Agregar API Key automáticamente para MongoDB Backend
            // Solo si no hay Authorization header (para admin autenticado)
            const authHeader = proxyReq.getHeader('Authorization');
            if (!authHeader) {
              proxyReq.setHeader('X-API-Key', 'test123456');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('MongoDB Backend Response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    
  }}
));
