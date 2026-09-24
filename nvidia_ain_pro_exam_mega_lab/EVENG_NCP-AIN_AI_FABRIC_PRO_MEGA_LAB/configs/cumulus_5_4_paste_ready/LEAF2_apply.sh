#!/bin/bash
set -e
sudo cp LEAF2_interfaces /etc/network/interfaces
sudo cp LEAF2_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
