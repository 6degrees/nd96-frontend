// next.config.js — see docs/FRONTEND-SPEC.md §2 "Four hard rules for the Next build"
module.exports = {
  output: 'export',              // 1. static only
  images: { unoptimized: true }, // 2. next/image needs a server; don't
  trailingSlash: true,           //    plays nicer behind nginx / Laravel public/
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
};
