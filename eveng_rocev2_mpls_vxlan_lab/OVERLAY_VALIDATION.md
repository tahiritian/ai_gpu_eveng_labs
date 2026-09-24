# Overlay Validation

Use this file when you only want to validate EVPN, VXLAN, and VTEP behavior.

## What This Validates

- EVPN BGP control-plane sessions
- VTEP reachability
- VXLAN VNI state
- bridge/VLAN mapping
- host reachability across the overlay

## LEAF-1

```bash
ip -br addr
vtysh -c 'show ip route'
vtysh -c 'show bgp l2vpn evpn summary'
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10
ping -c 3 10.255.1.22
ping -c 3 10.255.255.22
```

Healthy:

- `lo` has `10.255.255.21/32` and `10.255.1.21/32`
- route to remote VTEP `10.255.1.22/32` exists
- route to remote leaf loopback `10.255.255.22/32` exists
- EVPN neighbors to `10.255.255.11` and `10.255.255.12` are established
- `vni10` exists with `vxlan id 10010`
- `vxlan-local-tunnelip 10.255.1.21`
- `swp2` and `vni10` are both in `br0`

## LEAF-2

```bash
ip -br addr
vtysh -c 'show ip route'
vtysh -c 'show bgp l2vpn evpn summary'
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10
ping -c 3 10.255.1.21
ping -c 3 10.255.255.21
```

Healthy:

- `lo` has `10.255.255.22/32` and `10.255.1.22/32`
- route to remote VTEP `10.255.1.21/32` exists
- route to remote leaf loopback `10.255.255.21/32` exists
- EVPN neighbors to `10.255.255.11` and `10.255.255.12` are established
- `vni10` exists with `vxlan id 10010`
- `vxlan-local-tunnelip 10.255.1.22`
- `swp2` and `vni10` are both in `br0`

## SPINE1

```text
show bgp evpn summary
```

Healthy:

- `10.255.255.21` is `Estab`
- `10.255.255.22` is `Estab`
- prefixes are received from both leaves

## SPINE2

```text
show bgp evpn summary
```

Healthy:

- `10.255.255.21` is `Estab`
- `10.255.255.22` is `Estab`
- prefixes are received from both leaves

## Host Overlay Proof

### GPU-A

```bash
ping -c 3 172.16.10.12
arp -n
```

Healthy:

- ping to `172.16.10.12` succeeds
- ARP for `172.16.10.12` resolves

### GPU-B

```bash
ping -c 3 172.16.10.11
arp -n
```

Healthy:

- ping to `172.16.10.11` succeeds
- ARP for `172.16.10.11` resolves

## Full Overlay Proof

If all of the following are true, the overlay is working:

- remote VTEP loopbacks are reachable
- EVPN neighbors are established
- `vni10` is present and bound to the bridge domain
- host MAC/IP learning occurs across the VXLAN segment
- `GPU-A` and `GPU-B` can reach each other on `172.16.10.0/24`
