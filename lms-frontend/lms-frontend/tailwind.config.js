/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./assets/js/**/*.js",
    "./admin/**/*.{html,js}",
    "./teacher/**/*.{html,js}",
    "./student/**/*.{html,js}",
    "./parent/**/*.{html,js}",
    "./superadmin/**/*.{html,js}",
    "./auth/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        // Ghana flag colors
        'ghana': {
          red: '#d82434',
          gold: '#d4af37',
          green: '#006a3f',
        },
        // LMS brand colors
        'lms': {
          primary: '#3090cf',
          secondary: '#008c54',
          accent: '#d4af37',
          dark: '#1a1d29',
          light: '#f5f7fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
