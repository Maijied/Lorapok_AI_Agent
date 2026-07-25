const repoName = process.env.GITHUB_REPOSITORY?.split("/") || "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: repoName ? `/${repoName}` : "",
  assetPrefix: repoName ? `/${repoName}/` : ""
};

export default nextConfig;