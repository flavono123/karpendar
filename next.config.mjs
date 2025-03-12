/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Configure Ace workers as per solution in https://github.com/cloudscape-design/components/issues/703#issuecomment-1453783791
    config.module.rules.push({
      test: /ace\-builds.*\/worker\-.*$/,
      type: "asset/resource",
    });
    return config;
  }
};

export default nextConfig;
