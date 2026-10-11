ip addr flush dev eth0
ip addr add 10.8.8.10/24 dev eth0
ip link set eth0 up
ip route replace default via 10.8.8.1
