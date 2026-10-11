# EVE-NG Lab Guide: Flat ShuffleBox Cabling + Spraypoint-Style Routing

## 1. Goal

This lab teaches how a flat randomized fabric behaves compared with a traditional Clos/fat-tree.

The lab uses:

- 8 Arista routers: R1-R8.
- 4 Linux hosts: H1, H3, H6, H8.
- A fixed cabling matrix that represents a passive ShuffleBox-style optical map.
- eBGP on every router-to-router link.
- BGP multipath to approximate Spraypoint-style traffic spreading.

Important: this is a concept lab. A real ShuffleBox is passive optical infrastructure, and Spraypoint is AWS-specific routing logic. In EVE-NG we simulate the same design principles using point-to-point links and BGP ECMP.

## 2. Mental Model

Traditional Clos:

```text
Host -> Leaf -> Spine -> Leaf -> Host
```

Flat graph:

```text
Host -> Router -> random graph peers -> Router -> Host
```

The ShuffleBox idea:

```text
Router port -> local ShuffleBox r-port -> fixed internal shuffle -> remote c-port -> remote router
```

In this lab, EVE-NG direct links represent that passive optical mapping.

## 3. Topology

Each router has 4 fabric links. That means the graph degree is 4.

```text
R1 connects to R2, R8, R4, R6
R2 connects to R1, R3, R5, R7
R3 connects to R2, R4, R6, R8
R4 connects to R3, R5, R1, R7
R5 connects to R4, R6, R2, R8
R6 connects to R5, R7, R3, R1
R7 connects to R6, R8, R4, R2
R8 connects to R7, R1, R5, R3
```

ASCII view:

```text
        R1 -------- R2
       /  \        /  \
      /    \      /    \
     R4 --- R3 -- R5 --- R6
      \    /      \    /
       \  /        \  /
        R7 -------- R8

Additional cross-links:
R1-R8, R1-R6, R2-R7, R3-R8, R4-R7, R5-R8
```

Host networks:

```text
H1 -- R1: 10.1.1.0/24
H3 -- R3: 10.3.3.0/24
H6 -- R6: 10.6.6.0/24
H8 -- R8: 10.8.8.0/24
```

## 4. Import Steps

1. Import `Flat_ShuffleBox_Spraypoint_Arista.unl` into EVE-NG.
2. If the Arista template name differs, edit the `.unl` file:

```text
template="veos"
```

Common alternatives:

```text
template="vEOS"
template="veos-lab"
template="ceos"
```

3. Start all R1-R8 nodes.
4. Paste the matching config from `configs/`.
5. Start Linux hosts and apply the commands from `host_configs/`.

## 5. What To Focus On

Focus on these design points:

- Cabling is not hierarchical.
- There is no spine layer.
- Every router has several randomized fabric peers.
- BGP learns multiple possible paths.
- ECMP approximates traffic spray.
- Failures remove capacity but should not isolate a large subtree.

## 6. Basic Validation

On every Arista router:

```text
show ip interface brief
show ip bgp summary
show ip route
show ip bgp
```

From R1, check reachability to R8 host network:

```text
ping 10.8.8.1
show ip route 10.8.8.0/24
show ip bgp 10.8.8.0/24
traceroute 10.8.8.1
```

From H1:

```bash
ping 10.8.8.10
traceroute 10.8.8.10
```

Expected result:

- H1 should reach H8.
- R1 should see multiple BGP paths for remote prefixes.
- Depending on vEOS version and BGP bestpath behavior, the RIB may install multiple ECMP paths when AS-path length and path attributes qualify.

## 7. BGP Multipath Checks

On R1:

```text
show running-config section router bgp
show ip bgp 10.8.8.0/24
show ip route 10.8.8.0/24
```

Look for:

```text
maximum-paths 8
bgp bestpath as-path multipath-relax
```

Conceptually, multiple possible paths exist:

```text
R1 -> R8
R1 -> R2 -> R7 -> R8
R1 -> R4 -> R3 -> R8
R1 -> R6 -> R5 -> R8
```

## 8. Failure Testing

Test a direct link failure:

On R1:

```text
conf t
interface Ethernet2
shutdown
end
```

This shuts R1-R8.

Validate:

```text
show ip bgp summary
show ip route 10.8.8.0/24
ping 10.8.8.1
traceroute 10.8.8.1
```

Expected result:

- Direct path disappears.
- Alternate graph paths remain.
- Traffic should still route through other routers after convergence.

Restore:

```text
conf t
interface Ethernet2
no shutdown
end
```

Test router failure:

```text
Stop R5 in EVE-NG.
Check if H1 can still reach H8.
Start R5 again.
```

## 9. Traffic Testing

On H8:

```bash
iperf3 -s
```

On H1:

```bash
iperf3 -c 10.8.8.10 -P 8 -t 30
```

Why `-P 8` matters:

- Single TCP flow usually hashes to one path.
- Multiple flows give ECMP more opportunities to spread traffic.
- This approximates how large systems use many flows across a fabric.

## 10. Interview Explanation

Use this answer:

```text
I built an EVE-NG lab that models a flat randomized fabric. Instead of a leaf-spine hierarchy, each router has multiple peer links created from a fixed ShuffleBox-style cabling matrix. The ShuffleBox is represented as passive point-to-point cable mappings, not an Ethernet switch. Routing is done with eBGP on every graph edge, with multipath enabled to approximate Spraypoint-style traffic distribution. I validated the design by checking BGP adjacency, route diversity, ECMP behavior, traceroute paths, iperf flows, and failure scenarios where direct links or intermediate routers are removed. The main lesson is that failures reduce available path capacity but do not create a large hierarchical blast radius like a top-layer Clos failure can.
```

## 11. Extensions

After the base lab works:

- Increase to 16 routers.
- Add route reflectors only for control-plane experiments, not for the flat data plane.
- Add BGP communities to prefer waypoint routers.
- Add Linux `tc` to simulate congested links.
- Add sFlow/telemetry if supported by your Arista image.
- Add VXLAN/EVPN as a separate overlay study, but keep the underlay flat.
