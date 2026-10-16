/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', './index.ts', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['OddlyCalming', 'PatrickHand_400Regular', 'sans-serif'],
        serif: ['OddlyCalming', 'PatrickHand_400Regular', 'serif'],
        calming: ['OddlyCalming', 'PatrickHand_400Regular', 'casual'],
      },
      fontSize: {
        'display-sm': ['28px', { lineHeight: '34px' }],
        'headline-md': ['18px', { lineHeight: '24px' }],
        'headline-sm': ['16px', { lineHeight: '22px' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'body-md': ['14px', { lineHeight: '20px' }],
        'body-sm': ['13px', { lineHeight: '18px' }],
        'label-lg': ['15px', { lineHeight: '20px' }],
        'label-md': ['14px', { lineHeight: '18px' }],
        'label-sm': ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
      boxShadow: {
        // NOTE: these only render on web/RN-web. iOS reads shadow-color/opacity/radius
        // from style props, Android ignores CSS shadows entirely and needs `elevation`.
        // Use the useElevation() helper (see plan) for native card shadows instead.
        soft: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.08)',
        card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
