# MPLS LDP Validation

Use this file to validate MPLS/LDP only.

## SPINE1

```text
show running-config section mpls
show mpls ldp neighbor
```

Healthy:

- MPLS/LDP config is present
- LDP neighbors to `10.255.255.21` and `10.255.255.22` are operational

## SPINE2

```text
show running-config section mpls
show mpls ldp neighbor
```

Healthy:

- MPLS/LDP config is present
- LDP neighbors to `10.255.255.21` and `10.255.255.22` are operational

## LEAF-1

```bash
vtysh -c 'show mpls ldp interface'
vtysh -c 'show mpls ldp discovery'
vtysh -c 'show mpls ldp neighbor'
vtysh -c 'show mpls table'
```

Healthy:

- `eth0` and `swp1` are `ACTIVE`
- discoveries seen from both spines
- neighbors to `10.255.255.11` and `10.255.255.12` are `OPERATIONAL`
- MPLS table is populated

## LEAF-2

```bash
vtysh -c 'show mpls ldp interface'
vtysh -c 'show mpls ldp discovery'
vtysh -c 'show mpls ldp neighbor'
vtysh -c 'show mpls table'
```

Healthy:

- `eth0` and `swp1` are `ACTIVE`
- discoveries seen from both spines
- neighbors to `10.255.255.11` and `10.255.255.12` are `OPERATIONAL`
- MPLS table is populated

