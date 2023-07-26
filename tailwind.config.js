/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#10122f',
        Solitude: '#f6f8fa',
        CatskillWhite: '#F1F5F9',
        LinkWater: '#D8DEE4',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
