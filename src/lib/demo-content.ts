const demoContentFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO_CONTENT;

export const isDemoContentEnabled = demoContentFlag
    ? demoContentFlag === 'true'
    : process.env.NODE_ENV !== 'production';
