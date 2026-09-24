# Validation Checklist

Run these in order.

## SPINE1

```text
show ip interface brief
show interfaces status
show ip ospf neighbor
show mpls ldp neighbor
show bgp evpn summary
show running-config section ospf
show running-config section mpls
show running-config section bgp
```

Expected:

- `Ethernet1` and `Ethernet2` up
- OSPF neighbors to both leaves
- LDP neighbors to both leaves operational
- EVPN neighbors to both leaves established

## SPINE2

```text
show ip interface brief
show interfaces status
show ip ospf neighbor
show mpls ldp neighbor
show bgp evpn summary
show running-config section ospf
show running-config section mpls
show running-config section bgp
```

Expected:

- `Ethernet1` and `Ethernet2` up
- OSPF neighbors to both leaves
- LDP neighbors to both leaves operational
- EVPN neighbors to both leaves established

## LEAF-1

```bash
ip -br addr
bridge link
bridge vlan show
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show mpls ldp interface'
vtysh -c 'show mpls ldp neighbor'
vtysh -c 'show mpls table'
vtysh -c 'show bgp l2vpn evpn summary'
vtysh -c 'show ip route'
bridge fdb show
```

Expected:

- `eth0` = `10.0.0.1/31`
- `swp1` = `10.0.0.3/31`
- `swp2` in `br0` and `LOWER_UP`
- OSPF full to both spines
- LDP active on both uplinks
- LDP neighbors operational to both spines
- MPLS table populated
- EVPN neighbors established

## LEAF-2

```bash
ip -br addr
bridge link
bridge vlan show
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show mpls ldp interface'
vtysh -c 'show mpls ldp neighbor'
vtysh -c 'show mpls table'
vtysh -c 'show bgp l2vpn evpn summary'
vtysh -c 'show ip route'
bridge fdb show
```

Expected:

- `eth0` = `10.0.0.5/31`
- `swp1` = `10.0.0.7/31`
- `swp2` in `br0` and `LOWER_UP`
- OSPF full to both spines
- LDP active on both uplinks
- LDP neighbors operational to both spines
- MPLS table populated
- EVPN neighbors established

## GPU-A

```bash
ip -br addr
ip -br link
rdma link show
ibv_devices
ping -c 3 172.16.10.12
```

Expected:

- `ens3` = `172.16.10.11/24`
- `rxe0` present on `ens3`
- ping to `172.16.10.12` succeeds

## GPU-B

```bash
ip -br addr
ip -br link
rdma link show
ibv_devices
ping -c 3 172.16.10.11
```

Expected:

- `ens3` = `172.16.10.12/24`
- `rxe0` present on `ens3`
- ping to `172.16.10.11` succeeds

## RDMA Test

On `GPU-B`:

```bash
ib_write_bw
```

On `GPU-A`:

```bash
ib_write_bw 172.16.10.12
```

Expected:

- client connects
- bandwidth table starts printing
