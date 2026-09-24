# Host in EVENG Lab
- CentOS

- Mappings:
| GNS3 Adapter | Linux Interface |
| ------------ | --------------- |
| e0           | ens3            | > let say connected to a leaf switch
| e1           | ens4            |
| e2           | ens5            |
| e3           | ens6            |
| **e4**       | **ens7**        | > let say connected to local LAN  192.168.86.x subnet


# IP assignment to MGMT NW

[root@localhost ~]# ip link

[root@localhost ~]# dhclient ens7
[root@localhost ~]# ip addr show ens7

default via 192.168.86.1 dev ens7
192.168.86.0/24 dev ens7 proto kernel scope link src 192.168.86.35

[root@localhost ~]# ping 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=116 time=15.1 ms
---------

# hostname
sudo hostnamectl set-hostname GPU-A

hostname
hostnamectl
cat /etc/hostname
---------

## Base Packages

On both nodes:

```bash
sudo dnf install -y epel-release
sudo dnf install -y rdma-core libibverbs libibverbs-utils perftest infiniband-diags ethtool tcpdump iproute
```
- Essential packages:
```
sudo dnf install -y \
tcpdump \
iproute \
net-tools \
ethtool \
mtr \
traceroute \
bind-utils \
wget \
curl \
vim \
tmux \
git \
lsof \
jq

---## Install LLDP:
sudo dnf install -y lldpd
sudo systemctl enable --now lldpd
 
 Check:- lldpcli show neighbors

sudo dnf install -y netperf
sudo dnf install -y iperf3
sudo dnf install -y nmap
sudo dnf install -y bridge-utils
sudo dnf install -y tcpdump iperf3 ethtool

sudo dnf install -y \
tcpdump \
iperf3 \
lldpd \
ethtool \
mtr \
bind-utils \
jq \
vim \
tmux \
git \
curl \
wget \
bridge-utils \
frr



```

- Install OpenSM
  `yum install opensm`


----------------
# IP assignment
  - ens shown instead eth
sudo ip addr add 172.16.10.11/24 dev ens3
sudo ip link set ens3 up

[root@localhost ~]# ethtool ens3
ip addr show ens3
-----------

dnf install -y rdma-core rdma-core-devel infiniband-diags perftest
reboot

---------
---------
# Created the software RDMA device

### GPU-A:
  sudo ip addr add 172.16.10.11/24 dev ens3
  sudo ip link set ens3 up
  sudo modprobe rdma_rxe
  sudo modprobe ib_uverbs
  sudo modprobe rdma_ucm
  sudo rxe_cfg start
  sudo rxe_cfg add ens3
  rdma link show
  ibv_devices

### GPU-B:
  sudo ip addr add 172.16.10.12/24 dev ens3
  sudo ip link set ens3 up
  sudo modprobe rdma_rxe
  sudo modprobe ib_uverbs
  sudo modprobe rdma_ucm
  sudo rxe_cfg start
  sudo rxe_cfg add ens3
  rdma link show
  ibv_devices

## Validations:

[root@GPU-A ~]#   rdma link show
link rxe0/1 state ACTIVE physical_state LINK_UP netdev ens3
[root@GPU-A ~]#   ibv_devices[ 1846.934769] db_root: cannot open: /etc/target

    device          	   node GUID
    ------          	----------------
    rxe0            	520000fffe050000


link rxe0/1 state ACTIVE physical_state LINK_UP netdev ens3
[root@GPU-B ~]#   ibv_devices[ 2124.290810] db_root: cannot open: /etc/target

    device          	   node GUID
    ------          	----------------
    rxe0            	520000fffe060000


• That’s working now.

  You successfully created the software RDMA device on ens3:

  - rdma link show:
      - rxe0/1 ... netdev ens3

  - ibv_devices:
      - rxe0

# Validate end to end:

-  On GPU-B:
   ping -c 3 172.16.10.12

# And run a basic bandwidth test:

- On GPU-B:

  `ib_write_bw`

- On GPU-A:

  ib_write_bw 172.16.10.12




====================================================

# CentOS GPU Node Stand-Ins

Validated EVE image for this repo: `linux-centos-8`

These are not real GPU nodes in EVE-NG. They are stand-ins so you can practice:

- host addressing on the VXLAN segment
- `rdma-core` userland tooling
- soft-RoCE with `rdma_rxe`
- `perftest`, `ibverbs`, `ucx`, and packet capture

## Base Packages

On both nodes:

```bash
sudo dnf install -y epel-release
sudo dnf install -y rdma-core libibverbs libibverbs-utils perftest infiniband-diags ethtool tcpdump iproute
```

## Host IPs

On `GPU-A`:

```bash
sudo ip addr add 172.16.10.11/24 dev eth0
sudo ip link set eth0 up
```

On `GPU-B`:

```bash
sudo ip addr add 172.16.10.12/24 dev eth0
sudo ip link set eth0 up
```

Validate:

```bash
ping -c 3 172.16.10.12
ping -c 3 172.16.10.11
```

## Soft-RoCE

On both nodes:

```bash
sudo modprobe rdma_rxe
sudo rdma link add rxe_eth0 type rxe netdev eth0
rdma link show
ibv_devices
```

If `rdma link add` fails, check whether the kernel includes RXE support. Some images require:

```bash
sudo modprobe ib_uverbs
sudo modprobe rdma_ucm
```

## Basic Perftest

On `GPU-B`:

```bash
ib_write_bw
```

On `GPU-A`:

```bash
ib_write_bw 172.16.10.12
```

UDP 4791 capture during the run:

```bash
sudo tcpdump -ni eth0 udp port 4791
```

## Useful Faults To Inject

1. Delete the RXE device on one node and prove the failure is host-side, not network-side.
2. Leave IP reachability intact but remove EVPN on one leaf and observe the host symptom.
3. Mark traffic with DSCP `26` on one host only and compare switch counters.
4. Shut one leaf uplink and verify underlay reconvergence before touching RDMA tooling.

## Optional Tools

```bash
sudo dnf install -y ucx ucx-devel
```

This lets you add a UCX layer to the troubleshooting flow even without real GPUs.
