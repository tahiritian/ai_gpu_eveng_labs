-----------------------------------------------------------------
# WALK-THROUGH [EVE-NG RoCEv2 / MPLS-LDP / EVPN-VXLAN / QoS Lab]
-----------------------------------------------------------------

--------------
### SPINE ###
--------------
  - mpls ip = forwarding capability  / enables MPLS on the box. 
  - mpls ldp = label distribution protocol

- mpls ip
  Turns on MPLS forwarding in the `data plane`.
  Meaning: the router can `push, swap, and pop` labels on packets on MPLS-enabled interfaces.
  Think of this as: "use labels to forward traffic."

- mpls ldp
  Turns on LDP in the `control plane.`
  Meaning: the router starts exchanging `label bindings` with neighbors so it knows which labels to use for which prefixes.
  Think of this as: "learn and advertise labels."

# MPLS (Global & Interface Level):

  - Global = enable MPLS/LDP capability and control plane
  - Interface-level = choose exactly which links participate in MPLS forwarding

# Why interface-level enable matters:

  - MPLS is not normally turned on everywhere, because only transit/core links should accept and forward labeled traffic.
  - It limits scope and avoids accidental labeled forwarding on edge/access ports.

# Where you apply mpls ip in practice:

  - spine-to-leaf routed links in an MPLS fabric
  - PE-to-P MPLS core links
  - any transit link expected to carry labeled packets

# CMD: `transport-address interface Loopback0`
  - Uses the loopback address as the TCP source/destination for LDP sessions. 

# CMD: `no bgp default ipv4-unicast`
  - Prevents neighbors from automatically entering the IPv4 unicast address family. This is common when BGP is being used only for EVPN here.
  
# `neighbor LEAFS peer group`
  - Creates a peer-group named LEAFS.
# `neighbor LEAFS remote-as 65000`
  - All peers in that group are in the same AS, so this is iBGP.

# `neighbor LEAFS route-reflector-client`
  This device is acting as a route reflector, and those leaf neighbors are RR clients.
  
# `neighbor LEAFS send-community extended`
  Sends extended communities, required for EVPN because important attributes ride in extended communities.
  
# `neighbor 10.255.255.21 peer group LEAFS`
  - specific leaf neighbors inherit the peer-group settings.
  
# `address-family evpn`
  Enters the EVPN address family.
# `neighbor LEAFS activate`
  Actually enables EVPN exchange with those peers.

```
# SPINE: Arista OS
interface EthernetX
   mpls ip

mpls ldp
   router-id interface Loopback0 force     / as the BGP Router ID
   transport-address interface Loopback0  /  for BGP TCP sessions
   interface Ethernet1
   interface Ethernet2
!
router bgp 65000
 router-id 10.255.255.11
 no bgp default ipv4-unicast
 neighbor LEAFS peer group
 neighbor LEAFS remote-as 65000
 neighbor LEAFS update-source Loopback0
 neighbor LEAFS send-community               / influence routing policy
 neighbor LEAFS send-community extended     /  carry VPN/EVPN metadata, such as Route Targets
 neighbor LEAFS route-reflector-client
 neighbor 10.255.255.21 peer group LEAFS
 neighbor 10.255.255.22 peer group LEAFS
 !
 address-family evpn
 neighbor LEAFS activate

-Checks:
show ip interface brief
show interfaces status
show ip ospf neighbor
show mpls ldp neighbor
show bgp evpn summary
```
# Address Families in BGP
```
| Address Family   | Purpose               | Example Routes         |
| ---------------- | --------------------- | ---------------------- |
| IPv4 Unicast     | Standard IPv4 routing | `192.168.1.0/24`       |
| IPv6 Unicast     | Standard IPv6 routing | `2001:db8::/32`        |
| IPv4 Multicast   | Multicast routing     | PIM/multicast prefixes |
| L2VPN EVPN       | Ethernet VPN (VXLAN)  | MAC/IP and VNI routes  |
| VPNv4            | MPLS Layer 3 VPN      | Customer VPN routes    |
| VPNv6            | MPLS IPv6 VPN         | IPv6 VPN routes        |
```
# Types of BGP Communities
```
| Type               | Size    | Typical Use                          |
| ------------------ | ------- | ------------------------------------ |
| Standard Community | 32 bits | Traffic policy, route filtering      |
| Extended Community | 64 bits | MPLS VPN, EVPN, VXLAN, Route Targets |
| Large Community    | 96 bits | Large-scale policy (newer networks)  |
```

-------------- 
#### LEAF ####   
--------------
- CUMULUS SWITCH:

# `mpls ldp sync`
  - Enables OSPF-LDP synchronization. OSPF will avoid fully preferring the link for transit traffic until LDP is also ready, which helps prevent unlabeled forwarding blackholes.

# `mpls ldp`
  - Starts LDP.

# `address-family ipv4`
  - LDP is operating for IPv4 FECs.

# `discovery transport-address 10.255.255.21`
  - Uses the loopback as the LDP transport address, so LDP sessions are tied to a stable endpoint rather than physical interface IPs.

# `address-family l2vpn evpn`
  - Enters the EVPN address family.

# `neighbor SPINES activate`
  - Enables EVPN for those spine peers.

# `advertise-all-vni`
  Tells the leaf to advertise all locally known VNIs into EVPN.


## Packet Walk: Host A to Host B

  Say Host A sends a frame toward Host B.

  1. Host A sends an Ethernet frame to LEAF-1.
     If Host A is in the same L2 service as Host B, the frame is just a normal Ethernet frame with Host B’s MAC as destination.

  2. LEAF-1 looks up the destination MAC in its EVPN-learned forwarding table.
     It sees that Host B is remote and reachable through LEAF-2.

  3. LEAF-1 imposes MPLS labels.
     Typically two labels are pushed:
      - outer label: transport label from LDP, used to cross the underlay toward LEAF-2
      - inner label: EVPN service label, used by LEAF-2 to identify the correct MAC-VRF / bridge domain / VNI context

  4. LEAF-1 sends the labeled packet to one of its uplinks, eth0 or swp1.
     Which uplink is chosen depends on the underlay route and ECMP hashing.

  5. The spine receives the MPLS packet.
     The spine does not care about tenant MAC learning.
     It only examines the outer transport label and swaps it as needed based on its LDP label table.

  6. If multiple spines are crossed, each P router repeats that label-switching behavior.
     Only the outer transport label is used in transit.

  7. The packet reaches LEAF-2.
     By the time it arrives, the transport label is popped or resolved so LEAF-2 processes the inner EVPN service label.

  8. LEAF-2 uses the EVPN service label to select the correct tenant forwarding context.
     That tells it which bridge domain / MAC table to use.

  9. LEAF-2 forwards the original Ethernet frame toward Host B’s access port.
     Host B receives a normal Ethernet frame. The MPLS labels never reach the host.

```
# Cumulus 5.x LEAF
interface lo
 ip ospf area 0
!
interface eth0
 ip ospf network point-to-point
 ip ospf area 0
 mpls ldp sync

router ospf
 ospf router-id 10.255.255.21
 passive-interface default
 no passive-interface eth0
 no passive-interface swp1
 network 10.255.255.21/32 area 0
 network 10.0.0.0/31 area 0
 network 10.0.0.2/31 area 0
!
mpls ldp
 router-id 10.255.255.21
 address-family ipv4
  discovery transport-address 10.255.255.21
  interface eth0
  interface swp1
 exit-address-family
!
router bgp 65000
 bgp router-id 10.255.255.21
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

```
# ========================= VALIDATIONS ========================= 

## ------ EVPN Validation ----------

# [SPINE]: [SPINE1/2 <> LEAF-1/2]     // BGP EVPN
   router-id LEAF-1  10.255.255.21
   router-id LEAF-2  10.255.255.22
  -------
1. spine1#`show bgp evpn summary`
BGP summary information for VRF default
Router identifier 10.255.255.11, local AS number 65000
Neighbor Status Codes: m - Under maintenance
  Neighbor      V AS           MsgRcvd   MsgSent  InQ OutQ  Up/Down State   `PfxRcd` PfxAcc PfxAdv
  10.255.255.21 4 65000           3732      4380    0    0 03:06:23 `Estab`   2       2      2
  10.255.255.22 4 65000           3734      4382    0    0 03:06:28 `Estab`   2       2      2

[Checks]:
```
✓ 10.255.255.21 is Estab
✓ 10.255.255.22 is Estab
✓ prefixes are received from both leaves
```

# [LEAF]: [LEAF1/2 <> SPINE-1/2]       // BGP L2VPN EVPN
   router-id SPINE1/2: 10.255.255.11 / 10.255.255.12
   ---------
1. LEAF-1# `show bgp l2vpn evpn summary`
BGP router identifier 10.255.255.21, local AS number 65000 vrf-id 0
BGP table version 0
RIB entries 3, using 600 bytes of memory
Peers 2, using 46 KiB of memory
Peer groups 1, using 64 bytes of memory

Neighbor        V         AS   MsgRcvd   MsgSent   TblVer  InQ OutQ  Up/Down State/PfxRcd   PfxSnt
10.255.255.11   4      65000      4616      3932        0    0    0 03:16:25            2        2
10.255.255.12   4      65000      4614      3932        0    0    0 03:16:24            2        2

Total number of neighbors 2

2. LEAF-1# `show bgp l2vpn evpn route`
BGP table version is 2, local router ID is 10.255.255.21
Status codes: s suppressed, d damped, h history, * valid, > best, i - internal
Origin codes: i - IGP, e - EGP, ? - incomplete
EVPN type-1 prefix: [1]:[ESI]:[EthTag]:[IPlen]:[VTEP-IP]:[Frag-id]
EVPN type-2 prefix: [2]:[EthTag]:[MAClen]:[MAC]:[IPlen]:[IP]
EVPN type-3 prefix: [3]:[EthTag]:[IPlen]:[OrigIP]
EVPN type-4 prefix: [4]:[ESI]:[IPlen]:[OrigIP]
EVPN type-5 prefix: [5]:[EthTag]:[IPlen]:[IP]

   Network          Next Hop            Metric LocPrf Weight Path
                    Extended Community
Route Distinguisher: 10.255.255.21:2
*> [2]:[0]:[48]:[50:00:00:05:00:00] RD 10.255.255.21:2
                    10.255.1.21 (LEAF-1)
                                                       32768 i
                    ET:8 RT:65000:10010
*> [3]:[0]:[32]:[10.255.1.21] RD 10.255.255.21:2
                    10.255.1.21 (LEAF-1)
                                                       32768 i
                    ET:8 RT:65000:10010
Route Distinguisher: 10.255.255.22:2
* i[2]:[0]:[48]:[50:00:00:06:00:00] RD 10.255.255.22:2
                    10.255.1.22                   100      0 i
                    RT:65000:10010 ET:8
*>i[2]:[0]:[48]:[50:00:00:06:00:00] RD 10.255.255.22:2
                    10.255.1.22                   100      0 i
                    RT:65000:10010 ET:8
* i[3]:[0]:[32]:[10.255.1.22] RD 10.255.255.22:2
                    10.255.1.22                   100      0 i
                    RT:65000:10010 ET:8
*>i[3]:[0]:[32]:[10.255.1.22] RD 10.255.255.22:2
                    10.255.1.22                   100      0 i
                    RT:65000:10010 ET:8

Displayed 4 prefixes (6 paths)

```
  - 10.255.1.21 = LEAF-1’s EVPN-facing address for this tenant/service
  - 10.255.1.22 = LEAF-2’s EVPN-facing address for this tenant/service

• Take these two lines:

  *> [2]:[0]:[48]:[50:00:00:05:00:00] RD 10.255.255.21:2
     10.255.1.21 (LEAF-1)
                                            32768 i
     ET:8 RT:65000:10010

  *> [3]:[0]:[32]:[10.255.1.21] RD 10.255.255.21:2
     10.255.1.21 (LEAF-1)
                                            32768 i
     ET:8 RT:65000:10010

  Type-2

  Format shown by FRR:
  [2]:[EthTag]:[MAClen]:[MAC]:[IPlen]:[IP]

  Your actual route:
  [2]:[0]:[48]:[50:00:00:05:00:00]

  Field mapping:

  - [2] = EVPN route type 2
    Meaning: MAC/IP advertisement route

  - [0] = Ethernet Tag ID
    Meaning: bridge domain / broadcast domain tag; 0 is common in VLAN-aware EVPN representations

  - [48] = MAC length
    Meaning: 48-bit MAC address

  - [50:00:00:05:00:00] = MAC address being advertised
    Meaning: remote endpoint MAC learned on LEAF-1

  - [IPlen]:[IP] = omitted here
    Meaning: this route is advertising only a MAC, not a bound IP address

  Then the rest of the line:

  - RD 10.255.255.21:2 = Route Distinguisher
    Meaning: makes this EVPN prefix unique; originating node is LEAF-1, instance 2

  Next line:

  - 10.255.1.21 = BGP next hop for this EVPN route
    Meaning: the remote PE/service endpoint to use for this EVPN destination

  - (LEAF-1) = hostname FRR resolved for that next hop

  Attribute line:

  - 32768 = weight
    Meaning: locally originated route, so Cisco-style local weight is high

  - i = origin code IGP
    Meaning: BGP origin attribute is IGP

  Extended communities:

  - ET:8 = encapsulation/service-related EVPN label value shown by FRR here
    In MPLS EVPN context this is the service label carried with the route

  - RT:65000:10010 = Route Target
    Meaning: import/export policy tag used to decide which VRFs/EVIs receive this route

  Type-3

  Format shown by FRR:
  [3]:[EthTag]:[IPlen]:[OrigIP]

  Your actual route:
  [3]:[0]:[32]:[10.255.1.21]

  Field mapping:

  - [3] = EVPN route type 3
    Meaning: Inclusive Multicast Ethernet Tag route, usually called IMET

  - [0] = Ethernet Tag ID
    Meaning: identifies the EVPN broadcast domain

  - [32] = IP length
    Meaning: IPv4 address

  - [10.255.1.21] = Originating IP
    Meaning: the advertising PE’s service-side EVPN address for this EVI

  Then the rest:

  - RD 10.255.255.21:2 = Route Distinguisher
    Meaning: unique per originator and EVPN instance

  Next line:

  - 10.255.1.21 = BGP next hop
    Meaning: send BUM-replication traffic for this EVI toward this PE endpoint

  - (LEAF-1) = resolved hostname

  Attribute line:

  - 32768 = weight
  - i = origin IGP

  Extended communities:

  - ET:8 = service label / EVPN label info FRR is displaying
  - RT:65000:10010 = Route Target for import/export

  What these two routes mean together

  - Type-2 says: “MAC 50:00:00:05:00:00 lives behind LEAF-1 for EVPN instance 2.”
  - Type-3 says: “For BUM traffic in EVPN instance 2, LEAF-1 participates via 10.255.1.21.”

  Why both RD 10.255.255.21:2 and next hop 10.255.1.21 appear

  They represent different things:

  - RD 10.255.255.21:2 ties the route to the originating PE and EVPN instance
  - 10.255.1.21 is the reachable EVPN endpoint used as next hop/originating IP for forwarding

```
[Checks]:
```
✓ EVPN neighbors to both spines are established
✓ EVPN routes are present
```
------------------------------------------------

## ------ MPLS LDP Validation ----------

# [SPINE]
```
1. spine1#show running-config section mpls
mpls ip
mpls ldp
   router-id interface Loopback0
   transport-address interface Loopback0
   no shutdown

2. spine1#show mpls ldp neighbor
Peer LDP ID: 10.255.255.21:0; Local LDP ID: 10.255.255.11:0
   TCP Connection: 10.255.255.21:52265 - 10.255.255.11:646
   State: oper; Msgs sent/rcvd: 1387/1395; downstream unsolicited
   Uptime: 3:49:59
   Keepalive tx interval: 10 sec; proposed local/peer: 10/60 sec
   Keepalive time: 30 sec; proposed local/peer: 30/180 sec; expires in: 21.39 sec
   End-of-LIB: not supported
   Graceful restart: not supported
   Graceful restart rx time: reconnect: 0 sec; recovery: 0 sec
   LDP discovery sources:
      Ethernet1
   Addresses bound to peer:
      10.0.0.1            10.0.0.3       10.255.1.21    10.255.255.21
      192.168.86.36
Peer LDP ID: 10.255.255.22:0; Local LDP ID: 10.255.255.11:0
   TCP Connection: 10.255.255.22:38045 - 10.255.255.11:646
   State: oper; Msgs sent/rcvd: 1387/1403; downstream unsolicited
   Uptime: 3:50:07
   Keepalive tx interval: 10 sec; proposed local/peer: 10/60 sec
   Keepalive time: 30 sec; proposed local/peer: 30/180 sec; expires in: 23.26 sec
   End-of-LIB: not supported
   Graceful restart: not supported
   Graceful restart rx time: reconnect: 0 sec; recovery: 0 sec
   LDP discovery sources:
      Ethernet2
   Addresses bound to peer:
      10.0.0.5            10.0.0.7       10.255.1.22    10.255.255.22
      192.168.86.37
```
[Checks]:
```
✓ MPLS/LDP config is present
✓ LDP neighbors to 10.255.255.21 and 10.255.255.22 are operational
```
# [LEAF]
```
LEAF-1# show mpls ldp interface
AF   Interface   State  Uptime   Hello Timers  ac
ipv4 eth0        ACTIVE 03:55:43 5/15           1
ipv4 swp1        ACTIVE 03:55:43 5/15           1

LEAF-1# show mpls ldp discovery
AF   ID              Type     Source           Holdtime
ipv4 10.255.255.11   Link     eth0                   15
ipv4 10.255.255.12   Link     swp1                   15

LEAF-1# show mpls ldp neighbor
AF   ID              State       Remote Address    Uptime
ipv4 10.255.255.11   OPERATIONAL 10.255.255.11   03:55:40
ipv4 10.255.255.12   OPERATIONAL 10.255.255.12   03:55:43
LEAF-1# show mpls table
 Inbound Label  Type  Nexthop   Outbound Label
 -----------------------------------------------
 16             LDP   10.0.0.0  implicit-null
 17             LDP   10.0.0.0  implicit-null
 18             LDP   10.0.0.2  implicit-null
 19             LDP   10.0.0.2  100001
 19             LDP   10.0.0.0  100003
 20             LDP   10.0.0.2  100000
 20             LDP   10.0.0.0  100002
 21             LDP   10.0.0.2  implicit-null
```
[Checks]:
```
✓ eth0 and swp1 are ACTIVE
✓ discoveries seen from both spines
✓ neighbors to 10.255.255.11 and 10.255.255.12 are OPERATIONAL
✓ MPLS table is populated
```
---------------------------


## ------ OSPF Validation ----------

# [SPINE]
```
spine1#show ip interface brief
                                                                        Address
Interface       IP Address           Status     Protocol         MTU    Owner
--------------- -------------------- ---------- ------------ ---------- -------
Ethernet1       10.0.0.0/31          up         up              1500
Ethernet2       10.0.0.4/31          up         up              1500
Loopback0       10.255.255.11/32     up         up             65535
Management1     unassigned           up         up              1500

spine1#show ip ospf neighbor
Neighbor ID     Instance VRF      Pri State                  Dead Time   Address         Interface
10.255.255.22   100      default  1   FULL                   00:00:37    10.0.0.5        Ethernet2
10.255.255.21   100      default  1   FULL                   00:00:37    10.0.0.1        Ethernet1
spine1#show ip route

VRF: default
Source Codes:
       C - connected, S - static, K - kernel,
       O - OSPF, O IA - OSPF inter area, O E1 - OSPF external type 1,
       O E2 - OSPF external type 2, O N1 - OSPF NSSA external type 1,
       O N2 - OSPF NSSA external type2, O3 - OSPFv3,
       O3 IA - OSPFv3 inter area, O3 E1 - OSPFv3 external type 1,
       O3 E2 - OSPFv3 external type 2,
       O3 N1 - OSPFv3 NSSA external type 1,
       O3 N2 - OSPFv3 NSSA external type2, B - Other BGP Routes,
       B I - iBGP, B E - eBGP, R - RIP, I L1 - IS-IS level 1,
       I L2 - IS-IS level 2, A B - BGP Aggregate,
       A O - OSPF Summary, NG - Nexthop Group Static Route,
       V - VXLAN Control Service, M - Martian,
       DH - DHCP client installed default route,
       DP - Dynamic Policy Route, L - VRF Leaked,
       G  - gRIBI, RC - Route Cache Route,
       CL - CBF Leaked Route

Gateway of last resort is not set

 C        10.0.0.0/31
           directly connected, Ethernet1
 O        10.0.0.2/31 [110/110]
           via 10.0.0.1, Ethernet1
 C        10.0.0.4/31
           directly connected, Ethernet2
 O        10.0.0.6/31 [110/110]
           via 10.0.0.5, Ethernet2
 O        10.255.1.21/32 [110/10]
           via 10.0.0.1, Ethernet1
 O        10.255.1.22/32 [110/10]
           via 10.0.0.5, Ethernet2
 C        10.255.255.11/32
           directly connected, Loopback0
 O        10.255.255.12/32 [110/120]
           via 10.0.0.1, Ethernet1
           via 10.0.0.5, Ethernet2
 O        10.255.255.21/32 [110/10]
           via 10.0.0.1, Ethernet1
 O        10.255.255.22/32 [110/10]
           via 10.0.0.5, Ethernet2
```
# [LEAF]:
```
LEAF-1# show mpls ldp interface
AF   Interface   State  Uptime   Hello Timers  ac
ipv4 eth0        ACTIVE 03:55:43 5/15           1
ipv4 swp1        ACTIVE 03:55:43 5/15           1

LEAF-1# show mpls ldp discovery
AF   ID              Type     Source           Holdtime
ipv4 10.255.255.11   Link     eth0                   15
ipv4 10.255.255.12   Link     swp1                   15

LEAF-1# show mpls ldp neighbor
AF   ID              State       Remote Address    Uptime
ipv4 10.255.255.11   OPERATIONAL 10.255.255.11   03:55:40
ipv4 10.255.255.12   OPERATIONAL 10.255.255.12   03:55:43
LEAF-1# show mpls table
 Inbound Label  Type  Nexthop   Outbound Label
 -----------------------------------------------
 16             LDP   10.0.0.0  implicit-null
 17             LDP   10.0.0.0  implicit-null
 18             LDP   10.0.0.2  implicit-null
 19             LDP   10.0.0.2  100001
 19             LDP   10.0.0.0  100003
 20             LDP   10.0.0.2  100000
 20             LDP   10.0.0.0  100002
 21             LDP   10.0.0.2  implicit-null

LEAF-1#
LEAF-1#
LEAF-1#
LEAF-1# show ip ospf neighbor

Neighbor ID     Pri State           Dead Time Address         Interface                        RXmtL RqstL DBsmL
10.255.255.11     0 Full/DROther      31.751s 10.0.0.0        eth0:10.0.0.1                        0     0     0
10.255.255.12     0 Full/DROther      39.599s 10.0.0.2        swp1:10.0.0.3                        0     0     0

LEAF-1# show ip route
Codes: K - kernel route, C - connected, S - static, R - RIP,
       O - OSPF, I - IS-IS, B - BGP, E - EIGRP, N - NHRP,
       T - Table, v - VNC, V - VNC-Direct, A - Babel, D - SHARP,
       F - PBR, f - OpenFabric, Z - FRR,
       > - selected route, * - FIB route, q - queued, r - rejected, b - backup
       t - trapped, o - offload failure
O   10.0.0.0/31 [110/100] is directly connected, eth0, weight 1, 04:07:19
C>* 10.0.0.0/31 is directly connected, eth0, 04:07:21
O   10.0.0.2/31 [110/100] is directly connected, swp1, weight 1, 04:07:19
C>* 10.0.0.2/31 is directly connected, swp1, 04:07:21
O>* 10.0.0.4/31 [110/110] via 10.0.0.0, eth0, weight 1, 04:05:59
O>* 10.0.0.6/31 [110/110] via 10.0.0.2, swp1, weight 1, 04:05:49
O   10.255.1.21/32 [110/0] is directly connected, lo, weight 1, 04:07:19
C>* 10.255.1.21/32 is directly connected, lo, 04:07:21
O>* 10.255.1.22/32 [110/110] via 10.0.0.0, eth0, label 100003, weight 1, 04:05:45
  *                          via 10.0.0.2, swp1, label 100001, weight 1, 04:05:45
O>* 10.255.255.11/32 [110/110] via 10.0.0.0, eth0, label implicit-null, weight 1, 04:05:59
O>* 10.255.255.12/32 [110/110] via 10.0.0.2, swp1, label implicit-null, weight 1, 04:05:49
O   10.255.255.21/32 [110/0] is directly connected, lo, weight 1, 04:07:19
C>* 10.255.255.21/32 is directly connected, lo, 04:07:21
O>* 10.255.255.22/32 [110/110] via 10.0.0.0, eth0, label 100002, weight 1, 04:05:45
  *                            via 10.0.0.2, swp1, label 100000, weight 1, 04:05:45

LEAF-1# ping 10.255.255.11
vrf-wrapper.sh: switching to vrf "default"; use '--no-vrf-switch' to disable
PING 10.255.255.11 (10.255.255.11) 56(84) bytes of data.
64 bytes from 10.255.255.11: icmp_seq=1 ttl=64 time=3.63 ms

LEAF-1# ping  10.255.255.12
vrf-wrapper.sh: switching to vrf "default"; use '--no-vrf-switch' to disable
PING 10.255.255.12 (10.255.255.12) 56(84) bytes of data.
64 bytes from 10.255.255.12: icmp_seq=1 ttl=64 time=3.70 ms
```
[Checks]:
```
✓ OSPF neighbors to both spines are Full
✓ routes exist to spine loopbacks and remote leaf loopback
```

# ============ Overlay Validation =============
 
- Validate EVPN, VXLAN, and VTEP behavior.

```
# [LEAF]
root@LEAF-1:mgmt:~# ip -br addr
lo               UNKNOWN        127.0.0.1/8 10.255.255.21/32 10.255.1.21/32 ::1/128
eth0             UP             10.0.0.1/31 fe80::5200:ff:fe03:0/64
swp1             UP             10.0.0.3/31 fe80::5200:ff:fe03:1/64
swp2             UP
swp3             DOWN
swp4             DOWN
swp5             DOWN
swp6             DOWN
swp7             DOWN
swp8             DOWN
swp9             DOWN
swp10            DOWN
swp11            DOWN
swp12            DOWN
swp13            DOWN
swp14            DOWN
swp15            DOWN
swp16            DOWN
swp17            DOWN
swp18            DOWN
swp19            DOWN
swp20            DOWN
swp21            DOWN
swp22            DOWN
swp23            UP             192.168.86.36/24 fe80::5200:ff:fe03:17/64
mgmt             UP             127.0.0.1/8 ::1/128
vni10            UNKNOWN
br0              UP             fe80::5200:ff:fe03:2/64

root@LEAF-1:mgmt:~# vtysh -c 'show ip route'
Codes: K - kernel route, C - connected, S - static, R - RIP,
       O - OSPF, I - IS-IS, B - BGP, E - EIGRP, N - NHRP,
       T - Table, v - VNC, V - VNC-Direct, A - Babel, D - SHARP,
       F - PBR, f - OpenFabric, Z - FRR,
       > - selected route, * - FIB route, q - queued, r - rejected, b - backup
       t - trapped, o - offload failure
O   10.0.0.0/31 [110/100] is directly connected, eth0, weight 1, 04:15:10
C>* 10.0.0.0/31 is directly connected, eth0, 04:15:12
O   10.0.0.2/31 [110/100] is directly connected, swp1, weight 1, 04:15:10
C>* 10.0.0.2/31 is directly connected, swp1, 04:15:12
O>* 10.0.0.4/31 [110/110] via 10.0.0.0, eth0, weight 1, 04:13:50
O>* 10.0.0.6/31 [110/110] via 10.0.0.2, swp1, weight 1, 04:13:40
O   10.255.1.21/32 [110/0] is directly connected, lo, weight 1, 04:15:10
C>* 10.255.1.21/32 is directly connected, lo, 04:15:12
O>* 10.255.1.22/32 [110/110] via 10.0.0.0, eth0, label 100003, weight 1, 04:13:36
  *                          via 10.0.0.2, swp1, label 100001, weight 1, 04:13:36
O>* 10.255.255.11/32 [110/110] via 10.0.0.0, eth0, label implicit-null, weight 1, 04:13:50
O>* 10.255.255.12/32 [110/110] via 10.0.0.2, swp1, label implicit-null, weight 1, 04:13:40
O   10.255.255.21/32 [110/0] is directly connected, lo, weight 1, 04:15:10
C>* 10.255.255.21/32 is directly connected, lo, 04:15:12
O>* 10.255.255.22/32 [110/110] via 10.0.0.0, eth0, label 100002, weight 1, 04:13:36
  *                            via 10.0.0.2, swp1, label 100000, weight 1, 04:13:36

root@LEAF-1:mgmt:~# vtysh -c 'show bgp l2vpn evpn summary'
BGP router identifier 10.255.255.21, local AS number 65000 vrf-id 0
BGP table version 0
RIB entries 3, using 600 bytes of memory
Peers 2, using 46 KiB of memory
Peer groups 1, using 64 bytes of memory

Neighbor        V         AS   MsgRcvd   MsgSent   TblVer  InQ OutQ  Up/Down State/PfxRcd   PfxSnt
10.255.255.11   4      65000      5956      5076        0    0    0 04:13:35            2        2
10.255.255.12   4      65000      5953      5076        0    0    0 04:13:34            2        2

Total number of neighbors 2

root@LEAF-1:mgmt:~# bridge link
4: swp2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master br0 state forwarding priority 8 cost 4
27: vni10: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master br0 state forwarding priority 8 cost 100
root@LEAF-1:mgmt:~# bridge vlan show
port	vlan ids
swp2	 10 PVID Egress Untagged

vni10	 10 PVID Egress Untagged

br0	 1 PVID Egress Untagged

root@LEAF-1:mgmt:~# bridge fdb show
50:00:00:05:00:00 dev swp2 vlan 10 master br0
50:00:00:03:00:02 dev swp2 master br0 permanent
50:00:00:06:00:00 dev vni10 vlan 10 extern_learn master br0
52:7f:7f:6c:df:6e dev vni10 master br0 permanent
00:00:00:00:00:00 dev vni10 dst 10.255.1.22 self permanent
50:00:00:06:00:00 dev vni10 dst 10.255.1.22 self extern_learn
50:00:00:03:00:02 dev br0 vlan 1 master br0 permanent

root@LEAF-1:mgmt:~# ip -d link show vni10
27: vni10: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br0 state UNKNOWN mode DEFAULT group default qlen 1000
    link/ether 52:7f:7f:6c:df:6e brd ff:ff:ff:ff:ff:ff promiscuity 1 minmtu 68 maxmtu 65535
    vxlan id 10010 local 10.255.1.21 srcport 0 0 dstport 4789 nolearning ttl 64 ageing 300 udpcsum noudp6zerocsumtx noudp6zerocsumrx
    bridge_slave state forwarding priority 8 cost 100 hairpin off guard off root_block off fastleave off learning off flood on port_id 0x8002 port_no 0x2 designated_port 32770 designated_cost 0 designated_bridge 8000.50:0:0:3:0:2 designated_root 8000.50:0:0:3:0:2 hold_timer    0.00 message_age_timer    0.00 forward_delay_timer    0.00 topology_change_ack 0 config_pending 0 proxy_arp off proxy_arp_wifi off mcast_router 1 mcast_fast_leave off mcast_flood on neigh_suppress on group_fwd_mask 0x0 group_fwd_mask_str 0x0 group_fwd_maskhi 0x0 group_fwd_maskhi_str 0x0 vlan_tunnel off isolated off addrgenmode eui64 numtxqueues 1 numrxqueues 1 gso_max_size 65536 gso_max_segs 65535

root@LEAF-1:mgmt:~# ping -c 3 10.255.1.22
vrf-wrapper.sh: switching to vrf "default"; use '--no-vrf-switch' to disable
PING 10.255.1.22 (10.255.1.22) 56(84) bytes of data.
64 bytes from 10.255.1.22: icmp_seq=1 ttl=63 time=6.06 ms
64 bytes from 10.255.1.22: icmp_seq=2 ttl=63 time=6.24 ms
64 bytes from 10.255.1.22: icmp_seq=3 ttl=63 time=4.86 ms

--- 10.255.1.22 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 5ms
rtt min/avg/max/mdev = 4.859/5.718/6.240/0.615 ms

root@LEAF-1:mgmt:~# ping -c 3 10.255.255.22
vrf-wrapper.sh: switching to vrf "default"; use '--no-vrf-switch' to disable
PING 10.255.255.22 (10.255.255.22) 56(84) bytes of data.
64 bytes from 10.255.255.22: icmp_seq=1 ttl=63 time=7.91 ms
64 bytes from 10.255.255.22: icmp_seq=2 ttl=63 time=6.60 ms
64 bytes from 10.255.255.22: icmp_seq=3 ttl=63 time=7.18 ms

--- 10.255.255.22 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 5ms
rtt min/avg/max/mdev = 6.600/7.228/7.908/0.535 ms
```
[Checks]:
```
Full Overlay Proof
If all of the following are true, the overlay is working:

✓ remote VTEP loopbacks are reachable
✓ EVPN neighbors are established
✓ vni10 is present and bound to the bridge domain
✓ host MAC/IP learning occurs across the VXLAN segment
✓ GPU-A and GPU-B can reach each other on 172.16.10.0/24
```
----------------------

# ============= VTEP Validation ============= 

Use this file to validate VTEP loopbacks and routed reachability to remote VTEPs.
```
LEAF-1
ip -br addr
vtysh -c 'show ip route'
ping -c 3 10.255.1.22
ping -c 3 10.255.255.22

Healthy:

✓ local VTEP loopback 10.255.1.21/32 exists on lo
✓ route exists to remote VTEP 10.255.1.22/32
✓ ping to remote VTEP succeeds
```

# ============= VXLAN Validation ==============

Use this file to validate VXLAN VNI state and bridge-domain attachment.
```
LEAF-1
bridge link
bridge vlan show
bridge fdb show
ip -d link show vni10

Healthy:

swp2 and vni10 are in br0
VLAN 10 is present
vni10 shows vxlan id 10010
vni10 local tunnel IP is 10.255.1.21
```
































