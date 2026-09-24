# EVPN Validation

Use this file to validate EVPN BGP only.

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

## LEAF-1

```bash
vtysh -c 'show bgp l2vpn evpn summary'
vtysh -c 'show bgp l2vpn evpn route'
```

Healthy:

- EVPN neighbors to both spines are established
- EVPN routes are present

## LEAF-2

```bash
vtysh -c 'show bgp l2vpn evpn summary'
vtysh -c 'show bgp l2vpn evpn route'
```

Healthy:

- EVPN neighbors to both spines are established
- EVPN routes are present

