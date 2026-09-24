#!/bin/sh
modprobe bonding
ip link add bond0 type bond mode 802.3ad miimon 100 lacp_rate fast xmit_hash_policy layer3+4
ip link set eth0 down
ip link set eth1 down
ip link set eth0 master bond0
ip link set eth1 master bond0
ip link set eth0 mtu 9000
ip link set eth1 mtu 9000
ip link set bond0 mtu 9000
ip addr flush dev eth0
ip addr flush dev eth1
ip addr add 172.16.120.50/24 dev bond0
ip -6 addr flush dev bond0
ip -6 addr add 2001:db8:120::50/64 dev bond0
ip link set eth0 up
ip link set eth1 up
ip link set bond0 up
ip route replace default via 172.16.120.1
ip -6 route replace default via 2001:db8:120::1
sysctl -w net.ipv4.tcp_ecn=1
sysctl -w net.ipv6.conf.all.disable_ipv6=0
echo "STORAGE ready"
