# Soft-RoCE RXE Validation

Use this file to validate RXE device creation only.

## GPU-A

```bash
ip -br addr
lsmod | egrep 'rdma_rxe|ib_uverbs|rdma_ucm'
rdma link show
ibv_devices
```

Healthy:

- `ens3=172.16.10.11/24`
- required RDMA modules are loaded
- `rxe0` is bound to `ens3`
- `ibv_devices` shows `rxe0`

## GPU-B

```bash
ip -br addr
lsmod | egrep 'rdma_rxe|ib_uverbs|rdma_ucm'
rdma link show
ibv_devices
```

Healthy:

- `ens3=172.16.10.12/24`
- required RDMA modules are loaded
- `rxe0` is bound to `ens3`
- `ibv_devices` shows `rxe0`

