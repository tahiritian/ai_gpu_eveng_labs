#!/bin/sh
iperf3 -c 172.16.110.12 -t 30 -P 8 -S 0x68 &
iperf3 -c 172.16.120.50 -t 30 -P 4 -S 0x68 &
wait
