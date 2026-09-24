#!/bin/bash
set -e
sudo cp BL1_interfaces /etc/network/interfaces
sudo cp BL1_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
