#!/bin/bash
set -e
sudo cp LEAF4_interfaces /etc/network/interfaces
sudo cp LEAF4_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
