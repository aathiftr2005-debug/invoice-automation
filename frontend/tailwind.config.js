export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        mango: "#FFC300",
        mangoGold: "#FFC72C",
        mangoDeep: "#FFB000",
        deepBlack: "#111111",
        cleanWhite: "#FFFFFF"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 16px 42px rgba(255, 195, 0, 0.24)",
        mangoGlow: "0 0 32px rgba(255, 199, 44, 0.35)"
      }
    }
  },
  plugins: []
};
