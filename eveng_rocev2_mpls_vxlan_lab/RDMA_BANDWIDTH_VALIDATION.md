# RDMA Bandwidth Validation

Use this file to validate end-to-end RDMA connectivity and bandwidth test start.

## Pre-check

### GPU-A

```bash
ping -c 3 172.16.10.12
```

### GPU-B

```bash
ping -c 3 172.16.10.11
```

Healthy:

- both hosts can ping each other over the overlay

## Server Side

### GPU-B

```bash
ib_write_bw
```

Healthy:

- waits for client connection
- after connection, prints device/session details

Expected:

```text
************************************
* Waiting for client to connect... *
************************************
```

## Client Side

### GPU-A

```bash
ib_write_bw 172.16.10.12
```

Healthy:

- client connects to GPU-B
- local and remote RDMA parameters print
- bandwidth table starts

Expected:

```text
RDMA_Write BW Test
Device         : rxe0
Link type      : Ethernet
```

## Final Proof

If the bandwidth table starts printing, end-to-end RDMA connectivity is working across the lab.

