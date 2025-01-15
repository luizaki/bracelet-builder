/** @type {import('tailwindcss').Config} */

const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    './index.html', 
    './src/**/*.{js,ts,jsx,tsx}',
 ],
  theme: {
    extend: {
        colors: {
            'light-purple': '#faf5ff',
        },
        
        fontFamily: {
            poppins: ['Poppins', ...fontFamily.sans],	
        },

        typography: (theme) => ({
            DEFAULT: {
                css: {
                    fontFamily: theme('fontFamily.poppins').join(', '),

                    h1: {
                        fontWeight: '700',
                    }
                }
            }
        })
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}

