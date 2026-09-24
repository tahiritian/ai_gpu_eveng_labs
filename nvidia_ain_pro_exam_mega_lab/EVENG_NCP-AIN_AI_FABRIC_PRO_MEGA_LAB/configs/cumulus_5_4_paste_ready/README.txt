Paste-ready Cumulus Linux 5.4 configs for Spectrum-role nodes

Target image:
- cumulus-linux-5.4.0-vx-amd64-qemu.qcow2

Use with:
- topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl

Nodes covered:
- LEAF1
- LEAF2
- LEAF3
- LEAF4
- BL1
- BL2

Each node has:
- *_interfaces
- *_frr.conf
- *_apply.sh

Port mapping in this mixed topology:
- swp1 = EVE Ethernet1
- swp2 = EVE Ethernet2
- swp3 = EVE Ethernet10
- swp4 = EVE Ethernet11
- swp5 = EVE Ethernet20
- swp6 = EVE Ethernet21 on leaves
- swp6 = EVE Ethernet30 on BL1/BL2

Notes:
- The configs use MLAG, VRR, EVPN/VXLAN active-active, and FRR on Cumulus 5.4.
- The gateway MAC uses the supported Cumulus VRR range instead of the EOS virtual-router MAC.
- The underlay remains OSPF in the default VRF.
- RR1/RR2 stay EOS route reflectors.
- The configs are designed to be pasted as files, then applied with the per-node *_apply.sh helper.
