NVIDIA Cumulus / NVUE config pack for Spectrum-role nodes

Scope:
- LEAF1
- LEAF2
- LEAF3
- LEAF4
- BL1
- BL2

What these files are:
- node-specific startup guides with:
  - EVE-NG port-to-swp mapping
  - NVUE intent sections to apply
  - FRR blocks for OSPF and BGP EVPN

Important:
- these are for the mixed topology file:
  topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl
- use your local EVE-NG Cumulus image name if it differs from `cumulus-vx`
- on Cumulus VX, the first management NIC is usually `eth0`
- the lab data-plane NICs are expected to appear as `swp1` through `swp6`

Inside the mixed topology, the Cumulus port mapping is:
- `swp1` = EVE `Ethernet1`
- `swp2` = EVE `Ethernet2`
- `swp3` = EVE `Ethernet10`
- `swp4` = EVE `Ethernet11`
- `swp5` = EVE `Ethernet20`
- `swp6` = EVE `Ethernet21` on leaves or `Ethernet30` on border nodes

Recommended build order:
1. boot RR1, RR2, SPINE1, SPINE2, PE1, PE2, REMOTE-DC with EOS configs
2. boot LEAF1-4 and BL1-2 with Cumulus
3. apply the node startup files in this folder
4. boot Ubuntu hosts and run host scripts in configs/hosts/

Files:
- LEAF1_startup.txt
- LEAF2_startup.txt
- LEAF3_startup.txt
- LEAF4_startup.txt
- BL1_startup.txt
- BL2_startup.txt
