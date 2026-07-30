/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        burgundy: {
          DEFAULT: "#741F2C",
          dark: "#5A1721",
          light: "#8F2737",
          soft: "rgba(116, 31, 44, 0.08)",
        },
        cream: {
          DEFAULT: "#F7F3EC",
          dark: "#EFE8DC",
          light: "#FAF7F2",
        },
        charcoal: {
          DEFAULT: "#171717",
          light: "rgba(23, 23, 23, 0.7)",
          muted: "rgba(23, 23, 23, 0.4)",
        },
        border: "var(--border)",
      },
      borderRadius: {
        card: "12px",
        btn: "10px",
      },
      boxShadow: {
        subtle: "0 2px 8px rgba(23, 23, 23, 0.04)",
      },
    },
  },
  plugins: [],
};
