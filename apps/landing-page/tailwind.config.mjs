import sharedConfig from "../../packages/ui/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
    ...sharedConfig,
    content: [
        './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    ],
}

