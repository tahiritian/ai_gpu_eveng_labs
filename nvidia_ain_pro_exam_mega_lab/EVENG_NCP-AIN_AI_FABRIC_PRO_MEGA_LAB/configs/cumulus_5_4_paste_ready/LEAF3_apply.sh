#!/bin/bash
set -e
sudo cp LEAF3_interfaces /etc/network/interfaces
sudo cp LEAF3_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
