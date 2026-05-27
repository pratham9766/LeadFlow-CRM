/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ink: '#1f2937',
      },
      boxShadow: {
        soft: '0 20px 45px rgba(15, 23, 42, 0.08)',
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease both',
        'soft-pulse': 'softPulse 2.2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        softPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.28)' },
          '50%': { boxShadow: '0 0 0 8px rgba(99, 102, 241, 0)' },
        },
      },
    },
  },
  plugins: [],
};
