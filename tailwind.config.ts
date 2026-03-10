import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}", "./shared/**/*.{js,ts}"],
  safelist: [
    "bg-white", "bg-gradient-to-br", "dark:bg-card", "bg-background", "border-border", "text-foreground", "hover:border-primary",
    "bg-violet-100", "bg-violet-500", "bg-violet-900", "border-violet-400", "border-violet-500", "text-violet-300", "text-violet-500", "text-violet-700", "hover:border-violet-400", "dark:bg-violet-900", "dark:text-violet-300",
    "bg-slate-800", "bg-slate-900", "bg-slate-950", "border-slate-700", "text-slate-100", "dark:bg-slate-950",
    "bg-pink-400", "bg-pink-500", "bg-pink-900", "border-pink-400", "border-pink-500", "text-pink-300", "text-pink-400", "hover:border-pink-400",
    "bg-cyan-400", "to-cyan-400", "from-pink-500",
    "bg-amber-50", "bg-amber-100", "bg-amber-900", "bg-amber-950", "border-orange-200", "border-orange-300", "border-orange-500", "border-orange-700", "border-orange-800", "text-amber-100", "text-amber-900", "dark:bg-amber-900", "dark:bg-amber-950", "dark:border-orange-700", "dark:border-orange-800", "dark:text-amber-100",
    "bg-orange-200", "bg-orange-500", "bg-orange-800", "text-orange-200", "text-orange-500", "text-orange-700", "hover:border-orange-400", "dark:bg-orange-800", "dark:text-orange-200",
    "from-orange-500", "to-yellow-500",
    "bg-emerald-50", "bg-emerald-100", "bg-emerald-500", "bg-emerald-900", "bg-emerald-950", "border-emerald-200", "border-emerald-300", "border-emerald-700", "border-emerald-800", "text-emerald-100", "text-emerald-900", "hover:border-emerald-400", "dark:bg-emerald-900", "dark:bg-emerald-950", "dark:border-emerald-700", "dark:border-emerald-800", "dark:text-emerald-100",
    "bg-green-200", "bg-green-500", "bg-green-600", "bg-green-800", "border-green-500", "text-green-200", "text-green-500", "text-green-700", "dark:bg-green-800", "dark:text-green-200",
    "from-emerald-500", "to-green-600",
    "bg-sky-50", "bg-sky-100", "bg-sky-500", "bg-sky-900", "bg-sky-950", "border-sky-200", "border-sky-300", "border-sky-700", "border-sky-800", "text-sky-100", "text-sky-900", "hover:border-sky-400", "dark:bg-sky-900", "dark:bg-sky-950", "dark:border-sky-700", "dark:border-sky-800", "dark:text-sky-100",
    "bg-teal-200", "bg-teal-500", "bg-teal-800", "border-teal-500", "text-teal-200", "text-teal-500", "text-teal-700", "dark:bg-teal-800", "dark:text-teal-200",
    "from-sky-500", "to-teal-500",
    "bg-indigo-500", "bg-indigo-700", "bg-indigo-900", "bg-indigo-950", "border-indigo-500", "border-indigo-700", "text-indigo-100", "hover:border-indigo-400", "dark:bg-slate-950",
    "bg-purple-600", "bg-purple-800", "border-purple-400", "text-purple-200", "text-purple-400",
    "from-violet-500", "to-purple-600", "from-indigo-500",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
