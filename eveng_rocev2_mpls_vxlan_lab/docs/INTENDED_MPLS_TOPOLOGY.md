# Intended MPLS Topology

This is the original study target, and the current salvaged lab now implements the same protocol stack even though the EVE port mapping differs:

- OSPF underlay
- MPLS/LDP transport
- EVPN as the control plane
- VXLAN for host extension

This repo keeps that design documented, but it is not the active working EVE runtime unless you use a spine image with functional MPLS/LDP support.

## Intended Difference

The intended clean layout was:

- leaf uplinks on `swp1` and `swp2`
- host access on `swp3`
- mgmt separate from data ports

That is not the mapping of the currently salvaged live lab.

## Recommendation

Use the current salvaged topology for validation and workbook progress now. Use the intended topology only if you want to rebuild the cabling into the cleaner original port layout.
