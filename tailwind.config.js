/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07020F",
        panel: "#10051F",
        panelMuted: "#1A0A31",
        line: "#42205F",
        accent: "#E14AF4",
        accentHover: "#F071FF",
        violet: "#874DFF",
        positive: "#22DDBD",
        negative: "#FF638A",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0, 0, 0, 0.3), 0 0 42px rgba(122, 53, 230, 0.1)",
      },
    },
  },
  plugins: [],
};
