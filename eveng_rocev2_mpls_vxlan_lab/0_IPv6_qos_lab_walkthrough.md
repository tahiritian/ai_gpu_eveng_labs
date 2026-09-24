
#  IPv6 Overlay & Qos
Note: Make sure Fabric is configured, Up & validated.
-----------
# IPv6 GPU 

- GPU-A
ip -6 addr add 2001:db8:10::11/64 dev ens3
ip -6 addr show dev ens3

- GPU-B
ip -6 addr add 2001:db8:10::12/64 dev ens3
ip -6 addr show dev ens3

[root@GPU-A ~]# ping6 -c 3 2001:db8:10::12
PING 2001:db8:10::12(2001:db8:10::12) 56 data bytes
64 bytes from 2001:db8:10::12: icmp_seq=1 ttl=64 time=15.6 ms

[root@GPU-A ~]# ip -6 neigh
2001:db8:10::12 dev ens3 lladdr 50:00:00:06:00:00 REACHABLE

[root@GPU-B ~]# ip -6 neigh
2001:db8:10::11 dev ens3 lladdr 50:00:00:05:00:00 REACHABLE


## What This Proves
  - Because the overlay is L2 extension, IPv6 rides across the same bridge/VXLAN domain without needing new IPv6
routing on the fabric.
  • the overlay is protocol-agnostic at L2
  • the VNI is carrying both IPv4 and IPv6 host traffic
------------------

# DSCP / QoS Marking Practice

Create distinct classes of host-generated traffic:
• RoCE-like traffic: DSCP 26
• control-like traffic: DSCP 48
• best effort traffic: DSCP 0
### 8.2 Fast Method Using `ping`
On Linux, `ping -Q` can set the IPv4 TOS byte.
Useful values:
• DSCP 26 shifted into TOS: `0x68`
• DSCP 48 shifted into TOS: `0xc0`
• DSCP 0: `0x00`
### 8.3 Validate Best-Effort
On `GPU-B`, observe:

[root@GPU-A ~]# ping -Q 0x00 -c 3 172.16.10.12
PING 172.16.10.12 (172.16.10.12) 56(84) bytes of data.
64 bytes from 172.16.10.12: icmp_seq=1 ttl=64 time=7.41 ms
64 bytes from 172.16.10.12: icmp_seq=2 ttl=64 time=6.74 ms

[root@GPU-B ~]# tcpdump -ni ens3 -vv icmp
dropped privs to tcpdump
tcpdump: listening on ens3, link-type EN10MB (Ethernet), capture size 262144 bytes
16:13:26.139047 IP (tos 0x0, ttl 64, id 4197, offset 0, flags [DF], proto ICMP (1), length 84)
    172.16.10.11 > 172.16.10.12: ICMP echo request, id 10656, seq 1, length 64
16:13:26.139185 IP (tos 0x0, ttl 64, id 22169, offset 0, flags [none], proto ICMP (1), length 84)
    172.16.10.12 > 172.16.10.11: ICMP echo reply, id 10656, seq 1, length 64

• [packets arrive with default TOS / DSCP behavior]

- Validate RoCE-Like DSCP 26
On `GPU-B`, keep `tcpdump` running, then on `GPU-A`:
ping -Q 0x68 -c 3 172.16.10.12

[root@GPU-B ~]# tcpdump -ni ens3 -vv icmp
dropped privs to tcpdump
tcpdump: listening on ens3, link-type EN10MB (Ethernet), capture size 262144 bytes
16:16:26.824460 IP (tos 0x68, ttl 64, id 25181, offset 0, flags [DF], proto ICMP (1), length 84)
    172.16.10.11 > 172.16.10.12: ICMP echo request, id 10682, seq 1, length 64
16:16:26.824578 IP (tos 0x68, ttl 64, id 23023, offset 0, flags [none], proto ICMP (1), length 84)
    172.16.10.12 > 172.16.10.11: ICMP echo reply, id 10682, seq 1, length 64

• [packet capture shows TOS corresponding to DSCP 26]

- Validate Control-Like DSCP 48
On `GPU-A`:
ping -Q 0xc0 -c 3 172.16.10.12
[root@GPU-B ~]# tcpdump -ni ens3 -vv icmp
dropped privs to tcpdump
tcpdump: listening on ens3, link-type EN10MB (Ethernet), capture size 262144 bytes
16:19:48.900781 IP (tos 0xc0, ttl 64, id 12075, offset 0, flags [DF], proto ICMP (1), length 84)
    172.16.10.11 > 172.16.10.12: ICMP echo request, id 10716, seq 1, length 64
16:19:48.900951 IP (tos 0xc0, ttl 64, id 39324, offset 0, flags [none], proto ICMP (1), length 84)
    172.16.10.12 > 172.16.10.11: ICMP echo reply, id 10716, seq 1, length 64


-- next follow the LAB workbook for QoS.
















