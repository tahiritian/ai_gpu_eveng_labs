NCP-AIN AI Fabric Pro Mega Lab

Start with:
1. docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_topology_2_poster.pdf
2. docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_quick_start.pdf
3. docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_workbook.pdf

Import:
- copy topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB.unl into EVE-NG
- or copy topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl for a mixed Arista + NVIDIA Cumulus build
- adjust template or image names if needed
- run fixpermissions on EVE-NG

Config sets:
- configs/full_configs/ = original EOS configs for all network nodes
- configs/cumulus_nvue/ = NVIDIA Cumulus / NVUE startup references for LEAF1-4 and BL1-2
- configs/cumulus_5_4_paste_ready/ = paste-ready Cumulus Linux 5.4 interfaces, FRR, and apply scripts for LEAF1-4 and BL1-2
