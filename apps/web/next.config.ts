import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Without this Next infers the wrong root in a monorepo and over-traces files.
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
}

export default nextConfig
