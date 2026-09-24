# Current Salvaged Topology

This document reflects the topology that is actually working now.

## What Changed Versus Original Plan

- The leaf uplinks are on `eth0` and `swp1`, not `swp1` and `swp2`
- The host-facing port is `swp2`, not `swp3`
- The leaf mgmt DHCP interface is `swp23`
- The local mgmt cloud is only for SSH / telnet reachability from the local LAN

## Functional Scope

Working now:

- OSPF underlay
- MPLS/LDP transport
- EVPN control plane
- VXLAN L2 extension for VLAN 10 / VNI 10010
- Host-to-host IP reachability across the overlay
- Soft-RoCE using `rdma_rxe`
- `ib_write_bw`

## Host Segment

- `GPU-A ens3` = `172.16.10.11/24`
- `GPU-B ens3` = `172.16.10.12/24`
- Access VLAN = `10`
- VXLAN VNI = `10010`

## Overlay Loopbacks

- `LEAF-1`
  - Lo0 `10.255.255.21/32`
  - VTEP `10.255.1.21/32`
- `LEAF-2`
  - Lo0 `10.255.255.22/32`
  - VTEP `10.255.1.22/32`

## Underlay Links

- `SPINE1 <-> LEAF-1 eth0`
  - `10.0.0.0/31` spine
  - `10.0.0.1/31` leaf
- `SPINE2 <-> LEAF-1 swp1`
  - `10.0.0.2/31` spine
  - `10.0.0.3/31` leaf
- `SPINE1 <-> LEAF-2 eth0`
  - `10.0.0.4/31` spine
  - `10.0.0.5/31` leaf
- `SPINE2 <-> LEAF-2 swp1`
  - `10.0.0.6/31` spine
  - `10.0.0.7/31` leaf

## Management Links

If you want the same local-LAN access behavior:

- connect `SPINE1 Mgmt1` to your EVE cloud
- connect `SPINE2 Mgmt1` to your EVE cloud
- connect `LEAF-1 swp23` to your EVE cloud
- connect `LEAF-2 swp23` to your EVE cloud
- connect `GPU-A e4/ens7` to your EVE cloud
- connect `GPU-B e4/ens7` to your EVE cloud

## Validation State

The current salvaged topology is now fully validated for:

- OSPF on all four routed leaf-spine adjacencies
- LDP discovery and operational neighbors on all four routed adjacencies
- MPLS label installation on both leaves
- EVPN BGP established on all leaf-to-spine sessions
- VXLAN host reachability between `GPU-A` and `GPU-B`
- soft-RoCE bandwidth test connectivity
