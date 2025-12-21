import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
/// <reference types="vitest" />

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: ["src/**/*.test.*", "src/**/*.stories.*", "src/test/**/*"],
    }),
  ],
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL || "https://api.dismissible.io",
    ),
  },
  build: {
    target: "es2015", // Target older JavaScript for better compatibility
    lib: {
      entry: "src/root.ts",
      name: "DismissibleClient",
      fileName: (format) => `dismissible-client.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
      output: [
        {
          format: "es",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "React.jsxRuntime",
            "react/jsx-dev-runtime": "React.jsxDevRuntime",
          },
        },
        {
          format: "umd",
          name: "DismissibleClient",
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "React.jsxRuntime",
            "react/jsx-dev-runtime": "React.jsxDevRuntime",
          },
        },
      ],
    },
    // Include dependencies in bundle to ensure they're transpiled
    commonjsOptions: {
      include: [/openapi-fetch/, /node_modules/],
    },
  },
});
