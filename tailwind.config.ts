import type { Config } from "tailwindcss";

const config: Config = {
  // CRITICAL FIX: This tells Tailwind to switch themes when the "dark" class is on the <html> tag
  darkMode: 'class',
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      colors: {
        // Hooks into the CSS variables you just set in globals.css
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Your specific brand palette
        brand: {
          neon: "#9cf822",  // Your signature dark-mode green
          olive: "#5a9a00", // The high-contrast light-mode green
          hover: "#84cc0e", // The interactive hover state
        }
      },
    },
  },
  
  // REQUIRED: You are using 'animate-in', 'fade-in', and 'slide-in' in your pages. 
  // This plugin makes those animations actually work.
  plugins: [require("tailwindcss-animate")],
};

export default config;