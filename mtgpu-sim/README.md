# MTGPU-Sim
``` Mohammad Tahir ```

A browser-based GPU cluster lab. It simulates an 8-node DGX cluster (64 GPUs) with a realistic terminal, a live dashboard and story-driven troubleshooting labs. Everything runs locally in your browser. No GPUs, VMs or accounts needed.

The app has two views:

- **Simulator**: cluster dashboard, interactive terminal and a sandbox for injecting faults.
- **Labs**: 40 guided scenarios covering bring-up, fabric, control plane, validation and troubleshooting.

## Requirements

- Node.js 20 or 22 (LTS) and npm
- A modern desktop browser (best at 1280 px wide or more)

## Install and run

```bash
cd mtgpu-sim
npm install
npm run dev
```

Open http://localhost:5173. Press `Ctrl+C` in the terminal to stop the server.

## Commands

| Command                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Start the dev server (localhost:5173)     |
| `npm run build`         | Type-check and build to `dist/`           |
| `npm run preview`       | Serve the production build locally        |
| `npm run test:run`      | Run the unit tests once                   |
| `npm test`              | Run the unit tests in watch mode          |
| `npm run test:coverage` | Unit tests with a coverage report         |
| `npm run lint`          | Lint the source                           |

If `npm install` fails, run `rm -rf node_modules && npm install`.

## Try it

Type these in the Simulator terminal:

```bash
nvidia-smi              # GPU status
nvidia-smi topo -m      # GPU/NVLink topology
ibstat                  # InfiniBand port status
dcgmi diag -r 1         # Quick GPU health check
ipmitool sensor list    # BMC sensors
sinfo                   # Slurm node states
ssh dgx-04              # Move to another node
help nvidia-smi         # Command reference
hint                    # Help during a lab
```

Terminal shortcuts: `Tab` completes, `Up`/`Down` browse history, `Ctrl+R` searches history, and pipes work (`dmesg | grep -i xid`).

## Tips

- Switch the cluster architecture (A100, H100, H200, B200, GB200, VR200) from the dashboard. All output adapts.
- Use the Sandbox to inject faults (XID, ECC, thermal, NVLink, PCIe, power), then diagnose them from the terminal.
- Progress is saved in your browser. Use the reset button in the header to start the cluster fresh.

## Notes

Simulated output is approximate and intended for learning. Product names are trademarks of their respective owners. Licensed under MIT; see `LICENSE`.
