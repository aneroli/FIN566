/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger file uploads
  api: {
    bodyParser: false,
  },
}

module.exports = nextConfig
