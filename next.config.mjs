/** @type {import("next").NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module; load it from node_modules at runtime.
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Recipe files can be a few MB.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
