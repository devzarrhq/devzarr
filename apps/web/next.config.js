/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No experimental.outputFileTracing flag here, so output tracing is enabled by default.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig