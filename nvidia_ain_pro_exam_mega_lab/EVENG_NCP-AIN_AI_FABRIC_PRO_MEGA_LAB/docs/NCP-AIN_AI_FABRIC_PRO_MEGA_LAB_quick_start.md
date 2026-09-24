# NCP-AIN AI Fabric Pro Mega Lab Quick Start

## 1. Use These Files First
- `docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_topology_2_poster.pdf`
- `docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_quick_start.pdf`
- `docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_workbook.pdf`
- `docs/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_spectrum_ready_node_mapping.md`

## 2. Node Types
- original topology: `RR1`, `RR2`, `SPINE1`, `SPINE2`, `LEAF1-4`, `BL1`, `BL2`, `PE1`, `PE2`, `REMOTE-DC` are EOS switch/router nodes.
- mixed topology: `RR1`, `RR2`, `SPINE1`, `SPINE2`, `PE1`, `PE2`, `REMOTE-DC` stay EOS, while `LEAF1-4` and `BL1-2` use NVIDIA Cumulus/NVUE.
- `GPU-A`, `GPU-B`, `GPU-C`, `STORAGE`, `COLLECTOR` are Ubuntu VMs.
- Cluster networks are dual-stack in the lab: IPv4 and IPv6.

## 3. Build Order
1. Import `topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB.unl`.
   Or import `topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl`.
2. Boot network nodes.
3. Apply configs in this order:
- `SPINE1`, `SPINE2`
- `RR1`, `RR2`
- `LEAF1`, `LEAF2`, `LEAF3`, `LEAF4`
- `BL1`, `BL2`
- `PE1`, `PE2`, `REMOTE-DC`
4. If using the mixed topology:
- use `configs/full_configs/` for EOS nodes
- use `configs/cumulus_5_4_paste_ready/` for `LEAF1-4` and `BL1-2` if you are on Cumulus Linux `5.4.0`
- `configs/cumulus_nvue/` remains the higher-level reference folder
- on Cumulus nodes, remember:
  - `swp1 = Ethernet1`
  - `swp2 = Ethernet2`
  - `swp3 = Ethernet10`
  - `swp4 = Ethernet11`
  - `swp5 = Ethernet20`
  - `swp6 = Ethernet21` on leaves or `Ethernet30` on border nodes
 - copy the matching `*_interfaces` file to `/etc/network/interfaces`
 - copy the matching `*_frr.conf` file to `/etc/frr/frr.conf`
 - or run the matching `*_apply.sh` script from inside that folder
5. Save running config.
6. Boot Ubuntu VMs.
7. Run:
- `sh GPU-A.sh`
- `sh GPU-B.sh`
- `sh GPU-C.sh`
- `sh STORAGE.sh`
- `sh COLLECTOR.sh`

## 4. First Checks
- `show ip ospf neighbor`
- `show bgp evpn summary`
- `show mlag`
- `nv show interface` on Cumulus nodes
- `vtysh -c "show bgp l2vpn evpn summary"` on Cumulus nodes
- `clagctl`
- `ip addr show bond0`
- `ip -6 addr show bond0`
- `cat /proc/net/bonding/bond0`

## 5. First Traffic Test
- On `GPU-B`: `iperf3 -s`
- On `GPU-A`: `iperf3 -c 172.16.110.12 -P 8`
- On `GPU-A`: `ping -c 3 -M do -s 8972 172.16.110.12`
- On `GPU-A`: `ping6 -c 3 2001:db8:110::12`
