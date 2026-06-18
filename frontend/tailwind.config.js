export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        indigoElectric: "#6366F1",
        softWhite: "#F8FAFC"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(99, 102, 241, 0.24)"
      }
    }
  },
  plugins: []
};
