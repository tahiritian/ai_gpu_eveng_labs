# RoCE Validation

Use this file when you only want to validate soft-RoCE (`rxe`) and RDMA behavior on the GPU hosts.

## Scope

This lab validates:

- RXE device creation on Linux hosts
- RDMA userspace visibility
- end-to-end RDMA connectivity across the lab fabric
- `ib_write_bw` session establishment and bandwidth test start

This lab does not validate:

- hardware NIC RoCE
- ASIC PFC behavior
- ASIC ECN/DCQCN behavior
- lossless hardware Ethernet

## GPU-A

```bash
ip -br addr
ip -br link
lsmod | egrep 'rdma_rxe|ib_uverbs|rdma_ucm'
rdma link show
ibv_devices
ping -c 3 172.16.10.12
```

Healthy:

- `ens3` has `172.16.10.11/24`
- `ens3` is `UP`
- `rdma_rxe`, `ib_uverbs`, and `rdma_ucm` are loaded
- `rdma link show` includes `rxe0` on `ens3`
- `ibv_devices` shows `rxe0`
- ping to `172.16.10.12` succeeds

Expected examples:

```text
link rxe0/1 state ACTIVE physical_state LINK_UP netdev ens3
```

```text
device           node GUID
------           ----------------
rxe0             520000fffe050000
```

## GPU-B

```bash
ip -br addr
ip -br link
lsmod | egrep 'rdma_rxe|ib_uverbs|rdma_ucm'
rdma link show
ibv_devices
ping -c 3 172.16.10.11
```

Healthy:

- `ens3` has `172.16.10.12/24`
- `ens3` is `UP`
- `rdma_rxe`, `ib_uverbs`, and `rdma_ucm` are loaded
- `rdma link show` includes `rxe0` on `ens3`
- `ibv_devices` shows `rxe0`
- ping to `172.16.10.11` succeeds

Expected examples:

```text
link rxe0/1 state ACTIVE physical_state LINK_UP netdev ens3
```

```text
device           node GUID
------           ----------------
rxe0             520000fffe060000
```

## RXE Setup Reference

### GPU-A

```bash
ip addr flush dev ens3
ip addr add 172.16.10.11/24 dev ens3
ip link set ens3 up
modprobe rdma_rxe
modprobe ib_uverbs
modprobe rdma_ucm
rxe_cfg start
rxe_cfg add ens3
rdma link show
ibv_devices
```

### GPU-B

```bash
ip addr flush dev ens3
ip addr add 172.16.10.12/24 dev ens3
ip link set ens3 up
modprobe rdma_rxe
modprobe ib_uverbs
modprobe rdma_ucm
rxe_cfg start
rxe_cfg add ens3
rdma link show
ibv_devices
```

## RDMA Bandwidth Test

### On GPU-B

```bash
ib_write_bw
```

Healthy:

- server waits for the client
- after client connection, session parameters are printed
- output advances to the bandwidth results table

Expected example:

```text
************************************
* Waiting for client to connect... *
************************************
```

Then after client connects:

```text
RDMA_Write BW Test
Device         : rxe0
Transport type : IB
Link type      : Ethernet
```

### On GPU-A

```bash
ib_write_bw 172.16.10.12
```

Healthy:

- client connects to GPU-B
- local and remote RDMA parameters are displayed
- output advances to the bandwidth results table

Expected example:

```text
local address: LID 0000 QPN ...
remote address: LID 0000 QPN ...
GID: ... 172:16:10:11
GID: ... 172:16:10:12
```

## Full RoCE Proof

If all of the following are true, the soft-RoCE lab path is working:

- host IP reachability works between `172.16.10.11` and `172.16.10.12`
- `rxe0` exists on both hosts
- `ibv_devices` shows the RDMA device on both hosts
- `ib_write_bw` connects successfully
- the bandwidth table begins printing

## Troubleshooting Shortcuts

If `rdma link show` is empty:

- load modules again
- run `rxe_cfg start`
- run `rxe_cfg add ens3`

If `ibv_devices` is empty:

- confirm `ib_uverbs` is loaded
- confirm `rxe0` exists in `rdma link show`

If `ib_write_bw` does not connect:

- verify host IP reachability first
- verify overlay reachability with standard `ping`
- verify `GPU-B` is already running `ib_write_bw` server mode
