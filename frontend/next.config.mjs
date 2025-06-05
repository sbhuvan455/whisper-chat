// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:8080/api/:path*`,
        permanent: true
      },
    ];
  },
};

export default nextConfig;
