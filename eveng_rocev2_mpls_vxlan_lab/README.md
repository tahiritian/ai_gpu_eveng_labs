# EVE-NG RoCEv2 / MPLS-LDP / EVPN-VXLAN Lab

## Author

- Author: Mohammad Tahir
- E-mail: tahiritian@gmail.com

## Overview

This package contains the current final validated version of an EVE-NG study lab for:

- OSPF underlay
- MPLS/LDP transport
- EVPN control plane
- VXLAN overlay
- VTEP reachability
- soft-RoCE / RXE host validation
- RDMA bandwidth test validation
- additive QoS and IPv6 practice

The package is based on the working live lab state, including the practical EVE port mapping that was actually validated during build and troubleshooting.

## What Is Provided In This Package

- ready-to-use device configuration files for both leaves, both spines, and both GPU hosts
- EVE `.unl` topology for the current validated working layout
- validation checklists by protocol and by end-to-end workflow
- a separate QoS / IPv6 practice workbook with rollback guidance
- a Flask dashboard to browse the full repo from one browser window
- topology notes for the current salvaged layout and the original intended layout
- a detailed lab guide PDF and Markdown source

## Current Topology

### Devices

- `SPINE1`
- `SPINE2`
- `LEAF-1`
- `LEAF-2`
- `GPU-A`
- `GPU-B`

### Routed Underlay Links

- `SPINE1 Ethernet1` <-> `LEAF-1 eth0`
- `SPINE2 Ethernet1` <-> `LEAF-1 swp1`
- `SPINE1 Ethernet2` <-> `LEAF-2 eth0`
- `SPINE2 Ethernet2` <-> `LEAF-2 swp1`

### Host-Facing Data Links

- `LEAF-1 swp2` <-> `GPU-A ens3`
- `LEAF-2 swp2` <-> `GPU-B ens3`

### Management Access Links

- `LEAF-1 swp23` -> local DHCP / management cloud
- `LEAF-2 swp23` -> local DHCP / management cloud
- `GPU-A ens7` -> local DHCP / management cloud
- `GPU-B ens7` -> local DHCP / management cloud
- `SPINE1 Mgmt1` -> local DHCP / management cloud
- `SPINE2 Mgmt1` -> local DHCP / management cloud

## Addressing Summary

### Underlay

- `SPINE1 Ethernet1` = `10.0.0.0/31`
- `LEAF-1 eth0` = `10.0.0.1/31`
- `SPINE2 Ethernet1` = `10.0.0.2/31`
- `LEAF-1 swp1` = `10.0.0.3/31`
- `SPINE1 Ethernet2` = `10.0.0.4/31`
- `LEAF-2 eth0` = `10.0.0.5/31`
- `SPINE2 Ethernet2` = `10.0.0.6/31`
- `LEAF-2 swp1` = `10.0.0.7/31`

### Loopbacks and VTEPs

- `SPINE1 Lo0` = `10.255.255.11/32`
- `SPINE2 Lo0` = `10.255.255.12/32`
- `LEAF-1 Lo0` = `10.255.255.21/32`
- `LEAF-2 Lo0` = `10.255.255.22/32`
- `LEAF-1 VTEP` = `10.255.1.21/32`
- `LEAF-2 VTEP` = `10.255.1.22/32`

### Host Overlay

- VLAN = `10`
- VNI = `10010`
- `GPU-A ens3` = `172.16.10.11/24`
- `GPU-B ens3` = `172.16.10.12/24`

## What Has Been Tested And Validated

The following were validated from live device output:

- OSPF neighbors are full between both leaves and both spines
- MPLS/LDP neighbors are operational between both leaves and both spines
- MPLS label tables are populated on both leaves
- EVPN BGP sessions are established between both leaves and both spines
- remote VTEP reachability is working
- VXLAN VNI `10010` is active on both leaves
- bridge/VLAN/VNI attachment is working on both leaves
- `GPU-A` can ping `GPU-B` across the overlay
- `rdma_rxe` is active on both GPU hosts
- `ibv_devices` shows `rxe0` on both hosts
- `ib_write_bw` connects and starts the RDMA bandwidth test

## QoS / IPv6 Workbook Scope

This package now also includes a separate practice workbook for:

- IPv6 over the current VXLAN bridge domain
- DSCP marking and verification
- Linux software queueing for strict-priority style behavior
- RED/WRED-style queue practice in Linux software
- ECN marking practice in Linux software
- PFC design discussion and validation boundaries
- RDMA regression testing after QoS changes

The QoS workbook is intentionally additive and does not replace the validated base fabric.

### Safety Model

The workbook was written to avoid breaking what is already working:

- no required changes to OSPF
- no required changes to MPLS/LDP
- no required changes to EVPN
- no required changes to VTEP or VXLAN base configs
- most experiments are host-side or host-facing
- every major section includes rollback steps

### Important Platform Boundary

This EVE lab can practically demonstrate:

- IPv6 overlay reachability
- DSCP marking
- Linux software queueing
- RED/ECN behavior in software
- RXE / RDMA regression validation

This EVE lab does not fully prove hardware data-center QoS behavior such as:

- real ASIC PFC pause behavior
- real switch ASIC WRED
- real NIC hardware RoCE congestion control
- full hardware ECN/DCQCN validation

## Repo Layout

- `configs/`
  Final ready-to-use configs.
- `topology/`
  EVE lab file for the validated working topology.
- `docs/`
  Topology notes and reference material.
- `LAB_CONFIGURATION_GUIDE.md`
  Full written lab guide.
- `LAB_CONFIGURATION_GUIDE.pdf`
  Rendered PDF guide.
- `QOS_IPV6_WORKBOOK.md`
  Step-by-step additive workbook for QoS, ECN, WRED, strict priority, PFC boundaries, IPv6, and RDMA regression.
- `QOS_IPV6_WORKBOOK.pdf`
  Rendered PDF workbook.
- `dashboard_app.py`
  Flask dashboard for viewing Markdown, configs, PDFs, topology files, and images in-browser.
- `templates/`
  Dashboard HTML template.
- `static/`
  Dashboard stylesheet.
- `VALIDATION_CHECKLIST.md`
  Full copy/paste validation sequence.
- `OSPF_VALIDATION.md`
  OSPF-only validation.
- `MPLS_LDP_VALIDATION.md`
  MPLS/LDP-only validation.
- `EVPN_VALIDATION.md`
  EVPN-only validation.
- `VTEP_VALIDATION.md`
  VTEP-only validation.
- `VXLAN_VALIDATION.md`
  VXLAN-only validation.
- `OVERLAY_VALIDATION.md`
  Combined overlay validation.
- `SOFT_ROCE_RXE_VALIDATION.md`
  RXE-only validation.
- `ROCE_VALIDATION.md`
  RXE/RDMA validation reference.
- `RDMA_BANDWIDTH_VALIDATION.md`
  `ib_write_bw` validation only.

## Important EVE Note

The included `.unl` models the validated working fabric and host data links.

The local-LAN management cloud is environment-specific and is not hardcoded into the topology file. If you want the same local PC access behavior, connect your own EVE cloud to:

- `SPINE1 Mgmt1`
- `SPINE2 Mgmt1`
- `LEAF-1 swp23`
- `LEAF-2 swp23`
- `GPU-A e4`
- `GPU-B e4`

## Final Status

This package should now be treated as the final validated lab state for:

- OSPF
- MPLS/LDP
- EVPN
- VTEP
- VXLAN
- soft-RoCE / RXE
- RDMA bandwidth validation
- additive QoS / IPv6 practice on top of the validated fabric

## Start Here

1. Import `topology/eveng_rocev2_mpls_vxlan_current_salvaged.unl`
2. Apply the device configs from `configs/`
3. Run `VALIDATION_CHECKLIST.md`
4. Use the protocol-specific validation files as needed
5. Use `LAB_CONFIGURATION_GUIDE.pdf` for the validated base fabric
6. Use `QOS_IPV6_WORKBOOK.pdf` for additive QoS / IPv6 practice

## Dashboard Usage

From this repo directory:

```bash
python3 dashboard_app.py
```

Then open:

```text
http://127.0.0.1:5055
```

The dashboard provides tabbed browsing for:

- guides
- validations
- configs
- topology files
- docs
- PDFs
- app files
