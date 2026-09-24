# VXLAN Validation

Use this file to validate VXLAN VNI state and bridge-domain attachment.

## LEAF-1

```bash
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10
```

Healthy:

- `swp2` and `vni10` are in `br0`
- VLAN `10` is present
- `vni10` shows `vxlan id 10010`
- `vni10` local tunnel IP is `10.255.1.21`

## LEAF-2

```bash
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10
```

Healthy:

- `swp2` and `vni10` are in `br0`
- VLAN `10` is present
- `vni10` shows `vxlan id 10010`
- `vni10` local tunnel IP is `10.255.1.22`

