# OSPF Validation

Use this file to validate only the routed underlay and OSPF adjacencies.

## SPINE1

```text
show ip interface brief
show ip ospf neighbor
show ip route
```

Healthy:

- `Ethernet1` and `Ethernet2` are `up/up`
- OSPF neighbors to `10.255.255.21` and `10.255.255.22` are `FULL`
- routes exist for both leaf loopbacks

## SPINE2

```text
show ip interface brief
show ip ospf neighbor
show ip route
```

Healthy:

- `Ethernet1` and `Ethernet2` are `up/up`
- OSPF neighbors to `10.255.255.21` and `10.255.255.22` are `FULL`
- routes exist for both leaf loopbacks

## LEAF-1

```bash
ip -br addr
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show ip route'
ping -c 3 10.255.255.11
ping -c 3 10.255.255.12
```

Healthy:

- `eth0=10.0.0.1/31`
- `swp1=10.0.0.3/31`
- OSPF neighbors to both spines are `Full`
- routes exist to spine loopbacks and remote leaf loopback

## LEAF-2

```bash
ip -br addr
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show ip route'
ping -c 3 10.255.255.11
ping -c 3 10.255.255.12
```

Healthy:

- `eth0=10.0.0.5/31`
- `swp1=10.0.0.7/31`
- OSPF neighbors to both spines are `Full`
- routes exist to spine loopbacks and remote leaf loopback

