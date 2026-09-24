# NCP-AIN AI Fabric Pro Mega Lab: Spectrum CLI Translation Sheet

This sheet maps the current `EOS` intent for `LEAF1-4` and `BL1-2` into `NVIDIA-style Ethernet switch` configuration sections.

Important scope:

- this is an `intent translation sheet`, not a copy-paste exact config for every NVIDIA NOS
- exact commands vary by platform and NOS:
  - `Cumulus Linux / NVUE`
  - `Onyx`
  - `SONiC on NVIDIA`
- the goal is to preserve the same lab behavior:
  - `MLAG`
  - `VLANs and SVIs`
  - `VRFs`
  - `EVPN/VXLAN`
  - `jumbo MTU`
  - `BGP EVPN`
  - `border eBGP` on `BL1-2`
  - `RoCE/QoS policy attachment points`

## 1. Current EOS intent summary

All six Spectrum-candidate nodes share this common structure:

- `Loopback0` = BGP router-id / EVPN source identity
- `Loopback1` = VTEP source loopback
- `Loopback2` = shared virtual VTEP for the MLAG pair
- `Ethernet1-2` = routed uplinks to spines
- `Ethernet10-11` = MLAG peer-link members
- `Vlan4094` = MLAG peer SVI
- host-facing `Port-Channel` interfaces for dual-homed Ubuntu VMs
- `VLAN110`, `VLAN120`, `VLAN130`, `VLAN210`
- `VRF AI_FABRIC`, `VRF AI_SERVICES`, `VRF TENANT_B`
- `Vxlan1` with:
  - `VNI10110` for VLAN110
  - `VNI10120` for VLAN120
  - `VNI10130` for VLAN130
  - `VNI10210` for VLAN210
  - `VNI50110` for `AI_FABRIC`
  - `VNI50130` for `AI_SERVICES`
  - `VNI50210` for `TENANT_B`
- `BGP EVPN` to route reflectors `10.255.255.11` and `10.255.255.12`

`BL1` and `BL2` add:

- external routed edge on `Ethernet30`
- external `IPv4 eBGP`
- service loopback advertisement (`100.64.10.11/32` and peer equivalent)

## 2. Translation model: EOS feature to NVIDIA-style section

### A. Global routing and system

EOS intent:

- `hostname`
- `ip routing`
- `ipv6 unicast-routing`
- `ip virtual-router mac-address`

Translate to NVIDIA sections:

- system hostname
- global IPv4 forwarding enabled
- global IPv6 forwarding enabled
- anycast gateway MAC or virtual router MAC setting

Use these NVIDIA-style config blocks:

- `system`
- `router`
- `vrf/global forwarding`
- `anycast gateway / fabric gateway mac`

### B. VLAN database

EOS intent:

- create `110`, `120`, `130`, `210`, `4094`

Translate to NVIDIA sections:

- bridge VLAN creation
- VLAN naming
- MLAG peer VLAN reservation for `4094`

Use these NVIDIA-style config blocks:

- `bridge vlan`
- `vlan database`
- `bridge domain`

### C. VRF creation

EOS intent:

- `AI_FABRIC`
- `AI_SERVICES`
- `TENANT_B`

Translate to NVIDIA sections:

- create VRFs
- bind L3 SVIs and L3 VNI association to the right VRF

Use these NVIDIA-style config blocks:

- `vrf definition`
- `vrf context`
- `network-instance`

### D. Loopbacks

EOS intent:

- `Loopback0` for router-id
- `Loopback1` for VTEP source
- `Loopback2` for shared MLAG/virtual VTEP
- on border nodes, `Loopback100` for service prefix advertisement

Translate to NVIDIA sections:

- loopback interfaces with IPv4 and IPv6
- VTEP source loopback
- shared anycast/virtual VTEP loopback if supported by the NOS design

Use these NVIDIA-style config blocks:

- `interface lo`
- `interface lo:1` or additional loopback constructs
- `nve source loopback`

### E. Routed uplinks to spines

EOS intent:

- `Ethernet1`, `Ethernet2`
- routed `/31`
- OSPF area `0`
- MTU `9214`

Translate to NVIDIA sections:

- make uplink ports L3 routed ports
- assign exact `/31` addresses
- apply jumbo MTU
- enable underlay routing protocol on those links

Use these NVIDIA-style config blocks:

- `interface ethernet`
- `ip address`
- `mtu 9214`
- `router ospf` or platform underlay routing section

### F. MLAG peer-link and peer SVI

EOS intent:

- `Ethernet10-11` into `Port-Channel100`
- trunk allowed `110,120,130,210,4094`
- `Vlan4094` with peer IP
- `mlag configuration`

Translate to NVIDIA sections:

- create LACP peer-link bond
- allow the same VLAN set
- configure peer VLAN SVI or peer IP
- define MLAG/MC-LAG domain and peer relationship

Use these NVIDIA-style config blocks:

- `bond / lag / port-channel`
- `bridge trunk vlan`
- `peerlink`
- `mlag domain` or `mclag`

### G. Host-facing bonds and access VLANs

EOS intent:

- `Port-Channel10` for `GPU-A` on `VLAN110`
- `Port-Channel11` for `GPU-C` on `VLAN210`
- `Port-Channel20` for `GPU-B` on `VLAN110`
- `Port-Channel21` for `STORAGE` on `VLAN120`
- `Port-Channel30` for `COLLECTOR` on `VLAN130`

Translate to NVIDIA sections:

- create host LAG
- place it in access or bridge-access mode
- bind to correct VLAN
- attach MLAG identifier if the NOS uses one

Use these NVIDIA-style config blocks:

- `bond`
- `bridge-access`
- `access vlan`
- `mclag-id / clag-id / mlag-id`

### H. Anycast SVIs and tenant gateways

EOS intent:

- `Vlan110` in `AI_FABRIC` with `172.16.110.1/24` and `2001:db8:110::1/64`
- `Vlan120` in `AI_FABRIC`
- `Vlan130` in `AI_SERVICES`
- `Vlan210` in `TENANT_B`
- all use `virtual` gateway addressing

Translate to NVIDIA sections:

- create SVIs
- bind each SVI to the proper VRF
- configure anycast gateway IP and IPv6
- enable distributed gateway behavior

Use these NVIDIA-style config blocks:

- `interface vlan`
- `vrf attach`
- `ip address virtual / anycast-gateway`
- `ipv6 address virtual / anycast-gateway`

### I. VXLAN and EVPN mapping

EOS intent:

- one VXLAN interface
- map VLAN to L2 VNI
- map VRF to L3 VNI
- source from `Loopback1`
- use `Loopback2` as virtual VTEP

Translate to NVIDIA sections:

- create NVE/VXLAN interface
- set source loopback
- define VLAN-to-VNI mapping
- define VRF-to-L3VNI mapping
- enable EVPN control plane integration

Use these NVIDIA-style config blocks:

- `nve`
- `vxlan`
- `bridge-domain to vni`
- `vrf l3-vni`

### J. Underlay OSPF

EOS intent:

- OSPF process `100`
- router-id = `Loopback0`
- passive by default
- uplinks active
- advertise Loopback0/1/2

Translate to NVIDIA sections:

- build underlay IGP with passive defaults
- activate only uplink routed ports
- advertise loopbacks used for router-id and VTEP reachability

Use these NVIDIA-style config blocks:

- `router ospf`
- `passive-interface default`
- `no passive-interface uplinks`
- `network statements` or interface-based enablement

### K. BGP EVPN

EOS intent:

- local AS `65000`
- neighbors `10.255.255.11` and `10.255.255.12`
- update-source `Loopback0`
- EVPN AF activated
- RD/RT per VLAN and per VRF
- redistribute connected in VRFs

Translate to NVIDIA sections:

- create BGP ASN `65000`
- EVPN neighbors via route reflectors
- source sessions from router loopback
- activate EVPN AF
- configure EVPN instances for each VLAN/VNI
- configure L3VNI/VRF import and export RTs

Use these NVIDIA-style config blocks:

- `router bgp`
- `neighbor`
- `address-family l2vpn evpn`
- `evpn vni`
- `vrf bgp context`

### L. Border eBGP on BL1-2

EOS intent on `BL1` and `BL2`:

- routed `Ethernet30`
- external `BGP IPv4`
- advertise service loopback

Translate to NVIDIA sections:

- create routed edge port
- establish external eBGP neighbor
- advertise loopback/service prefix

Use these NVIDIA-style config blocks:

- `interface ethernet30`
- `router bgp`
- `address-family ipv4 unicast`
- `network 100.64.x.x/32`

### M. QoS / RoCE translation points

The EOS configs here do not implement full PFC/ECN syntax. The NVIDIA replacement should attach those policies at:

- host-facing GPU/storage links
- leaf uplinks
- border/service links if you want end-to-end class preservation

Translate to NVIDIA sections:

- class maps for RoCE lossless traffic
- DSCP-to-traffic-class mapping
- PFC enablement on selected priorities
- ECN/WRED thresholds on congestion-managed queues
- jumbo MTU alignment

Use these NVIDIA-style config blocks:

- `qos`
- `dscp-map`
- `pfc`
- `ecn` or `wred`
- interface-level QoS policy attach

## 3. Node-specific translation matrix

## `LEAF1`

Keep this exact intent:

- uplinks:
  - `Ethernet1 10.0.0.0/31 -> SPINE1`
  - `Ethernet2 10.0.0.12/31 -> SPINE2`
- MLAG:
  - peer-link `Ethernet10-11`
  - peer SVI `Vlan4094 10.255.12.1/30`
  - peer = `10.255.12.2`
- host LAGs:
  - `Po10 -> VLAN110 -> GPU-A`
  - `Po11 -> VLAN210 -> GPU-C`
- loopbacks:
  - `Lo0 10.255.0.1`
  - `Lo1 10.254.0.1`
  - `Lo2 10.254.12.12`

Spectrum translation sections:

- system / routing enable
- VLAN + VRF database
- routed uplink interfaces
- MLAG peer-link and peer SVI
- host bonds for `Po10`, `Po11`
- SVI anycast gateways for `110/120/130/210`
- VXLAN L2VNI/L3VNI mapping
- OSPF underlay
- BGP EVPN to route reflectors
- QoS profile on `Ethernet20`, `Port-Channel10`, `Ethernet21`, `Port-Channel11`

## `LEAF2`

Same translation model as `LEAF1`, with these node-specific values:

- uplinks:
  - `Ethernet1 10.0.0.2/31`
  - `Ethernet2 10.0.0.14/31`
- peer SVI:
  - `Vlan4094 10.255.12.2/30`
- loopbacks:
  - `Lo0 10.255.0.2`
  - `Lo1 10.254.0.2`
  - `Lo2 10.254.12.12`

## `LEAF3`

Keep this exact intent:

- uplinks:
  - `Ethernet1 10.0.0.4/31`
  - `Ethernet2 10.0.0.16/31`
- MLAG peer SVI:
  - `Vlan4094 10.255.34.1/30`
  - peer = `10.255.34.2`
- host LAGs:
  - `Po20 -> VLAN110 -> GPU-B`
  - `Po21 -> VLAN120 -> STORAGE`
- loopbacks:
  - `Lo0 10.255.0.3`
  - `Lo1 10.254.0.3`
  - `Lo2 10.254.34.34`

Spectrum translation sections:

- same as `LEAF1`, but with:
  - host-facing QoS tuned for GPU + storage mix
  - VLAN120 storage path validation preserved

## `LEAF4`

Same translation model as `LEAF3`, with these node-specific values:

- uplinks:
  - `Ethernet1 10.0.0.6/31`
  - `Ethernet2 10.0.0.18/31`
- peer SVI:
  - `Vlan4094 10.255.34.2/30`
- loopbacks:
  - `Lo0 10.255.0.4`
  - `Lo1 10.254.0.4`
  - `Lo2 10.254.34.34`

## `BL1`

Keep this exact intent:

- uplinks:
  - `Ethernet1 10.0.0.8/31`
  - `Ethernet2 10.0.0.20/31`
- border edge:
  - `Ethernet30 198.51.100.0/31 -> PE1`
- MLAG peer SVI:
  - `Vlan4094 10.255.78.1/30`
  - peer = `10.255.78.2`
- service host LAG:
  - `Po30 -> VLAN130 -> COLLECTOR`
- loopbacks:
  - `Lo0 10.255.0.11`
  - `Lo1 10.254.0.11`
  - `Lo2 10.254.78.78`
  - `Lo100 100.64.10.11`
- BGP:
  - EVPN to route reflectors
  - IPv4 eBGP neighbor `198.51.100.1 remote-as 65301`
  - advertise `100.64.10.11/32`

Spectrum translation sections:

- all leaf translation sections
- extra routed external edge interface block
- IPv4 unicast eBGP AF
- service prefix advertisement
- optional QoS class preservation on services path

## `BL2`

Same translation model as `BL1`, with these node-specific values:

- uplinks:
  - `Ethernet1 10.0.0.10/31`
  - `Ethernet2 10.0.0.22/31`
- border edge:
  - `Ethernet30 198.51.100.2/31 -> PE2`
- peer SVI:
  - `Vlan4094 10.255.78.2/30`
- loopbacks:
  - `Lo0 10.255.0.12`
  - `Lo1 10.254.0.12`
  - `Lo2 10.254.78.78`
  - `Lo100 100.64.10.12`
- BGP:
  - external neighbor `198.51.100.3`
  - advertise `100.64.10.12/32`

## 4. Recommended build order on Spectrum nodes

For each Spectrum node, apply in this order:

1. system hostname and global routing enablement
2. VLANs and VRFs
3. loopbacks
4. routed uplinks with MTU
5. MLAG peer-link and peer SVI
6. host LAGs / border LAGs
7. tenant SVIs and anycast gateway
8. VXLAN / VNI / L3VNI mapping
9. OSPF underlay
10. BGP EVPN
11. external eBGP on `BL1-2`
12. QoS / RoCE policies

## 5. Practical NVIDIA NOS translation examples

When you port the EOS intent, think in these NVIDIA-style buckets:

- `system + interfaces`
- `bridge + vlan`
- `vrf`
- `mlag / mclag / clag`
- `svi + anycast gateway`
- `vxlan / nve`
- `ospf`
- `bgp evpn`
- `qos / pfc / ecn`

If your NOS is:

- `Cumulus/NVUE`: expect Linux-style interface objects, bridge VLAN membership, VRF objects, and EVPN/VXLAN under FRR + NVUE abstractions
- `Onyx`: expect switch-oriented interface, VLAN, MLAG, VXLAN, and BGP EVPN sections
- `SONiC on NVIDIA`: expect config-db style objects or CLI wrappers for interfaces, VLAN, VXLAN tunnel, VRF, BGP, and QoS

## 6. What not to change during translation

Keep these values identical to the EOS lab:

- all `/31` underlay IPs
- all loopback addresses
- all VNI numbers
- all VLAN numbers
- all VRF names
- all anycast gateway IPs
- all route-reflector neighbors
- all border eBGP peer IPs

That preserves workbook compatibility and validation logic.
