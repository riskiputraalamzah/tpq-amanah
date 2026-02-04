/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#E8F5E9',
                    100: '#C8E6C9',
                    200: '#A5D6A7',
                    300: '#81C784',
                    400: '#66BB6A',
                    500: '#1B5E20',
                    600: '#2E7D32',
                    700: '#388E3C',
                    800: '#0D3D13',
                    900: '#0A2E0F',
                    950: '#064E3B', // Dark Emerald for footer
                    DEFAULT: '#1B5E20',
                },
                accent: {
                    50: '#FFF8E1',
                    100: '#FFECB3',
                    200: '#FFE082',
                    300: '#FFD54F',
                    400: '#FFCA28',
                    500: '#FFC107',
                    600: '#FFB300',
                    DEFAULT: '#FFD54F',
                },
                success: {
                    DEFAULT: '#10B981', // Emerald Light
                },
            },
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'Inter', 'Poppins', 'system-ui', 'sans-serif'],
                jakarta: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
                inter: ['Inter', 'system-ui', 'sans-serif'],
                poppins: ['Poppins', 'system-ui', 'sans-serif'],
                arabic: ['Amiri', 'serif'],
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'count-up': 'countUp 2s ease-out forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                countUp: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
