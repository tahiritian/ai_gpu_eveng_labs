===============================================================================
                     COMMON CUMULUS LINUX CLI PROMPTS
===============================================================================

+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| Prompt                     | Environment        | Primary Use             | Switch To                 | Exit To                   |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| cumulus@LEAF-1:~$          | Linux (user)       | Basic Linux commands    | sudo -i                   | logout / exit             |
|                            |                    | ls, ip, ping            |                           |                           |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| root@LEAF-1:mgmt:~#        | Linux (root)       | Linux administration    | vtysh                     | exit (to user shell)      |
|                            |                    | vim, systemctl, tcpdump |                           |                           |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| LEAF-1#                    | FRR (Exec Mode)    | Show commands           | configure terminal        | exit (to Linux shell)     |
|                            |                    | show bgp, show route    |                           |                           |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| LEAF-1(config)#            | FRR Global Config  | Global routing config   | router bgp, interface     | end / Ctrl+Z / exit       |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| LEAF-1(config-router)#     | BGP Config         | Configure BGP           | address-family            | exit                      |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| LEAF-1(config-router-af)#  | BGP Address Family | EVPN / IPv4 / IPv6 AF   | N/A                       | exit                      |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+
| LEAF-1(config-if)#         | Interface Config   | Configure interfaces    | N/A                       | exit                      |
+----------------------------+--------------------+-------------------------+---------------------------+---------------------------+

===============================================================================
                    HOW TO MOVE BETWEEN PROMPTS
===============================================================================

Login
  │
  ▼
cumulus@LEAF-1:~$
      │
      │ sudo -i
      ▼
root@LEAF-1:mgmt:~#
      │
      │ vtysh
      ▼
LEAF-1#
      │
      │ configure terminal
      ▼
LEAF-1(config)#
      │
      ├── router bgp 65101
      │       ▼
      │   LEAF-1(config-router)#
      │         │
      │         └── address-family l2vpn evpn
      │                  ▼
      │           LEAF-1(config-router-af)#
      │
      └── interface swp1
               ▼
         LEAF-1(config-if)#

===============================================================================
                       COMMON COMMANDS
===============================================================================

Linux User
-----------
sudo -i
exit

Linux Root
----------
vtysh
systemctl status frr
ip addr
ip route
journalctl
vim /etc/frr/frr.conf
ifreload -a

FRR Exec
--------
show running-config
show bgp summary
show ip route
show evpn vni
configure terminal
write memory
exit

FRR Config
----------
router bgp <ASN>
interface swp1
address-family l2vpn evpn
end
Ctrl+Z
exit

===============================================================================
                        SAVE CONFIGURATION
===============================================================================

Traditional Cumulus:
  write memory
        or
  copy running-config startup-config

NVUE (Cumulus 5.x+):
  nv config apply
  nv config save
===============================================================================