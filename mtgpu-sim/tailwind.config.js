/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MTGPU-Sim theme. The `nvidia-*` token names are kept so every
        // existing component class keeps working; only the values change.
        nvidia: {
          green: '#22D3EE', // accent (cyan)
          darkgreen: '#0891B2', // accent, pressed/hover
          black: '#0B0F1A',
          gray: '#1D2436',
        },
        // Cool navy-slate neutrals replace Tailwind's default gray scale.
        gray: {
          50: '#F5F7FB',
          100: '#E9EDF5',
          200: '#D3D9E6',
          300: '#AEB8CC',
          400: '#8592AB',
          500: '#5F6B85',
          600: '#434E66',
          700: '#2E374C',
          800: '#1D2436',
          900: '#131828',
          950: '#0B0F1A',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      stroke: {
        'nvidia-green': '#22D3EE',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 300ms ease-out',
      },
    },
  },
  plugins: [],
}
