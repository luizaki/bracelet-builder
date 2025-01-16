import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

dotenv.config();

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_KEY': JSON.stringify(process.env.VITE_SUPABASE_KEY),
  },
});
