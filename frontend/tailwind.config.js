/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif']
      },
      colors: {
        // Brand: violet → fuchsia → cyan dusk
        ink: {
          950: '#070512',
          900: '#0b0820',
          800: '#13102d',
          700: '#1c1740',
          600: '#2a2358'
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95'
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2'
        },
        fuchsia: {
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3'
        },
        // Semantic — promoted from chip variants so buttons / banners / inputs
        // can reuse the same palette.
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669'
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        },
        danger: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48'
        },
        info: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7'
        }
      },
      backgroundImage: {
        'mesh-aurora':
          'radial-gradient(at 20% 10%, rgba(139,92,246,0.35) 0px, transparent 50%),' +
          'radial-gradient(at 80% 0%, rgba(34,211,238,0.30) 0px, transparent 50%),' +
          'radial-gradient(at 80% 80%, rgba(217,70,239,0.30) 0px, transparent 50%),' +
          'radial-gradient(at 10% 80%, rgba(124,58,237,0.30) 0px, transparent 50%)'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 10px 40px -10px rgba(139,92,246,0.45)',
        'glow-lg': '0 0 0 1px rgba(255,255,255,0.06), 0 20px 80px -20px rgba(139,92,246,0.55)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)'
      },
      animation: {
        'aurora-shift': 'auroraShift 18s ease-in-out infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'fade-in': 'fadeIn .4s ease-out both',
        shimmer: 'shimmer 2.2s linear infinite'
      },
      keyframes: {
        auroraShift: {
          '0%, 100%': { backgroundPosition: '0% 50%, 100% 0%, 100% 100%, 0% 100%' },
          '50%': { backgroundPosition: '100% 50%, 0% 100%, 0% 0%, 100% 0%' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
};
