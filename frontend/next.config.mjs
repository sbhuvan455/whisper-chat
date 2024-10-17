// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
        {
            source: '/api/:path*', 
            destination: 'https://localhost:8000/api/:path*',
        },
        ];
    },
};

export default nextConfig;
