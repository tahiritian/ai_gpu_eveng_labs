# Cumulus5.x Cmds

Cumulus uses a simpler naming convention:
swp1 = Switch Port 1
swp2 = Switch Port 2
swp3 = Switch Port 3

- root:
cumulus@cumulus:mgmt:~$ `sudo -i`
[sudo] password for cumulus:

ZTP in progress. To disable, do 'ztp -d'

root@cumulus:mgmt:~#


# hostname [Cumulus LEAF Devices]
nv set system hostname LEAF-1
nv config apply

nv set system hostname LEAF-2
nv config apply

-check with: hostname
- exit & re-login:
cumulus@LEAF-1:mgmt:~$ sudo -i
[sudo] password for cumulus:
root@LEAF-1:mgmt:~#
root@LEAF-1:mgmt:~#

[ NOTE]: ==> `avoid nv config apply after manual networking/routing edits.`

# Save config  

• If you are editing /etc/network/interfaces and /etc/frr/frr.conf directly. [ie, in Eveng Lab]
[STOP] - `nv config apply` [does not apply manual file edits]. It applies the NVUE database and can overwrite those files.

- So the rule is: [For Lab, or Manual Edits]

  - If you edit files manually:
      - use `ifreload -a`
      - use `systemctl restart frr`
      - [do not] run nv config apply

  - If you `want` to use `nv config apply`: 
      - make changes with `nv set` ...
      - then run nv config apply

```
• Because nv config apply is applying the NVUE saved revision, and NVUE treats /etc/network/interfaces and /etc/frr/frr.conf as generated outputs.

  What happened:

  - You manually edited:
      - /etc/network/interfaces
      - /etc/frr/frr.conf

  - Then you ran:
      - nv config apply applied

  - NVUE warned those files would be overwritten
  - It then rebuilt them from the applied NVUE revision and replaced your manual changes

  So the earlier changes were not “lost” randomly. They were replaced by the config database that NVUE manages.

  In Cumulus, there are two different configuration models:

  1. Traditional/manual:
      - edit /etc/network/interfaces
      - edit /etc/frr/frr.conf
      - use ifreload -a, systemctl restart frr

  2. NVUE-managed:
      - configure with nv set ...
      - nv config apply
      - NVUE regenerates the underlying files

  Do not mix them unless you know exactly when NVUE will re-render the files.
```

# show config
nv show
nv show --output yaml
nv show --output json
nv config diff
nv show interface
nv show interface swp1
nv show vrf default router bgp
cat /etc/network/interfaces
cat /etc/frr/frr.conf



# ========================== [LEAF-1] Config_Example (Eveng Lab):

- Config files
leaf1-interfaces
leaf1-frr.conf

The interfaces file creates the IP connectivity. The frr.conf file tells the routing daemon how to use that connectivity.
# How it works:
```
             leaf1-interfaces
                     │
                     ▼
        Configure Linux interfaces
       (swp1, swp2, lo, eth0...)
                     │
                     ▼
          Interfaces receive IPs
                     │
                     ▼
             leaf1-frr.conf
                     │
                     ▼
          Configure BGP/OSPF/EVPN
                     │
                     ▼
      Advertise routes over the links
```

• On LEAF1, copy the file contents from eveng_rocev2_mpls_vxlan_lab/configs/leaf1-interfaces:1 into /etc/network/interfaces, then reload networking.

# nano /etc/network/interfaces      
```
  source /etc/network/interfaces.d/*.intf

  auto lo
  iface lo inet loopback
      address 10.255.255.21/32
      address 10.255.1.21/32

  auto eth0
  iface eth0 inet dhcp
      vrf mgmt

  auto mgmt
  iface mgmt
      address 127.0.0.1/8
      address ::1/128
      vrf-table auto

  # EVE mapping: swp1=SPINE1 Ethernet1, swp2=SPINE2 Ethernet1, swp3=GPU-A eth0

  auto swp1
  iface swp1
      address 10.0.0.1/31

  auto swp2
  iface swp2
      address 10.0.0.3/31

  auto swp3
  iface swp3

  auto vni10
  iface vni10
      vxlan-id 10010
      vxlan-local-tunnelip 10.255.1.21
      bridge-access 10

  auto br0
  iface br0
      bridge-ports swp3 vni10
      bridge-vlan-aware yes
      bridge-vids 10
```
 - Then:
         ifreload -a   [Apply]
         ip -br addr   [Verify]


# nano /etc/frr/frr.conf

```
  frr version 8.4
  frr defaults datacenter
  hostname leaf1
  service integrated-vtysh-config
  !
  interface lo
   ip ospf area 0
  !
  interface swp1
   ip ospf network point-to-point
   ip ospf area 0
   mpls ldp sync
  !
  interface swp2
   ip ospf network point-to-point
   ip ospf area 0
   mpls ldp sync
  !
  router ospf
   ospf router-id 10.255.255.21
   passive-interface default
   no passive-interface swp1
   no passive-interface swp2
   network 10.255.255.21/32 area 0
   network 10.0.0.0/31 area 0
   network 10.0.0.2/31 area 0
  !
  mpls ldp
   router-id 10.255.255.21
   address-family ipv4
    discovery transport-address 10.255.255.21
    interface swp1
    interface swp2
   exit-address-family
  !
  router bgp 65000
   bgp router-id 10.255.255.21
   no bgp default ipv4-unicast
   neighbor SPINES peer-group
   neighbor SPINES remote-as 65000
   neighbor SPINES update-source lo
   neighbor 10.255.255.11 peer-group SPINES
   neighbor 10.255.255.12 peer-group SPINES
   !
   address-family l2vpn evpn
    neighbor SPINES activate
    advertise-all-vni
   exit-address-family
  !
  end
```

- Then apply it:

  systemctl restart frr

- Validate: [Make sure all network components ie, Spine, other leafs are configured as well]
  vtysh -c 'show running-config'
  vtysh -c 'show ip ospf neighbor'
  vtysh -c 'show mpls ldp neighbor'
  vtysh -c 'show bgp l2vpn evpn summary'
--------------------------------------------

# ========================== [LEAF-2] Config_Example (Eveng Lab):

# nano /etc/network/interfaces
```
  source /etc/network/interfaces.d/*.intf

  auto lo
  iface lo inet loopback
      address 10.255.255.22/32
      address 10.255.1.22/32

  auto eth0
  iface eth0 inet dhcp
      vrf mgmt

  auto mgmt
  iface mgmt
      address 127.0.0.1/8
      address ::1/128
      vrf-table auto

  # EVE mapping:
  # swp1 = SPINE1 Ethernet2
  # swp2 = SPINE2 Ethernet2
  # swp3 = GPU-B data port

  auto swp1
  iface swp1
      address 10.0.0.5/31

  auto swp2
  iface swp2
      address 10.0.0.7/31

  auto swp3
  iface swp3

  auto vni10
  iface vni10
      vxlan-id 10010
      vxlan-local-tunnelip 10.255.1.22
      bridge-access 10

  auto br0
  iface br0
      bridge-ports swp3 vni10
      bridge-vlan-aware yes
      bridge-vids 10
```
- Apply:
  ifreload -a

- Validate:
  ip -br addr
  bridge link
  bridge vlan show


# nano /etc/frr/frr.conf

```
  frr version 8.4
  frr defaults datacenter
  hostname leaf2
  service integrated-vtysh-config
  !
  ip forwarding
  !
  interface lo
   ip ospf area 0
  !
  interface swp1
   ip ospf network point-to-point
   ip ospf area 0
   mpls ldp sync
  !
  interface swp2
   ip ospf network point-to-point
   ip ospf area 0
   mpls ldp sync
  !
  router ospf
   ospf router-id 10.255.255.22
   passive-interface default
   no passive-interface swp1
   no passive-interface swp2
   network 10.255.255.22/32 area 0
   network 10.0.0.4/31 area 0
   network 10.0.0.6/31 area 0
  !
  mpls ldp
   router-id 10.255.255.22
   address-family ipv4
    discovery transport-address 10.255.255.22
    interface swp1
    interface swp2
   exit-address-family
  !
  router bgp 65000
   bgp router-id 10.255.255.22
   no bgp default ipv4-unicast
   neighbor SPINES peer-group
   neighbor SPINES remote-as 65000
   neighbor SPINES update-source lo
   neighbor SPINES send-community
   neighbor SPINES send-community extended
   neighbor 10.255.255.11 peer-group SPINES
   neighbor 10.255.255.12 peer-group SPINES
   !
   address-family l2vpn evpn
    neighbor SPINES activate
    advertise-all-vni
   exit-address-family
  !
  end
```
- Apply:
  systemctl restart frr

- Then validate:

  vtysh -c 'show running-config'
  vtysh -c 'show ip ospf neighbor'
  vtysh -c 'show mpls ldp neighbor'
  vtysh -c 'show bgp l2vpn evpn summary'

---------------------------------------

# SPINE-1 Config_Example:
```
! Use vEOS or vEOS-lab with MPLS support. This config is a starter,
! and RSVP-TE syntax may need adjustment for the exact EOS release.
! EVE mapping: Mgmt1 exists but is unused; fabric links start on Ethernet1/Ethernet2.
!
hostname spine1
service routing protocols model multi-agent
ip routing
!
interface Loopback0
   ip address 10.255.255.11/32
!
interface Ethernet1
   description to-leaf1-swp1
   no switchport
   ip address 10.0.0.0/31
   mpls ip
!
interface Ethernet2
   description to-leaf2-swp1
   no switchport
   ip address 10.0.0.4/31
   mpls ip
!
router ospf 100
   router-id 10.255.255.11
   network 10.0.0.0/31 area 0.0.0.0
   network 10.0.0.4/31 area 0.0.0.0
   network 10.255.255.11/32 area 0.0.0.0
!
mpls ldp
   router-id interface Loopback0 force
   transport-address interface Loopback0
   interface Ethernet1
   interface Ethernet2
!
router bgp 65000
   router-id 10.255.255.11
   no bgp default ipv4-unicast
   neighbor LEAFS peer group
   neighbor LEAFS remote-as 65000
   neighbor LEAFS update-source Loopback0
   neighbor LEAFS send-community
   neighbor LEAFS send-community extended
   neighbor 10.255.255.21 peer group LEAFS
   neighbor 10.255.255.22 peer group LEAFS
   !
   address-family evpn
      neighbor LEAFS activate
      neighbor LEAFS route-reflector-client
!
! Optional image-dependent TE block
! interface Tunnel1
!    description leaf1-to-leaf2-te
!    tunnel mode mpls traffic-eng
!    tunnel destination 10.255.255.22
!    tunnel mpls traffic-eng bandwidth 100000
!    tunnel mpls traffic-eng path-option 1 dynamic
```

# SPINE-2 Config_Example:
```
! Use vEOS or vEOS-lab with MPLS support. This config is a starter,
! and RSVP-TE syntax may need adjustment for the exact EOS release.
! EVE mapping: Mgmt1 exists but is unused; fabric links start on Ethernet1/Ethernet2.
!
hostname spine2
service routing protocols model multi-agent
ip routing
!
interface Loopback0
   ip address 10.255.255.12/32
!
interface Ethernet1
   description to-leaf1-swp2
   no switchport
   ip address 10.0.0.2/31
   mpls ip
!
interface Ethernet2
   description to-leaf2-swp2
   no switchport
   ip address 10.0.0.6/31
   mpls ip
!
router ospf 100
   router-id 10.255.255.12
   network 10.0.0.2/31 area 0.0.0.0
   network 10.0.0.6/31 area 0.0.0.0
   network 10.255.255.12/32 area 0.0.0.0
!
mpls ldp
   router-id interface Loopback0 force
   transport-address interface Loopback0
   interface Ethernet1
   interface Ethernet2
!
router bgp 65000
   router-id 10.255.255.12
   no bgp default ipv4-unicast
   neighbor LEAFS peer group
   neighbor LEAFS remote-as 65000
   neighbor LEAFS update-source Loopback0
   neighbor LEAFS send-community
   neighbor LEAFS send-community extended
   neighbor 10.255.255.21 peer group LEAFS
   neighbor 10.255.255.22 peer group LEAFS
   !
   address-family evpn
      neighbor LEAFS activate
      neighbor LEAFS route-reflector-client
!
! Optional image-dependent TE block
! interface Tunnel1
!    description leaf2-to-leaf1-te
!    tunnel mode mpls traffic-eng
!    tunnel destination 10.255.255.21
!    tunnel mpls traffic-eng bandwidth 100000
!    tunnel mpls traffic-eng path-option 1 dynamic
```
=================

# HOST CentOS  / Pre-Installed required Packages / Config_Example

- Mappings:
| GNS3 Adapter | Linux Interface |
| ------------ | --------------- |
| e0           | ens3            | > let say connected to a leaf switch
| e1           | ens4            |
| e2           | ens5            |
| e3           | ens6            |
| **e4**       | **ens7**        | > let say connected to local LAN  192.168.86.x subnet


### GPU-A:
sudo ip addr add 172.16.10.11/24 dev ens3
sudo ip link set ens3 up

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

  sudo ip addr add 172.16.10.12/24 dev ens3
  sudo ip link set ens3 up
  sudo modprobe rdma_rxe
  sudo modprobe ib_uverbs
  sudo modprobe rdma_ucm
  sudo rxe_cfg start
  sudo rxe_cfg add ens3
  rdma link show
  ibv_devices

-----------------------------------
###################################
-----------------------------------

•  VALIDATIONS CHECKLIST
   =====================

Run these checks in order before starting [LAB_WORKBOOK.pdf](/Users/mtahir/eveng_rocev2_mpls_vxlan_lab/LAB_WORKBOOK.pdf:1).

## LEAF1

```bash
ip -br addr
bridge link
bridge vlan show
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show ip route'
vtysh -c 'show mpls ldp neighbor'
vtysh -c 'show bgp l2vpn evpn summary'
bridge fdb show
```

Pass if:

- `swp1` = `10.0.0.1/31`
- `swp2` = `10.0.0.3/31`
- `vni10` and `br0` exist
- OSPF neighbors to both spines are up
- LDP neighbors are up
- EVPN sessions are established

## LEAF2

```bash
ip -br addr
bridge link
bridge vlan show
vtysh -c 'show ip ospf neighbor'
vtysh -c 'show ip route'
vtysh -c 'show mpls ldp neighbor'
vtysh -c 'show bgp l2vpn evpn summary'
bridge fdb show
```

Pass if:

- `swp1` = `10.0.0.5/31`
- `swp2` = `10.0.0.7/31`
- `vni10` and `br0` exist
- OSPF neighbors to both spines are up
- LDP neighbors are up
- EVPN sessions are established

## SPINE1

```text
show ip interface brief
show interfaces status
show ip ospf neighbor
show ip route
show mpls ldp neighbor
show mpls ldp ipv4 bindings
show mpls forwarding-table
show bgp evpn summary
```

Pass if:

- `Ethernet1` and `Ethernet2` are up and routed
- OSPF neighbors to both leaves are up
- LDP neighbors are up
- EVPN sessions to both leaves are up

## SPINE2

```text
show ip interface brief
show interfaces status
show ip ospf neighbor
show ip route
show mpls ldp neighbor
show mpls ldp ipv4 bindings
show mpls forwarding-table
show bgp evpn summary
```

Pass if:

- `Ethernet1` and `Ethernet2` are up and routed
- OSPF neighbors to both leaves are up
- LDP neighbors are up
- EVPN sessions to both leaves are up

## Loopback Ping Tests

From `LEAF1`:

```bash
ping -c 3 10.255.255.11
ping -c 3 10.255.255.12
ping -c 3 10.255.255.22
```

From `LEAF2`:

```bash
ping -c 3 10.255.255.11
ping -c 3 10.255.255.12
ping -c 3 10.255.255.21
```

## GPU-A

```bash
ip -br link
ip -br addr
ping -c 3 172.16.10.12
rdma link show
ibv_devices
```

Pass if:

- `ens3` has `172.16.10.11/24`
- ping to `172.16.10.12` works
- RXE device exists
- `ibv_devices` is not empty

## GPU-B

```bash
ip -br link
ip -br addr
ping -c 3 172.16.10.11
rdma link show
ibv_devices
```

Pass if:

- `ens3` has `172.16.10.12/24`
- ping to `172.16.10.11` works
- RXE device exists
- `ibv_devices` is not empty

## Soft-RoCE Test

On `GPU-B`:

```bash
ib_write_bw
```

On `GPU-A`:

```bash
ib_write_bw 172.16.10.12
```

Pass if:

- client and server connect successfully
- the bandwidth test runs without RDMA device errors

## Ready For Workbook

Start [LAB_WORKBOOK.pdf](/Users/mtahir/eveng_rocev2_mpls_vxlan_lab/LAB_WORKBOOK.pdf:1) only when:

- OSPF is up
- LDP is up
- EVPN is up
- host ping works
- RXE works on both hosts
===========================


##### TROUBLESHOOT ANY ISSUES: [Few Examples Below]

  1. Fix FRR daemons on both leaves

# On LEAF-1 and LEAF-2:

  cat /etc/frr/daemons
  systemctl status frr --no-pager

# On GPU-A and GPU-B:

  for i in ens3 ens4 ens5 ens6; do echo "=== $i ==="; ip -br link show $i; done

--
### • You’ve isolated the root cause on the leaves:

  - frr.service is running
  - but only zebra and staticd are started
  - bgpd=no, ospfd=no, ldpd=no in /etc/frr/daemons
    `So FRR is not actually running the protocols you need.`

  # Problem 1: FRR daemons are disabled
    - On both LEAF-1 and LEAF-2, run:

  sudo sed -i 's/^bgpd=no/bgpd=yes/' /etc/frr/daemons
  sudo sed -i 's/^ospfd=no/ospfd=yes/' /etc/frr/daemons
  sudo sed -i 's/^ldpd=no/ldpd=yes/' /etc/frr/daemons
  sudo systemctl restart frr

  - Then verify:

  cat /etc/frr/daemons | egrep 'bgpd|ospfd|ldpd'
  systemctl status frr --no-pager
  vtysh -c 'show ip ospf neighbor'
  vtysh -c 'show mpls ldp neighbor'
  vtysh -c 'show bgp l2vpn evpn summary'

  - Expected:

  - bgpd=yes
  - ospfd=yes
  - ldpd=yes
---------------













