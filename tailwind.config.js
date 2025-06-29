/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
    slideUp: "slideUp 0.3s ease-out",
    fadeIn: "fadeIn 0.3s ease-out",
  },
  keyframes: {
    slideUp: {
      "0%": { opacity: 0, transform: "translateY(12px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    },
    fadeIn: {
      "0%": { opacity: 0 },
      "100%": { opacity: 1 },
    },
  },
    },
  },
  plugins: [],
}

