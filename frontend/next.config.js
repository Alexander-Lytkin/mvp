/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn-images.dzcdn.net", pathname: "/images/**" },
      { protocol: "https", hostname: "e-cdns-images.dzcdn.net", pathname: "/images/**" }
    ]
  }
};

module.exports = nextConfig;
