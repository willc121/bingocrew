export interface ThemeConfig {
  id: string;
  name: string;
  previewColor: string;
  card: {
    background: string;
    border: string;
  };
  freeSpace: {
    gradient: string;
    text: string;
  };
  square: {
    background: string;
    border: string;
    text: string;
    hoverBorder: string;
  };
  completed: {
    background: string;
    border: string;
    text: string;
    checkColor: string;
  };
}

export const THEMES: Record<string, ThemeConfig> = {
  default: {
    id: "default",
    name: "Default (Purple)",
    previewColor: "#8b5cf6",
    card: {
      background: "bg-white dark:bg-card",
      border: "border-border",
    },
    freeSpace: {
      gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      text: "text-white",
    },
    square: {
      background: "bg-background",
      border: "border-border",
      text: "text-foreground",
      hoverBorder: "hover:border-violet-400",
    },
    completed: {
      background: "bg-violet-100 dark:bg-violet-900",
      border: "border-violet-500",
      text: "text-violet-700 dark:text-violet-300",
      checkColor: "text-violet-500",
    },
  },
  neon: {
    id: "neon",
    name: "Neon (Pink/Cyan)",
    previewColor: "#ec4899",
    card: {
      background: "bg-slate-900 dark:bg-slate-950",
      border: "border-pink-500",
    },
    freeSpace: {
      gradient: "bg-gradient-to-br from-pink-500 to-cyan-400",
      text: "text-white",
    },
    square: {
      background: "bg-slate-800",
      border: "border-slate-700",
      text: "text-slate-100",
      hoverBorder: "hover:border-pink-400",
    },
    completed: {
      background: "bg-pink-900",
      border: "border-pink-400",
      text: "text-pink-300",
      checkColor: "text-pink-400",
    },
  },
  retro: {
    id: "retro",
    name: "Retro (Orange/Yellow)",
    previewColor: "#f97316",
    card: {
      background: "bg-amber-50 dark:bg-amber-950",
      border: "border-orange-300 dark:border-orange-800",
    },
    freeSpace: {
      gradient: "bg-gradient-to-br from-orange-500 to-yellow-500",
      text: "text-white",
    },
    square: {
      background: "bg-amber-100 dark:bg-amber-900",
      border: "border-orange-200 dark:border-orange-700",
      text: "text-amber-900 dark:text-amber-100",
      hoverBorder: "hover:border-orange-400",
    },
    completed: {
      background: "bg-orange-200 dark:bg-orange-800",
      border: "border-orange-500",
      text: "text-orange-700 dark:text-orange-200",
      checkColor: "text-orange-500",
    },
  },
  nature: {
    id: "nature",
    name: "Nature (Green)",
    previewColor: "#22c55e",
    card: {
      background: "bg-emerald-50 dark:bg-emerald-950",
      border: "border-emerald-300 dark:border-emerald-800",
    },
    freeSpace: {
      gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
      text: "text-white",
    },
    square: {
      background: "bg-emerald-100 dark:bg-emerald-900",
      border: "border-emerald-200 dark:border-emerald-700",
      text: "text-emerald-900 dark:text-emerald-100",
      hoverBorder: "hover:border-emerald-400",
    },
    completed: {
      background: "bg-emerald-500 dark:bg-emerald-600",
      border: "border-emerald-700 dark:border-emerald-400",
      text: "text-white dark:text-white",
      checkColor: "text-white",
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean (Blue/Teal)",
    previewColor: "#0ea5e9",
    card: {
      background: "bg-sky-50 dark:bg-sky-950",
      border: "border-sky-300 dark:border-sky-800",
    },
    freeSpace: {
      gradient: "bg-gradient-to-br from-sky-500 to-teal-500",
      text: "text-white",
    },
    square: {
      background: "bg-sky-100 dark:bg-sky-900",
      border: "border-sky-200 dark:border-sky-700",
      text: "text-sky-900 dark:text-sky-100",
      hoverBorder: "hover:border-sky-400",
    },
    completed: {
      background: "bg-teal-200 dark:bg-teal-800",
      border: "border-teal-500",
      text: "text-teal-700 dark:text-teal-200",
      checkColor: "text-teal-500",
    },
  },
  space: {
    id: "space",
    name: "Space (Indigo/Purple)",
    previewColor: "#6366f1",
    card: {
      background: "bg-indigo-950 dark:bg-slate-950",
      border: "border-indigo-500",
    },
    freeSpace: {
      gradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
      text: "text-white",
    },
    square: {
      background: "bg-indigo-900",
      border: "border-indigo-700",
      text: "text-indigo-100",
      hoverBorder: "hover:border-indigo-400",
    },
    completed: {
      background: "bg-purple-800",
      border: "border-purple-400",
      text: "text-purple-200",
      checkColor: "text-purple-400",
    },
  },
};

export const THEME_OPTIONS = Object.values(THEMES);

export function getTheme(themeId: string): ThemeConfig {
  return THEMES[themeId] || THEMES.default;
}
