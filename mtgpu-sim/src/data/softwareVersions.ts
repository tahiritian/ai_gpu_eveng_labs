/**
 * Default NVIDIA driver / CUDA versions.
 *
 * Simulators read the live values from `node.nvidiaDriverVersion` and
 * `node.cudaVersion` (set per architecture in clusterFactory.ts). These
 * constants are only the fallback used when a node has no value — kept in
 * one place so they cannot drift between simulators.
 */
export const DEFAULT_DRIVER_VERSION = "535.129.03";
export const DEFAULT_CUDA_VERSION = "12.2";
