# NCP-AIN AI Fabric Pro Mega Lab: Cumulus 5.4 Day-1 Bring-Up Runbook

Use this runbook when you are using:

- `topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl`
- `cumulus-linux-5.4.0-vx-amd64-qemu.qcow2`
- `configs/cumulus_5_4_paste_ready/`

This is a strict day-1 order of operations.

## 1. Before You Boot

Confirm these files exist:

- `topology/NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl`
- `configs/full_configs/`
- `configs/cumulus_5_4_paste_ready/`
- `configs/hosts/`

Use this node split:

- EOS nodes:
  - `RR1`, `RR2`
  - `SPINE1`, `SPINE2`
  - `PE1`, `PE2`
  - `REMOTE-DC`
- Cumulus nodes:
  - `LEAF1`, `LEAF2`, `LEAF3`, `LEAF4`
  - `BL1`, `BL2`
- Ubuntu VMs:
  - `GPU-A`, `GPU-B`, `GPU-C`, `STORAGE`, `COLLECTOR`

## 2. Import And Boot Order

1. Import `NCP-AIN_AI_FABRIC_PRO_MEGA_LAB_mixed_eos_cumulus.unl`
2. Boot only:
   - `SPINE1`, `SPINE2`
   - `RR1`, `RR2`
   - `PE1`, `PE2`, `REMOTE-DC`
3. Boot:
   - `LEAF1`, `LEAF2`, `LEAF3`, `LEAF4`
   - `BL1`, `BL2`
4. Leave Ubuntu VMs powered off until the network is stable

## 3. Apply EOS Nodes First

Apply the existing EOS configs from `configs/full_configs/` in this order:

1. `SPINE1`
2. `SPINE2`
3. `RR1`
4. `RR2`
5. `PE1`
6. `PE2`
7. `REMOTE-DC`

Initial EOS validation:

```text
show ip ospf neighbor
show bgp evpn summary
show ip bgp summary
show ip route 203.0.113.0
```

What good looks like:

- spines have OSPF neighbors to route reflectors and all fabric-facing leaves once the leaves come up
- RR1 and RR2 are ready for EVPN sessions
- PE and remote edge routing is loaded with no interface errors

## 4. Verify Cumulus Port Mapping Before Applying Files

On each Cumulus node, log in and verify the expected `swp` ordering:

```bash
ip -br link
nv show interface
```

Expected mapping:

- `swp1 = Ethernet1`
- `swp2 = Ethernet2`
- `swp3 = Ethernet10`
- `swp4 = Ethernet11`
- `swp5 = Ethernet20`
- `swp6 = Ethernet21` on `LEAF1-4`
- `swp6 = Ethernet30` on `BL1/BL2`

If this is wrong, stop and adjust before applying configs.

## 5. Apply LEAF1

From the `configs/cumulus_5_4_paste_ready/` folder on `LEAF1`:

```bash
sudo cp LEAF1_interfaces /etc/network/interfaces
sudo cp LEAF1_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
```

Validate `LEAF1`:

```bash
hostname
ip -br addr
ip -d link show peerlink
bridge vlan show
clagctl
vtysh -c "show ip ospf neighbor"
vtysh -c "show bgp l2vpn evpn summary"
```

Look for:

- hostname `LEAF1`
- `swp1` and `swp2` have `/31` addresses
- `peerlink` exists and is up once `LEAF2` is configured
- VLANs `110 120 130 210 4094` exist on the bridge
- OSPF neighbors to `SPINE1` and `SPINE2`
- EVPN neighbors to `RR1` and `RR2`

## 6. Apply LEAF2

```bash
sudo cp LEAF2_interfaces /etc/network/interfaces
sudo cp LEAF2_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
```

Validate `LEAF2`:

```bash
hostname
ip -br addr
ip -d link show peerlink
bridge vlan show
clagctl
vtysh -c "show ip ospf neighbor"
vtysh -c "show bgp l2vpn evpn summary"
```

Extra MLAG validation on both `LEAF1` and `LEAF2`:

```bash
clagctl
ip -br addr show peerlink.4094
bridge link show
```

What good looks like:

- `peerlink.4094` is present on both nodes
- `clagctl` shows the peer as alive
- both uplink OSPF adjacencies are established
- EVPN to both route reflectors is established

## 7. Apply LEAF3 And LEAF4

On `LEAF3`:

```bash
sudo cp LEAF3_interfaces /etc/network/interfaces
sudo cp LEAF3_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
```

On `LEAF4`:

```bash
sudo cp LEAF4_interfaces /etc/network/interfaces
sudo cp LEAF4_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
```

Validate both:

```bash
clagctl
vtysh -c "show ip ospf neighbor"
vtysh -c "show bgp l2vpn evpn summary"
bridge vlan show
ip -br addr
```

What good looks like:

- MLAG pair up on `LEAF3/LEAF4`
- OSPF neighbors to both spines
- EVPN neighbors to both route reflectors
- `VLAN120` present for storage edge

## 8. Apply BL1 And BL2

On `BL1`:

```bash
sudo cp BL1_interfaces /etc/network/interfaces
sudo cp BL1_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
```

On `BL2`:

```bash
sudo cp BL2_interfaces /etc/network/interfaces
sudo cp BL2_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
```

Validate border pair:

```bash
clagctl
ip -br addr show swp6
vtysh -c "show ip ospf neighbor"
vtysh -c "show bgp summary"
vtysh -c "show bgp l2vpn evpn summary"
vtysh -c "show ip route 203.0.113.0/24"
```

What good looks like:

- MLAG peer alive between `BL1` and `BL2`
- `swp6` has:
  - `198.51.100.0/31` on `BL1`
  - `198.51.100.2/31` on `BL2`
- external BGP up:
  - `BL1 <-> PE1`
  - `BL2 <-> PE2`
- EVPN to RR1 and RR2 is up

## 9. Fabric-Wide Validation Before Hosts

Run these checks:

On EOS spines:

```text
show ip ospf neighbor
show ip route ospf
```

On each Cumulus fabric node:

```bash
vtysh -c "show ip ospf neighbor"
vtysh -c "show bgp l2vpn evpn summary"
bridge vlan show
clagctl
```

What good looks like:

- every leaf and border node sees both spines in OSPF
- every leaf and border node sees both route reflectors in EVPN
- every MLAG pair is healthy

## 10. Boot Ubuntu Hosts

Boot:

- `GPU-A`
- `GPU-B`
- `GPU-C`
- `STORAGE`
- `COLLECTOR`

Run on each host:

```bash
sh GPU-A.sh
sh GPU-B.sh
sh GPU-C.sh
sh STORAGE.sh
sh COLLECTOR.sh
```

## 11. Host Validation

On each Ubuntu host:

```bash
ip addr show bond0
ip -6 addr show bond0
cat /proc/net/bonding/bond0
ip route
ip -6 route
```

What good looks like:

- `bond0` exists
- both `eth0` and `eth1` are active bond members
- IPv4 and IPv6 are both configured
- default route points to the anycast gateway in the correct subnet

## 12. End-to-End Traffic Validation

On `GPU-B`:

```bash
iperf3 -s
```

On `GPU-A`:

```bash
ping -c 3 172.16.110.12
ping -c 3 -M do -s 8972 172.16.110.12
ping6 -c 3 2001:db8:110::12
iperf3 -c 172.16.110.12 -P 8
```

On `GPU-A` to storage:

```bash
ping -c 3 172.16.120.50
ping6 -c 3 2001:db8:120::50
```

On a border node:

```bash
vtysh -c "show ip route 203.0.113.0/24"
ping 203.0.113.10
```

What good looks like:

- same-subnet GPU path works
- routed GPU-to-storage path works
- IPv6 cluster traffic works
- remote service route exists

## 13. If Something Is Broken

First checks in order:

1. `ip -br link`
2. `ip -br addr`
3. `bridge vlan show`
4. `clagctl`
5. `vtysh -c "show ip ospf neighbor"`
6. `vtysh -c "show bgp l2vpn evpn summary"`
7. `cat /proc/net/bonding/bond0` on hosts

Most likely issues:

- `swp` mapping does not match expected EVE interface order
- peer-link or MLAG not up
- FRR not restarted after config copy
- host bond not created on Ubuntu VM
- border `swp6` mapped to the wrong EVE port

## 14. Save State

After stable bring-up:

On Cumulus nodes:

```bash
sudo cp /etc/network/interfaces /etc/network/interfaces.day1.saved
sudo cp /etc/frr/frr.conf /etc/frr/frr.conf.day1.saved
```

On EOS nodes:

```text
copy running-config startup-config
```
