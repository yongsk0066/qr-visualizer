import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { multiLanguagePlugin } from './build/multiLanguagePlugin';

const ReactCompilerConfig = {
  /* ... */
};

// https://vite.dev/config/
export default defineConfig({
  base: '/qr-visualizer/',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
    multiLanguagePlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});