
import type { Config } from "tailwindcss";
import { sunrisePreset } from "@omelora/sunrise/tailwind-preset";

const config: Config = {
  // Sunrise ships readonly token tuples; cast for Tailwind's mutable Config type
  presets: [
    sunrisePreset as unknown as NonNullable<Config["presets"]>[number],
  ],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.{js,ts,jsx,tsx}",
    // Scan Sunrise components so their utility classes are generated
    "./node_modules/@omelora/sunrise/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Bridge action blue, shared so both apps use one action color.
      colors: {
        bridge: {
          action: { DEFAULT: "#1aa1ff", hover: "#178fdb", soft: "#EEF8FF" },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
