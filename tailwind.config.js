/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        game: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'shake': 'shake 0.5s ease-in-out',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slam': 'slam 0.3s ease-out',
        'health-drain': 'healthDrain 0.5s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        slam: {
          '0%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        healthDrain: {
          '0%': { backgroundColor: '#ef4444' },
          '100%': { backgroundColor: '#22c55e' },
        },
      },
      colors: {
        'neon-blue': '#00f5ff',
        'neon-green': '#39ff14',
        'neon-purple': '#bf00ff',
        'neon-red': '#ff0040',
        'neon-gold': '#ffd700',
        'neon-orange': '#ff6600',
      },
    },
  },
  plugins: [],
}
