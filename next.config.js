// /** @type {import('next').NextConfig} */
// const nextConfig = {
  // experimental: {
  //   appDir: true,
  // },
//   images: {
//     domains: ['localhost', 'example.com'],
//   },
//   async redirects() {
//     return [
//       {
//         source: '/',
//         destination: '/dashboard',
//         permanent: false,
//       },
//     ]
//   },
// }

// module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'example.com'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig