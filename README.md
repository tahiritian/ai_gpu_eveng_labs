# AI / GPU Infrastructure Labs

**Mohammad Tahir · Principal Network Engineer: AI/GPU cluster network design, build and validation**

Hands-on AI infrastructure work, built and tested on real GPU hardware and in EVE-NG. Every lab covers the design behind it, the build steps, and the validation results, the same way I would hand a cluster over to operations.

---

## Headline Results

| What | Result |
|---|---|
| 4-node NVIDIA DGX Spark (GB10) cluster across a 2-switch Juniper PTX fabric | RoCEv2 `ib_write_bw` at **~98 Gb/s** per port (line rate) |
| NCCL collectives, 4 nodes, 1–4 GB messages | AllReduce **23.7 GB/s** max busBW · AllGather **22.5 GB/s** · ReduceScatter **23.9 GB/s** |
| Throughput ceiling analysis | Documented why usable bandwidth caps at ~200–220 Gb/s per node: each ConnectX-7 HCA sits on a PCIe Gen5 x4 link |
| Distributed training | Multi-node PyTorch DDP job validated end to end across all 4 nodes |

---

## Labs

| Lab | What it demonstrates | Platform |
|---|---|---|
| [**DGX Spark Cluster Setup**](dgx_cluster_training_job_lab/Cluster-Setup/) | Physical cluster bring-up, RoCE fabric validation, RDMA and NCCL performance testing across a multi-switch topology | 4× DGX Spark, ConnectX-7, Juniper PTX10002 |
| [**Multi-Node Training Job**](dgx_cluster_training_job_lab/simple_training_job/) | Running a distributed training job over the RoCE fabric; NCCL env tuning and cluster sanity checks | DGX Spark, PyTorch DDP |
| [**NCP-AIN AI Fabric Pro Mega Lab**](nvidia_ain_pro_exam_mega_lab/) | Multi-tier AI fabric with border leaves, mixed-vendor build, day-1 runbook, broken-state troubleshooting pack | EVE-NG: Arista EOS + NVIDIA Cumulus |
| [**RoCEv2 / MPLS-LDP / EVPN-VXLAN**](eveng_rocev2_mpls_vxlan_lab/) | Underlay/overlay design with per-protocol validation, soft-RoCE RDMA testing, QoS and IPv6 workbook | EVE-NG: Arista + Cumulus/FRR |
| [**Flat ShuffleBox / Spraypoint Fabric**](eveng_flat_shufflebox_arista_lab/) | Design concept: flat quasi-random fabric with a fixed cabling matrix, ECMP spraying and failure-domain testing | EVE-NG: 8× Arista |
| [**MTGPU-Sim**](mtgpu-sim/) | Browser-based 8-node / 64-GPU cluster simulator with 40 guided bring-up and troubleshooting scenarios | Node.js, runs locally |

---

## Background

- Led network build-outs end to end, from BOMs and cutsheets through validation and operations handoff, for public cloud regions, child sites, multicloud, dedicated cloud and AI/GPU cluster front-end networks.
- Focus now: AI/GPU cluster fabrics: back-end scale-out design, RoCE/InfiniBand, lossless Ethernet, and cluster acceptance testing.
- Certifications: NVIDIA-Certified Professional AI Networking (NCP-AIN), NVIDIA-Certified Associate AI Infrastructure & Operations (NCA-AIIO), Nebius AI CloudOps Engineer, AWS Certified AI Practitioner.

## Connect

- LinkedIn: [Mohammad Tahir](https://www.linkedin.com/in/mohammadtahir/)
- GitHub: [@tahiritian](https://github.com/tahiritian)

> Shared for learning and reference. Configs and scripts were tested in my environment; adjust them for yours.
