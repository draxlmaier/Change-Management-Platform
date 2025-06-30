// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // custom animation or colors if needed
    },
  },
  plugins: [], // ← Leave this empty or put Tailwind plugins only
};
