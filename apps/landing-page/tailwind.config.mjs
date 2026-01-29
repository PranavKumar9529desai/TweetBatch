import sharedConfig from "../../packages/ui/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
    ...sharedConfig,
    content: [
        './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            ...sharedConfig.theme?.extend,
            animation: {
                ...sharedConfig.theme?.extend?.animation,
                'gradient': 'gradient 8s linear infinite',
            },
            keyframes: {
                ...sharedConfig.theme?.extend?.keyframes,
                'gradient': {
                    '0%, 100%': {
                        'background-position': '0% 50%',
                    },
                    '50%': {
                        'background-position': '100% 50%',
                    },
                },
            },
        },
    },
}
