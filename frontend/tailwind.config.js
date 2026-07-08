/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette KATASHIE — Hacker/Matrix/Cybersécurité
        black: '#000000',
        'gray-950': '#020204',
        'gray-900': '#0a0a0f',
        'gray-800': '#111118',
        'gray-700': '#1a1a24',
        'gray-600': '#252530',
        'gray-500': '#3a3a4a',
        'gray-400': '#5a5a70',
        'gray-300': '#8a8aa0',
        'gray-200': '#b0b0c0',
        'gray-100': '#d0d0dc',
        white: '#f0f0f8',
        // Accents
        green: {
          400: '#00ff41',
          500: '#00cc33',
          600: '#009922',
          900: '#001a08',
        },
        cyan: {
          400: '#00d4ff',
          500: '#00a8cc',
          900: '#001a22',
        },
        red: {
          400: '#ff3366',
          500: '#cc1144',
          900: '#1a000a',
        },
        yellow: {
          400: '#ffd700',
          500: '#ccaa00',
          900: '#1a1600',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'scan': 'scan 3s linear infinite',
        'glitch': 'glitch 0.5s ease-in-out infinite',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        'pulse-green': { '0%, 100%': { boxShadow: '0 0 5px #00ff41, 0 0 10px #00ff41' }, '50%': { boxShadow: '0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 60px #00ff41' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        glitch: {
          '0%, 100%': { textShadow: '2px 0 #00ff41, -2px 0 #00d4ff' },
          '25%': { textShadow: '-2px 0 #00ff41, 2px 0 #ff3366' },
          '50%': { textShadow: '2px 0 #ff3366, -2px 0 #00d4ff' },
          '75%': { textShadow: '-2px 0 #00d4ff, 2px 0 #00ff41' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)',
        'terminal-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
