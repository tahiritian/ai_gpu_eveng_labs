# DGX Spark Cluster Lab Simulator (final, v6 · 2026-10-13)

A browser-based simulator of the 4-node DGX Spark RoCEv2 lab in
`ai_gpu_eveng_labs/dgx_cluster_training_job_lab`. Author: Mohammad Tahir.

The front page has a **Launch-Lab** panel with three labs:

| Lab | Switches | Switch CLI | Ports to Sparks / ISL / LAG |
|---|---|---|---|
| DGX Spark Cluster Lab (Arista) | 2 × DCS-7060DX5-64S | Arista EOS | Ethernet1-8 / Ethernet49-50 / Port-Channel10 (MTU 9214) |
| DGX Spark Cluster Lab (Juniper) | 2 × PTX10002-36QDD | Junos OS Evolved | et-0/0/0-7 / et-0/0/34-35 / ae0 (MTU 9216) |
| DGX Spark Cluster Lab (Cisco Nexus) | 2 × N9K-C9332D-GX2B | Cisco NX-OS | Ethernet1/1-1/8 / Ethernet1/31-32 / port-channel10 (MTU 9216) |

The DGX nodes, GPUs, tests and faults are identical in every lab; only the switches
and their CLI change. Every task and command from the repo runs in a simulated
terminal with representative sample outputs, plus six injectable faults and a live
results panel. Open a lab directly with `index.html#arista`, `#juniper` or `#nexus`
when served from the local server.

No install, no GPU, no network needed. Everything is in `index.html`.

## Run it

Pick one:

| Option | How |
|---|---|
| Easiest | Double-click `index.html` (opens in your default browser) |
| macOS local server | Double-click `start.command` (first time: right-click > Open, because macOS blocks unsigned scripts) |
| macOS / Linux terminal | `./start.sh` then open http://localhost:8765 |
| Windows | Double-click `start.bat` |

The server option needs only the `python3` that ships with macOS. Stop it with Ctrl+C.

## What's new in this version

- **Workbench layout:** the lab fills the window like an IDE: steps on the left, terminal in the middle, fabric, faults and results on the right, each scrolling on its own. Drag the thin lines between them to resize (double-click resets). The terminal toolbar has buttons to hide the steps or fabric panel, change the text size (A- / A+) and maximize the terminal (Esc exits). Your layout is remembered per browser.
- **Look:** black terminal with a green prompt and colour-coded output: green for healthy or passing states, red for failures and errors, yellow for warnings and pending states, cyan for IP addresses, blue for NIC and RDMA device names, and bold for bandwidth, clocks and similar metrics.
- **Terminal:** **Tab** completes commands and arguments (press it again to list the options; Tab on an empty line lists every command). Selecting text copies it, clicking a command you ran copies that command, and **copy output** copies the last command with its output. Paste works anywhere on the page. **Ctrl+C** cancels the line, **Ctrl+U** clears it.
- **Fabric hover:** hover over (or tap) a link for both ends: netdev, RDMA device, PCIe half, IP, GID, host/RDMA MTU, switch port, VLAN, switch MTU, PFC state, traffic, and any fault on that path. Hover over the ISL, a switch or a node for its own summary, including live GPU utilization, temperature and power.
- **Step 14, NIC and RoCE deep checks:** `lspci -vv` (Gen5 x4 link), `ibstat`, `ethtool -i/-m/-a`, `mlnx_qos` (trust DSCP + PFC 3), `cma_roce_mode`, `ib_write_lat`/`ib_send_lat`/`ib_read_lat`, `ib_read_bw`/`ib_send_bw`, `rdma statistic` and the sysfs `hw_counters` (CNP, ECN, out_of_buffer).
- **Step 15, GPU health and telemetry:**
  - `nvidia-smi -q [-d …]`, `--query-gpu=… --format=csv[,noheader,nounits]`, `--query-compute-apps`, `dmon`, `pmon`, `topo -m`, `nvlink`, `mig`, `-pm`, `-pl`, `-r`
  - DCGM: `dcgmi discovery`, `diag -r 1-4`, `health`, `dmon -e … / -l`, `group -l`
  - CUDA samples (`deviceQuery`, `vectorAdd`, `bandwidthTest`), `gpu_burn`, `docker run --gpus all`
  - `dcgm-exporter` with `curl localhost:9400/metrics`, plus `free -h`, `lscpu`, `lsmod` and `nvidia-bug-report.sh`

  GPU metrics follow the work you run: NCCL, PyTorch or gpu-burn raise utilization, clocks, power and temperature.
- **Step 16, Kubernetes cluster and GPU Operator:**
  - `kubeadm init/join`, kubeconfig, flannel CNI, the control-plane taint
  - Helm and the NVIDIA GPU Operator (`driver.enabled=false` for DGX OS)
  - GPU resources and labels per node, a `cuda-vectoradd` pod, `nvidia-smi` in a pod, and the DCGM exporter through `port-forward`
- **Step 17, Kubernetes NCCL across nodes:** the NVIDIA Network Operator with a NicClusterPolicy (RDMA shared device plugin) and the MPI Operator, plus an `MPIJob` running `all_reduce_perf` on 4 workers (hostNetwork + `nvidia.com/gpu` + `rdma/rdma_shared_device_a`) with launcher logs.

## Use it

1. Work through **Lab steps** top to bottom. Click a command chip to run it, or type
   commands in the terminal (`help` lists them). Multi-line blocks such as netplan
   files can be pasted as-is.
2. Switch terminals with the tabs (dgx-01..04 and the two switches) or by clicking a box
   in the **Fabric** diagram.
3. Each step lists its **pass criteria**. They are not buttons: they tick automatically
   when a command's output shows the expected result. A half-filled dot with "1 of 4 nodes"
   means the criterion has passed on some nodes but not all yet. The **Results** grid
   fills in as tests run.
4. Use **Fault injection**: turn on a named fault, or "Inject a hidden fault" and find
   it with the validation commands. Fix it with real commands (switch `configure` /
   `commit`, netplan, `export`, `sudo reboot`).
5. "Reset lab" (click twice) starts over. State is kept in memory only.

## What is simulated

- Netplan, `ip`, `ping` (incl. 9000-byte `-M do`), `show_gids`, `rdma link`,
  `ibv_devices`, `ibv_devinfo`, `ibdev2netdev`, RDMA MTU check and fix
- `discover-sparks`, `ssh`, `scp`, `mpirun` hostname check
- `nvidia-smi`, `nvcc`, `dmesg | grep -i xid`, `reboot`
- `ib_write_bw` server/client and `full_mesh_ib_wr.sh`
- NCCL and nccl-tests build; `all_gather_perf`, `all_reduce_perf`, `alltoall_perf`,
  `reduce_scatter_perf` on 2 and 4 nodes; `NCCL_DEBUG=INFO`
- `ethtool -S`, `/sys/class/net/*/statistics`
- PyTorch venv + install, `torchrun` of `dist_check.py` and `train_ddp_spark.py`,
  checkpoint inspection
- Junos: `show interfaces terse|extensive`, `show lldp neighbors`,
  `show lacp interfaces ae0`, `show ethernet-switching table`,
  `show class-of-service interface`, optics, `monitor interface traffic`,
  `configure` / `set` / `delete` / `show | compare` / `commit`
- Arista EOS: `show interfaces status|EthernetN|counters rates`, `show lldp neighbors`,
  `show port-channel 10 detailed`, `show mac address-table`, `show priority-flow-control [counters]`,
  `show running-config interfaces …`, `configure` / `interface …` / `mtu` / `shutdown` /
  `priority-flow-control on` / `end` / `write memory`
- Cisco NX-OS: `show interface brief|ethernet1/N|counters|priority-flow-control`,
  `show lldp neighbors`, `show port-channel summary`, `show mac address-table`,
  `show running-config interface …`, `configure terminal` / `interface …` / `mtu` /
  `shutdown` / `priority-flow-control mode on` / `end` / `copy running-config startup-config`

## Faults

| Fault | Arista fix | Juniper fix | Cisco Nexus fix |
|---|---|---|---|
| DGX-04 netplan as written in the repo | dgx-04: corrected netplan, `sudo netplan apply` | same | same |
| ISL down | arista-sw1: `configure` · `interface Port-Channel10` · `no shutdown` · `end` | ptx-sw1: `configure` · `delete interfaces ae0 disable` · `commit` | nx-sw1: `configure terminal` · `interface port-channel10` · `no shutdown` · `end` |
| Switch port MTU 1500 toward DGX-04 | arista-sw2: `interface Ethernet5` · `mtu 9214` | ptx-sw2: `set interfaces et-0/0/4 mtu 9216` · `commit` | nx-sw2: `interface ethernet1/5` · `mtu 9216` |
| PFC removed | each switch: `interface Ethernet1-8` · `priority-flow-control on` · `priority-flow-control priority 3 no-drop` | each switch: `set class-of-service interfaces et-0/0/* congestion-notification-profile rocev2-pfc` · `commit` | each switch: `interface ethernet1/1-8` · `priority-flow-control mode on` |
| Stray `NCCL_IB_DISABLE=1` in dgx-01 `~/.bashrc` | dgx-01: `export NCCL_IB_DISABLE=0` | same | same |
| DGX-03 GPU fell off the bus (XID 79) | dgx-03: `sudo reboot` | same | same |

## Notes

- Outputs are representative samples modeled on the repo's recorded runs
  (~98 Gb/s RDMA, NCCL busbw per the repo table). They are not real hardware output.
- Management IPs 10.0.151.249-252 stand in for the masked `x.x.151.x` addresses.
- Fonts load from Google Fonts when online; offline the page falls back to system fonts.
- GPU values for the GB10 (clocks, deviceQuery fields, DCGM and bandwidth numbers) are representative, chosen to behave sensibly. Treat them as illustrations, not reference data.
- The Kubernetes steps model a basic kubeadm cluster with preinstalled kubeadm/kubelet/containerd. The MPIJob worker image (`10.0.151.249:5000/nccl-tests:cuda13-arm64`) stands for an image you build yourself with nccl-tests for CUDA 13 on arm64.
