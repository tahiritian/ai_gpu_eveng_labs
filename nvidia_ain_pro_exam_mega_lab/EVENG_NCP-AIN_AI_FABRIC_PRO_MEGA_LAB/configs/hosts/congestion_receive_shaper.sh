#!/bin/sh
tc qdisc del dev bond0 root 2>/dev/null
tc qdisc add dev bond0 root handle 1: htb default 20
tc class add dev bond0 parent 1: classid 1:1 htb rate 10gbit
tc class add dev bond0 parent 1:1 classid 1:10 htb rate 2gbit ceil 2gbit
tc class add dev bond0 parent 1:1 classid 1:20 htb rate 10gbit ceil 10gbit
tc filter add dev bond0 protocol ip parent 1:0 prio 1 u32 match ip dsfield 0x68 0xfc flowid 1:10
