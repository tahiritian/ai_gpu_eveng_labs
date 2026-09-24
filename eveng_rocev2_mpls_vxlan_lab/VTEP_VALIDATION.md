# VTEP Validation

Use this file to validate VTEP loopbacks and routed reachability to remote VTEPs.

## LEAF-1

```bash
ip -br addr
vtysh -c 'show ip route'
ping -c 3 10.255.1.22
ping -c 3 10.255.255.22
```

Healthy:

- local VTEP loopback `10.255.1.21/32` exists on `lo`
- route exists to remote VTEP `10.255.1.22/32`
- ping to remote VTEP succeeds

## LEAF-2

```bash
ip -br addr
vtysh -c 'show ip route'
ping -c 3 10.255.1.21
ping -c 3 10.255.255.21
```

Healthy:

- local VTEP loopback `10.255.1.22/32` exists on `lo`
- route exists to remote VTEP `10.255.1.21/32`
- ping to remote VTEP succeeds

