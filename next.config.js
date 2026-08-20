/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://*.google.com https://*.daily.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.google.com https://*.daily.co wss://*.daily.co; img-src 'self' data: https:; media-src 'self' blob: mediastream:; frame-src 'self' https://*.firebaseapp.com https://*.daily.co;"
          }
        ]
      }
    ];
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  async redirects() {
    return [
      { source: '/consultation', destination: '/consultations', permanent: false },
    ];
  },
}

module.exports = nextConfig