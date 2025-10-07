import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: false,
        secure: false,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      },
      '/login': {
        target: 'http://localhost:5001',
        changeOrigin: false,
        secure: false,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      },
      '/logout': {
        target: 'http://localhost:5001',
        changeOrigin: false,
        secure: false,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      },
      '/register': {
        target: 'http://localhost:5001',
        changeOrigin: false,
        secure: false,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
