import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Neon colors for direct usage
        neon: {
          purple: '#9933ff',
          cyan: '#00f0ff',
          green: '#00ff88',
          magenta: '#ff00ff',
          yellow: '#ffff00',
          orange: '#ff8800',
          red: '#ff3366',
        },
        // Cyber backgrounds
        cyber: {
          deep: '#0a0a0f',
          dark: '#12121a',
          card: '#1a1a24',
          elevated: '#22222e',
        },
        // Chart colors
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(153, 51, 255, 0.3)',
        'neon-purple-lg': '0 0 30px rgba(153, 51, 255, 0.4), 0 0 60px rgba(153, 51, 255, 0.2)',
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-cyan-lg': '0 0 30px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.2)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.3)',
        'neon-red': '0 0 20px rgba(255, 51, 102, 0.3)',
        'neon-sm': '0 0 10px rgba(153, 51, 255, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-cyan': 'glow-cyan 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(153, 51, 255, 0.2)' },
          to: { boxShadow: '0 0 25px rgba(153, 51, 255, 0.5)' },
        },
        'glow-cyan': {
          from: { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' },
          to: { boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
