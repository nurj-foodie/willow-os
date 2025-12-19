/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                oat: "#FDFCF8",
                charcoal: "#2D2D2D",
                matcha: "#D1E2C4",
                clay: "#E8D5C4",
                lavender: "#E1D5E8",
                sage: "#B2C5B2",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            borderRadius: {
                'pill': '100px',
            }
        },
    },
    plugins: [],
}
