#!/bin/bash
set -e
sudo cp BL2_interfaces /etc/network/interfaces
sudo cp BL2_frr.conf /etc/frr/frr.conf
sudo ifreload -a
sudo systemctl restart frr
