# NCP-AIN AI Fabric Pro Mega Lab 
`By: Mohammad Tahir`

## Start Here

Read these in order:
`
1. [Topology Poster] => (docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_topology_2_poster.pdf)
2. [Quick Start Guide] => (docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_quick_start.pdf)
3. [Lab Workbook] => (docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_workbook.pdf)
`
## Import into EVE-NG

Pick one topology:

| Topology File | Build |
|---|---|
| [`topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB.unl`](topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB.unl) | All Arista EOS |
| [`topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl`](topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl) | Mixed Arista EOS + NVIDIA Cumulus |

Steps:

1. Copy the `.unl` file to your EVE-NG server, for example:
   ```bash
   scp topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB.unl root@<eve-ng-ip>:/opt/unetlab/labs/
   ```
2. Adjust template or image names if needed to match the images installed on your EVE-NG server.
3. Fix permissions on EVE-NG:
   ```bash
   /opt/unetlab/wrappers/unl_wrapper -a fixpermissions
   ```

## Config Sets

| Folder | Contents |
|---|---|
| [`configs/full_configs/`](configs/full_configs/) | Original Arista EOS configs for all network nodes |
| [`configs/cumulus_nvue/`](configs/cumulus_nvue/) | NVIDIA Cumulus / NVUE startup references for LEAF1–4 and BL1–2 |
| [`configs/cumulus_5_4_paste_ready/`](configs/cumulus_5_4_paste_ready/) | Paste-ready Cumulus Linux 5.4 interfaces, FRR, and apply scripts for LEAF1–4 and BL1–2 |
