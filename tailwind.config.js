/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                oat: "var(--color-oat)",
                charcoal: "var(--color-charcoal)",
                matcha: "var(--color-matcha)",
                clay: "var(--color-clay)",
                lavender: "var(--color-lavender)",
                sage: "var(--color-sage)",
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
