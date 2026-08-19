import type { Config } from "tailwindcss";

// Paleta CRM: fondo neutro suave, tarjetas blancas con sombra sutil,
// acento índigo, y colores semánticos para estados (activo/pausado/etc).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(220 13% 91%)",
        input: "hsl(220 13% 88%)",
        ring: "hsl(243 75% 59%)",
        background: "hsl(210 20% 98%)",
        foreground: "hsl(222 47% 11%)",
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222 47% 11%)",
        },
        sidebar: {
          DEFAULT: "hsl(222 47% 11%)",
          foreground: "hsl(210 20% 92%)",
          accent: "hsl(222 39% 18%)",
          border: "hsl(222 35% 20%)",
        },
        primary: {
          DEFAULT: "hsl(243 75% 59%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(220 14% 96%)",
          foreground: "hsl(222 47% 11%)",
        },
        accent: {
          DEFAULT: "hsl(243 75% 96%)",
          foreground: "hsl(243 60% 45%)",
        },
        muted: {
          DEFAULT: "hsl(220 14% 96%)",
          foreground: "hsl(215 16% 47%)",
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(0 0% 100%)",
        },
        success: {
          DEFAULT: "hsl(152 60% 36%)",
          foreground: "hsl(0 0% 100%)",
          subtle: "hsl(152 55% 94%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(26 40% 15%)",
          subtle: "hsl(45 93% 94%)",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.3rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        popover: "0 8px 24px -4px rgb(15 23 42 / 0.15), 0 2px 8px -2px rgb(15 23 42 / 0.08)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-in": "slide-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
