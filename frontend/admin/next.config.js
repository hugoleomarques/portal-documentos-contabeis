/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: {
        unoptimized: true,
    },
    basePath: '/portal-documentos-contabeis',
    assetPrefix: '/portal-documentos-contabeis/',
}

module.exports = nextConfig
