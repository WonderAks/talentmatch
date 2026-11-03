/** @type {import('next').NextConfig} */
const nextConfig = {
  // native / WASM packages used by the embedding model must not be bundled
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
};
export default nextConfig;
