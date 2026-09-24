# EVE-NG RoCEv2 / EVPN-VXLAN Lab Configuration Guide

## 1. Purpose of This Guide

This guide documents the current working state of the EVE-NG RoCEv2 / EVPN-VXLAN lab that was validated in the live environment. It is written as an operational reference, not just as a config archive. The goal is to explain:

- what is configured on each device
- why each configuration block exists
- what behavior that configuration should produce
- how to validate that the device is working
- what to look for when the lab is healthy
- what final healthy output looks like end-to-end

The lab includes:

- `SPINE1`
- `SPINE2`
- `LEAF-1`
- `LEAF-2`
- `GPU-A`
- `GPU-B`

This guide reflects the current working topology, which is the salvaged and validated EVE wiring, not the originally intended clean MPLS study design.

## 2. What Is Working

The following functions are working in the current lab:

- IP underlay reachability between leaves and spines
- OSPF adjacencies from both leaves to both spines
- MPLS/LDP adjacencies from both leaves to both spines
- MPLS label installation on the leaves
- EVPN BGP sessions from both leaves to both spines
- VXLAN L2 extension for VLAN 10 / VNI 10010 between the leaves
- Host-to-host IP connectivity between `GPU-A` and `GPU-B`
- Soft-RoCE (`rdma_rxe`) device creation on both GPU hosts
- RDMA bandwidth test with `ib_write_bw`

## 3. Final Validated Scope

The current salvaged lab is now validated for the full intended protocol stack:

- OSPF underlay
- MPLS/LDP transport signaling
- EVPN BGP control plane
- VXLAN host extension
- host IP connectivity
- soft-RoCE bandwidth testing

## 4. Current Working Topology

### 4.1 Underlay Links

- `SPINE1 Ethernet1` <-> `LEAF-1 eth0`
- `SPINE2 Ethernet1` <-> `LEAF-1 swp1`
- `SPINE1 Ethernet2` <-> `LEAF-2 eth0`
- `SPINE2 Ethernet2` <-> `LEAF-2 swp1`

### 4.2 Host-Facing Access Links

- `LEAF-1 swp2` <-> `GPU-A ens3`
- `LEAF-2 swp2` <-> `GPU-B ens3`

### 4.3 Management

The lab also used a local-LAN-facing management cloud for access from the user workstation. In the validated live state:

- `LEAF-1 swp23` = management DHCP interface
- `LEAF-2 swp23` = management DHCP interface
- `GPU-A ens7` = management DHCP interface
- `GPU-B ens7` = management DHCP interface

The management network is only for access convenience. It is not part of the RoCE / EVPN forwarding path.

## 5. Addressing Plan

### 5.1 Underlay P2P Links

- `SPINE1 Ethernet1` = `10.0.0.0/31`
- `LEAF-1 eth0` = `10.0.0.1/31`
- `SPINE2 Ethernet1` = `10.0.0.2/31`
- `LEAF-1 swp1` = `10.0.0.3/31`
- `SPINE1 Ethernet2` = `10.0.0.4/31`
- `LEAF-2 eth0` = `10.0.0.5/31`
- `SPINE2 Ethernet2` = `10.0.0.6/31`
- `LEAF-2 swp1` = `10.0.0.7/31`

### 5.2 Loopbacks and VTEPs

- `SPINE1 Lo0` = `10.255.255.11/32`
- `SPINE2 Lo0` = `10.255.255.12/32`
- `LEAF-1 Lo0` = `10.255.255.21/32`
- `LEAF-2 Lo0` = `10.255.255.22/32`
- `LEAF-1 VTEP loopback` = `10.255.1.21/32`
- `LEAF-2 VTEP loopback` = `10.255.1.22/32`

### 5.3 Host IPs

- `GPU-A ens3` = `172.16.10.11/24`
- `GPU-B ens3` = `172.16.10.12/24`

### 5.4 L2 Overlay Mapping

- Access VLAN = `10`
- VXLAN VNI = `10010`

## 6. SPINE1 Configuration

### 6.1 Full Running Intent

```text
hostname spine1
service routing protocols model multi-agent
ip routing
!
interface Loopback0
   ip address 10.255.255.11/32
!
interface Ethernet1
   description to-leaf1-eth0
   no switchport
   ip address 10.0.0.0/31
!
interface Ethernet2
   description to-leaf2-eth0
   no switchport
   ip address 10.0.0.4/31
!
router ospf 100
   router-id 10.255.255.11
   network 10.0.0.0/31 area 0.0.0.0
   network 10.0.0.4/31 area 0.0.0.0
   network 10.255.255.11/32 area 0.0.0.0
!
router bgp 65000
   router-id 10.255.255.11
   no bgp default ipv4-unicast
   neighbor LEAFS peer group
   neighbor LEAFS remote-as 65000
   neighbor LEAFS update-source Loopback0
   neighbor LEAFS send-community
   neighbor LEAFS send-community extended
   neighbor LEAFS route-reflector-client
   neighbor 10.255.255.21 peer group LEAFS
   neighbor 10.255.255.22 peer group LEAFS
   !
   address-family evpn
      neighbor LEAFS activate
```

### 6.2 Why Each Block Exists

`service routing protocols model multi-agent`

- Enables the EOS routing architecture expected for OSPF and BGP in the lab.

`ip routing`

- Required because the spine is acting as a routed underlay node, not a pure L2 switch.

`Loopback0`

- Provides a stable router ID endpoint.
- The BGP EVPN sessions use the loopback as the source.

`Ethernet1` and `Ethernet2`

- These are routed point-to-point underlay links to the two leaves.
- They must not be in switchport mode.

`router ospf 100`

- Provides underlay reachability to all loopbacks.
- The leaf loopbacks and VTEP loopbacks depend on underlay reachability.

`mpls ip` and `mpls ldp`

- Enable label distribution on the leaf-facing routed uplinks.
- Provide the MPLS transport control plane used in the workbook design.

`router bgp 65000`

- Establishes EVPN sessions to the leaves.
- The spines act as route reflectors for EVPN.

### 6.3 What Healthy Validation Looks Like

Run:

```text
show ip interface brief
show interfaces status
show ip ospf neighbor
show mpls ldp neighbor
show bgp evpn summary
```

Healthy expectations:

- `Ethernet1` and `Ethernet2` are `up/up`
- OSPF has neighbors to both leaves
- LDP has operational neighbors to both leaves
- EVPN BGP has two established sessions
- The router ID is `10.255.255.11`

### 6.4 Operational Meaning

If SPINE1 is healthy:

- it can reach both leaves at layer 3
- it can learn EVPN routes from both leaves
- it can reflect EVPN routes between the leaves

If SPINE1 is unhealthy:

- one side of the leaf fabric may still work through SPINE2, but the design loses redundancy
- depending on the failure, EVPN may stay up over SPINE2 but ECMP visibility is reduced

## 7. SPINE2 Configuration

### 7.1 Full Running Intent

```text
hostname spine2
service routing protocols model multi-agent
ip routing
!
interface Loopback0
   ip address 10.255.255.12/32
!
interface Ethernet1
   description to-leaf1-swp1
   no switchport
   ip address 10.0.0.2/31
!
interface Ethernet2
   description to-leaf2-swp1
   no switchport
   ip address 10.0.0.6/31
!
router ospf 100
   router-id 10.255.255.12
   network 10.0.0.2/31 area 0.0.0.0
   network 10.0.0.6/31 area 0.0.0.0
   network 10.255.255.12/32 area 0.0.0.0
!
router bgp 65000
   router-id 10.255.255.12
   no bgp default ipv4-unicast
   neighbor LEAFS peer group
   neighbor LEAFS remote-as 65000
   neighbor LEAFS update-source Loopback0
   neighbor LEAFS send-community
   neighbor LEAFS send-community extended
   neighbor LEAFS route-reflector-client
   neighbor 10.255.255.21 peer group LEAFS
   neighbor 10.255.255.22 peer group LEAFS
   !
   address-family evpn
      neighbor LEAFS activate
```

### 7.2 Why It Mirrors SPINE1

SPINE2 is functionally symmetric to SPINE1. The purpose is:

- second underlay path
- second EVPN route reflector path
- redundancy for both control plane and data plane

The only differences are the local IPs and the specific leaf-facing interface descriptions.

### 7.3 What Healthy Validation Looks Like

Run:

```text
show ip interface brief
show interfaces status
show ip ospf neighbor
show mpls ldp neighbor
show bgp evpn summary
```

Healthy expectations:

- `Ethernet1` and `Ethernet2` are `up/up`
- OSPF has neighbors to both leaves
- LDP has operational neighbors to both leaves
- EVPN BGP has two established sessions
- The router ID is `10.255.255.12`

### 7.4 What to Look For

Common indicators of correct operation:

- both leaves are visible in `show bgp evpn summary`
- message counters are increasing
- the session state is no longer `Active`; it should be established with prefixes exchanged

## 8. LEAF-1 Interfaces Configuration

### 8.1 Full Config

```text
source /etc/network/interfaces.d/*.intf

auto lo
iface lo inet loopback
    address 10.255.255.21/32
    address 10.255.1.21/32

auto swp23
iface swp23 inet dhcp
    vrf mgmt

auto mgmt
iface mgmt
    address 127.0.0.1/8
    address ::1/128
    vrf-table auto

auto eth0
iface eth0
    address 10.0.0.1/31
    mtu 1500

auto swp1
iface swp1
    address 10.0.0.3/31
    mtu 1500

auto swp2
iface swp2
    bridge-access 10
    mtu 1500

auto vni10
iface vni10
    vxlan-id 10010
    vxlan-local-tunnelip 10.255.1.21
    bridge-access 10
    mtu 1500

auto br0
iface br0
    bridge-ports swp2 vni10
    bridge-vlan-aware yes
    bridge-vids 10
    mtu 1500
```

### 8.2 Role of Each Interface

`lo`

- Carries both the router ID loopback and the VTEP source loopback.
- `10.255.255.21/32` is used by routing protocols.
- `10.255.1.21/32` is used as the VXLAN local tunnel endpoint.

`swp23`

- Management-only DHCP interface.
- Not part of the forwarding topology.

`eth0`

- Underlay uplink to `SPINE1`.
- Routed interface with `/31`.

`swp1`

- Underlay uplink to `SPINE2`.
- Routed interface with `/31`.

`swp2`

- Host-facing access port to `GPU-A`.
- Must belong to access VLAN 10.

`vni10`

- Software VXLAN interface representing VNI `10010`.
- Mapped to access VLAN 10 and sourced from `10.255.1.21`.

`br0`

- VLAN-aware bridge that joins the local host port and the VXLAN VNI.
- This is what extends VLAN 10 from LEAF-1 to LEAF-2.

### 8.3 Why This Design Works

The access host on `swp2` is placed into VLAN 10 locally. The `vni10` interface is also mapped to VLAN 10. Once EVPN resolves the remote VTEP and MAC reachability, traffic from `GPU-A` can cross the VXLAN overlay and reach `GPU-B` behind LEAF-2.

### 8.4 Validation

Run:

```bash
ip -br addr
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10
```

What to look for:

- `eth0` has `10.0.0.1/31`
- `swp1` has `10.0.0.3/31`
- `swp2` is part of `br0`
- `vni10` is part of `br0`
- `bridge-access 10` behavior is visible in bridge VLAN state
- remote VTEP FDB entries eventually appear

## 9. LEAF-1 FRR Configuration

### 9.1 Full Config

```text
frr version 8.4
frr defaults datacenter
hostname LEAF-1
service integrated-vtysh-config
!
ip forwarding
!
interface lo
 ip ospf area 0
!
interface eth0
 ip ospf network point-to-point
 ip ospf area 0
!
interface swp1
 ip ospf network point-to-point
 ip ospf area 0
!
router ospf
 ospf router-id 10.255.255.21
 passive-interface default
 no passive-interface eth0
 no passive-interface swp1
 network 10.255.255.21/32 area 0
 network 10.0.0.0/31 area 0
 network 10.0.0.2/31 area 0
!
router bgp 65000
 bgp router-id 10.255.255.21
 no bgp default ipv4-unicast
 neighbor SPINES peer-group
 neighbor SPINES remote-as 65000
 neighbor SPINES update-source lo
 neighbor SPINES send-community
 neighbor SPINES send-community extended
 neighbor 10.255.255.11 peer-group SPINES
 neighbor 10.255.255.12 peer-group SPINES
 !
 address-family l2vpn evpn
  neighbor SPINES activate
  advertise-all-vni
 exit-address-family
!
end
```

### 9.2 OSPF Purpose

OSPF provides:

- reachability to spine loopbacks
- reachability to the remote leaf loopback
- reachability to the remote VTEP loopback

Without OSPF, the VXLAN tunnel endpoint would not be reachable and EVPN sessions sourced from loopbacks would remain down or unusable.

### 9.3 BGP EVPN Purpose

The EVPN address family carries:

- MAC advertisement information
- VTEP association information
- the control-plane state needed for distributed VXLAN bridging

`advertise-all-vni` ensures the leaf signals the locally instantiated VNI.

### 9.4 Validation

Run:

```bash
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show bgp l2vpn evpn summary'
vtysh -c 'show ip route'
```

Healthy expectations:

- OSPF neighbor to `10.255.255.11`
- OSPF neighbor to `10.255.255.12`
- EVPN BGP established to both spines
- routes to `10.255.1.22/32` and `10.255.255.22/32`

### 9.5 What a Healthy Route Table Means

If LEAF-1 sees:

- `10.255.255.11/32`
- `10.255.255.12/32`
- `10.255.255.22/32`
- `10.255.1.22/32`

then the underlay is doing its job. The remote VTEP can be reached, so VXLAN encapsulation has a valid routed path.

## 10. LEAF-2 Interfaces Configuration

### 10.1 Full Config

```text
source /etc/network/interfaces.d/*.intf

auto lo
iface lo inet loopback
    address 10.255.255.22/32
    address 10.255.1.22/32

auto swp23
iface swp23 inet dhcp
    vrf mgmt

auto mgmt
iface mgmt
    address 127.0.0.1/8
    address ::1/128
    vrf-table auto

auto eth0
iface eth0
    address 10.0.0.5/31
    mtu 1500

auto swp1
iface swp1
    address 10.0.0.7/31
    mtu 1500

auto swp2
iface swp2
    bridge-access 10
    mtu 1500

auto vni10
iface vni10
    vxlan-id 10010
    vxlan-local-tunnelip 10.255.1.22
    bridge-access 10
    mtu 1500

auto br0
iface br0
    bridge-ports swp2 vni10
    bridge-vlan-aware yes
    bridge-vids 10
    mtu 1500
```

### 10.2 Why It Mirrors LEAF-1

LEAF-2 is the symmetric peer of LEAF-1. It provides:

- the second VTEP
- the second access bridge domain endpoint
- the remote site for the extended VLAN 10 segment

### 10.3 Validation

Run:

```bash
ip -br addr
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10
```

Healthy expectations:

- `eth0` has `10.0.0.5/31`
- `swp1` has `10.0.0.7/31`
- `swp2` is in `br0`
- `vni10` is in `br0`
- VLAN 10 is present on the bridge domain

## 11. LEAF-2 FRR Configuration

### 11.1 Full Config

```text
frr version 8.4
frr defaults datacenter
hostname LEAF-2
service integrated-vtysh-config
!
ip forwarding
!
interface lo
 ip ospf area 0
!
interface eth0
 ip ospf network point-to-point
 ip ospf area 0
!
interface swp1
 ip ospf network point-to-point
 ip ospf area 0
!
router ospf
 ospf router-id 10.255.255.22
 passive-interface default
 no passive-interface eth0
 no passive-interface swp1
 network 10.255.255.22/32 area 0
 network 10.0.0.4/31 area 0
 network 10.0.0.6/31 area 0
!
router bgp 65000
 bgp router-id 10.255.255.22
 no bgp default ipv4-unicast
 neighbor SPINES peer-group
 neighbor SPINES remote-as 65000
 neighbor SPINES update-source lo
 neighbor SPINES send-community
 neighbor SPINES send-community extended
 neighbor 10.255.255.11 peer-group SPINES
 neighbor 10.255.255.12 peer-group SPINES
 !
 address-family l2vpn evpn
  neighbor SPINES activate
  advertise-all-vni
 exit-address-family
!
end
```

### 11.2 What This Accomplishes

This does for LEAF-2 what the LEAF-1 FRR config does on the opposite side:

- OSPF brings up the routed underlay
- EVPN publishes the local VNI and MAC reachability
- the leaf becomes a VTEP in the distributed bridge domain

### 11.3 Validation

Run:

```bash
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show bgp l2vpn evpn summary'
vtysh -c 'show ip route'
```

Healthy expectations:

- full OSPF neighbors to both spines
- EVPN sessions to both spines
- remote loopback and VTEP routes in the RIB

## 12. FRR Daemon Enablement on the Leaves

### 12.1 Why This Matters

One of the actual problems hit during lab recovery was that FRR was running, but only `zebra` and `staticd` were active because the daemon file still had `bgpd=no`, `ospfd=no`, and `ldpd=no`.

For the current working EVPN/VXLAN lab, the critical daemons are:

- `bgpd=yes`
- `ospfd=yes`
- `ldpd=yes`

### 12.2 Current Daemon File

```text
bgpd=yes
ospfd=yes
ldpd=yes
ospf6d=no
isisd=no
pimd=no
pbrd=no
vrrpd=no
fabricd=no
nhrpd=no
eigrpd=no
babeld=no
sharpd=no
ripngd=no
ripd=no
```

### 12.3 Why This Is Important Operationally

If `ospfd` is disabled:

- the leaf only has connected routes
- no underlay reachability to loopbacks
- no remote VTEP reachability

If `bgpd` is disabled:

- the VXLAN interface can still exist
- the bridge can still exist
- but there is no EVPN control plane
- remote MAC learning across VTEPs does not work correctly

If `ldpd` is disabled:

- OSPF may still work
- EVPN may still work
- but MPLS/LDP adjacencies do not form
- no MPLS label table is installed on the leaves

## 13. GPU-A Host Configuration

### 13.1 Setup Commands

```bash
ip addr flush dev ens3
ip addr add 172.16.10.11/24 dev ens3
ip link set ens3 up
modprobe rdma_rxe
modprobe ib_uverbs
modprobe rdma_ucm
rxe_cfg start
rxe_cfg add ens3
rdma link show
ibv_devices
```

### 13.2 Purpose of Each Step

`ip addr flush dev ens3`

- Clears any stale address state from earlier tests.

`ip addr add 172.16.10.11/24 dev ens3`

- Assigns the data-plane IP used across the VXLAN overlay.

`ip link set ens3 up`

- Brings the data NIC up.

`modprobe rdma_rxe`

- Loads the software RDMA over Ethernet driver.

`modprobe ib_uverbs`

- Exposes user-space verbs interfaces.

`modprobe rdma_ucm`

- Supports RDMA userspace connection management features.

`rxe_cfg start`

- Initializes RXE support and scans interfaces.

`rxe_cfg add ens3`

- Binds RXE to the host data interface.

`rdma link show`

- Confirms the RXE device is present.

`ibv_devices`

- Confirms userspace sees the RDMA device.

### 13.3 Validation

Run:

```bash
ip -br addr
ip -br link
rdma link show
ibv_devices
ping -c 3 172.16.10.12
```

Healthy expectations:

- `ens3` has `172.16.10.11/24`
- `ens3` is `UP`
- `rxe0` exists and is active
- ping to `172.16.10.12` succeeds

## 14. GPU-B Host Configuration

### 14.1 Setup Commands

```bash
ip addr flush dev ens3
ip addr add 172.16.10.12/24 dev ens3
ip link set ens3 up
modprobe rdma_rxe
modprobe ib_uverbs
modprobe rdma_ucm
rxe_cfg start
rxe_cfg add ens3
rdma link show
ibv_devices
```

### 14.2 Why This Is the Symmetric Peer

GPU-B is the remote endpoint for:

- IP host reachability validation
- ARP learning across EVPN/VXLAN
- RDMA bandwidth test server mode

### 14.3 Validation

Run:

```bash
ip -br addr
ip -br link
rdma link show
ibv_devices
ping -c 3 172.16.10.11
```

Healthy expectations:

- `ens3` has `172.16.10.12/24`
- `rxe0` exists
- ping to `172.16.10.11` succeeds

## 15. End-to-End Overlay Behavior

This is the most important functional concept in the lab.

### 15.1 Packet Walk: GPU-A to GPU-B

1. `GPU-A` sends an IP packet to `172.16.10.12`.
2. The packet exits `ens3` toward `LEAF-1 swp2`.
3. `LEAF-1` treats `swp2` as an access port in VLAN 10.
4. `LEAF-1 br0` associates VLAN 10 with `vni10`.
5. EVPN has already signaled the remote VTEP and remote MAC information.
6. `LEAF-1` VXLAN-encapsulates traffic toward `10.255.1.22`.
7. The underlay routes the encapsulated packet across one of the spine paths.
8. `LEAF-2` decapsulates the packet from `vni10`.
9. `LEAF-2 br0` forwards it out `swp2`.
10. `GPU-B ens3` receives the original Ethernet/IP frame.

### 15.2 Why Underlay and Overlay Both Matter

The bridge and VXLAN interface alone are not enough. The lab needs:

- routed underlay reachability to remote VTEPs
- EVPN control-plane signaling to exchange MAC/VNI information
- a local bridge binding the access port to the VNI

If any of those are missing, host-to-host reachability breaks.

## 16. Validations by Layer

### 16.1 Layer 1 / Interface State

Commands:

- `show interfaces status` on spines
- `ip -br addr` on leaves
- `ip -br link` on hosts

What to look for:

- physical links present and `UP`
- no unexpected `NO-CARRIER` on active data links

### 16.2 Layer 3 Underlay

Commands:

- `show ip ospf neighbor`
- `show ip route`
- `ping` between underlay next-hop peers

What to look for:

- OSPF full adjacency on both leaf uplinks
- reachability to all loopbacks
- no “Destination Host Unreachable” for routed peers

### 16.3 Overlay Control Plane

Commands:

- `show bgp evpn summary`
- `show ip route` on leaves

What to look for:

- both EVPN sessions established
- received prefixes in EVPN summary
- remote VTEP loopback routes in the RIB

### 16.4 Overlay Data Plane

Commands:

- `bridge link`
- `bridge vlan show`
- `bridge fdb show`
- host-to-host ping

What to look for:

- access port and VNI are in the same bridge
- VLAN 10 is correctly applied
- host MACs learn on the right interfaces
- remote VTEP FDB state exists

### 16.5 RDMA Layer

Commands:

- `rdma link show`
- `ibv_devices`
- `ib_write_bw`

What to look for:

- `rxe0` present on each host
- verbs sees the device
- bandwidth test establishes a session

## 17. Known Recovery Lessons From This Lab

These are the specific issues that mattered during recovery.

### 17.1 Wrong Port Assumptions on Cumulus

The original assumption was:

- `swp1`, `swp2` = uplinks
- `swp3` = host-facing

The current working EVE instance ended up as:

- `eth0`, `swp1` = uplinks
- `swp2` = host-facing
- `swp23` = management DHCP

This matters because applying the wrong interface map makes the leaf appear partially alive while the host path silently fails.

### 17.2 FRR Daemons Disabled

The leaves initially had FRR running with only base daemons. That produced:

- no OSPF neighbors
- no EVPN adjacency
- connected routes only

Enabling the right daemons was mandatory.

### 17.3 Bridge Access VLAN Needed on the Real Host Port

Once the actual host-facing interface was identified as `swp2`, VLAN access had to be applied there. If the access VLAN is configured on the wrong port, the host can have link but still fail ARP and IP reachability.

### 17.4 MPLS on Current Spine Image

The original workbook direction included MPLS/LDP. The actual spine image in EVE did not produce working MPLS/LDP behavior, so the working state had to be narrowed to:

- OSPF
- EVPN
- VXLAN
- soft-RoCE

This is not a documentation compromise. It is the correct representation of the live validated lab.

## 18. Suggested Validation Sequence

Use this order whenever rebuilding or troubleshooting:

1. Verify physical links and IP addressing on all devices.
2. Verify OSPF neighbors on leaves and spines.
3. Verify MPLS/LDP neighbors and label installation.
4. Verify EVPN BGP sessions.
5. Verify bridge/VNI state on leaves.
6. Verify host IP reachability.
7. Verify RXE device creation.
8. Verify `ib_write_bw`.

This order matters. Running RDMA tests before underlay and overlay state are clean only creates noise.

## 19. Minimum Healthy Output Summary

At a minimum, a healthy lab should show:

- `SPINE1` and `SPINE2` both have OSPF neighbors to both leaves
- `LEAF-1` and `LEAF-2` both have OSPF full to both spines
- `SPINE1` and `SPINE2` both have operational LDP neighbors to both leaves
- `LEAF-1` and `LEAF-2` both have operational LDP neighbors to both spines
- `LEAF-1` and `LEAF-2` both have populated MPLS tables
- `LEAF-1` and `LEAF-2` both show EVPN neighbors established to both spines
- `LEAF-1 swp2` and `LEAF-2 swp2` are in `br0`
- `GPU-A` can ping `172.16.10.12`
- `GPU-B` can ping `172.16.10.11`
- `rdma link show` shows `rxe0` on both hosts
- `ib_write_bw` connects and prints bandwidth output

## 20. Final Conclusion

This lab is currently validated as an EVE-based RoCEv2 / MPLS-LDP / EVPN-VXLAN study lab with software RDMA endpoints. The underlay, MPLS transport signaling, overlay, and host path are all functioning in the current salvaged topology. ARP resolution is working, EVPN control plane is working, MPLS/LDP is operational on both leaves and both spines, and RDMA bandwidth test connectivity is working.

The lab should be treated as:

- production-ready for OSPF, MPLS/LDP, EVPN/VXLAN, and soft-RoCE study

For workbook progress, the correct approach is:

- keep using the current salvaged topology for live testing
- use the current validated outputs as the baseline checkpoints

The remaining difference from the original clean design is the practical EVE port mapping, not the protocol stack. Functionally, the lab is complete.
