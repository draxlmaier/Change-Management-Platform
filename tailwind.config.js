// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {keyframes: {
        'row-attention': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
      animation: {
        'row-attention': 'row-attention 1.5s ease-in-out infinite',
        'ping-once': 'ping 1s cubic-bezier(0, 0, 0.2, 1)',
      },},
  },
  plugins: [],
};
