import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'tr', 'bg'],

    // Used when no locale matches
    defaultLocale: 'tr'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(tr|en|bg)/:path*']
};
