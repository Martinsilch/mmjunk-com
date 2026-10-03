/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.amzy.me',
      },
      {
        protocol: 'https',
        hostname: 's3-media*.fl.yelpcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mmjunk.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/services',
        destination: '/services/index.html',
      },
      {
        source: '/services/:path*',
        destination: '/services/:path*/index.html',
      },
      {
        source: '/jobs',
        destination: '/jobs/index.html',
      },
      {
        source: '/jobs/',
        destination: '/jobs/index.html',
      },
      {
        source: '/jobs/auburn-birch-tree-yard-waste-clearing',
        destination: '/jobs/auburn-birch-tree-yard-waste-clearing/index.html',
      },
      {
        source: '/jobs/auburn-birch-tree-yard-waste-clearing/',
        destination: '/jobs/auburn-birch-tree-yard-waste-clearing/index.html',
      },
      {
        source: '/jobs/auburn-playset-shed-demolition',
        destination: '/jobs/auburn-playset-shed-demolition/index.html',
      },
      {
        source: '/jobs/auburn-playset-shed-demolition/',
        destination: '/jobs/auburn-playset-shed-demolition/index.html',
      },
      {
        source: '/jobs/federal-way-commercial-refrigerator-extraction',
        destination: '/jobs/federal-way-commercial-refrigerator-extraction/index.html',
      },
      {
        source: '/jobs/federal-way-commercial-refrigerator-extraction/',
        destination: '/jobs/federal-way-commercial-refrigerator-extraction/index.html',
      },
      {
        source: '/jobs/federal-way-heavy-treadmill-disassembly',
        destination: '/jobs/federal-way-heavy-treadmill-disassembly/index.html',
      },
      {
        source: '/jobs/federal-way-heavy-treadmill-disassembly/',
        destination: '/jobs/federal-way-heavy-treadmill-disassembly/index.html',
      },
      {
        source: '/jobs/ne-tacoma-moving-cleanout',
        destination: '/jobs/ne-tacoma-moving-cleanout/index.html',
      },
      {
        source: '/jobs/ne-tacoma-moving-cleanout/',
        destination: '/jobs/ne-tacoma-moving-cleanout/index.html',
      },
      {
        source: '/jobs/tacoma-concrete-construction-debris-removal',
        destination: '/jobs/tacoma-concrete-construction-debris-removal/index.html',
      },
      {
        source: '/jobs/tacoma-concrete-construction-debris-removal/',
        destination: '/jobs/tacoma-concrete-construction-debris-removal/index.html',
      },
      {
        source: '/locations/federal-way-junk-removal',
        destination: '/junk-removal-federal-way-wa/index.html',
      },
      {
        source: '/locations/federal-way-junk-removal/',
        destination: '/junk-removal-federal-way-wa/index.html',
      },
      {
        source: '/locations/auburn',
        destination: '/junk-removal-auburn-wa/index.html',
      },
      {
        source: '/locations/auburn/',
        destination: '/junk-removal-auburn-wa/index.html',
      },
      {
        source: '/locations/tacoma',
        destination: '/junk-removal-tacoma-wa/index.html',
      },
      {
        source: '/locations/tacoma/',
        destination: '/junk-removal-tacoma-wa/index.html',
      },
      {
        source: '/locations/edgewood',
        destination: '/junk-removal-edgewood-wa/index.html',
      },
      {
        source: '/locations/edgewood/',
        destination: '/junk-removal-edgewood-wa/index.html',
      },
      {
        source: '/locations/kent',
        destination: '/junk-removal-kent-wa/index.html',
      },
      {
        source: '/locations/kent/',
        destination: '/junk-removal-kent-wa/index.html',
      },
      {
        source: '/privacy-policy',
        destination: '/privacy-policy/index.html',
      },
      {
        source: '/privacy-policy/',
        destination: '/privacy-policy/index.html',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/security.txt',
        destination: '/.well-known/security.txt',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llms-workflows.txt',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/llm-examples.md',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/.well-known/security.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/humans.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/knowledge/index.json',
        headers: [
          { key: 'Content-Type', value: 'application/json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/knowledge/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
