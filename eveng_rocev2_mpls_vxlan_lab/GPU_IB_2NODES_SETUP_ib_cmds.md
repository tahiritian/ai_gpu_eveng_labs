# ========TASK: 2 Node Infiniband Connectiovity============
  
 Topology: `ubuntu nodeA_HCA <Cable> HCA_nodeB`

# Ubuntu GPU: with ConnectX

$ lspci | grep mellanox -i   / list Mellanox Card

# Mellanox Modules
$ lsmod | grep mlx    
$ ib_uverbs
$ ib_core
$ mlx4_ib
$ mlx4_core

# Device Info (HCA)
$ ibv_devinfo  /  HCA -> Checks: transport, fw_ver, vendor_id, port counts with port status (up/down) etc
                  -Check: `port_lid` called link identifier
                  port_lid = 0  / Mean Subnet Manager (SM) is `NOT ACTIVE` for this NIC card.
          Note: Communication happens using port_lid values in these setup. (ie, IP add on NIC in Ethernet)
          The HCA ports on node stay in `INIT` state after physical connections done (nodeA_hca_port <> nodeB_hca_port) and to make these ports `Active` working, need SM software installed.

# Subnet Manager (Either Open source OSM, or proprietry ie, nvidia SM)            
  - SM runs 'inside the fabric' ie, on switch itself. But you can install on node/server as well (ie, OSM if no switch), SM can also run on dedicated server hardware (ie, for Prod setups).

# Install OpenSM on node
$ opensm --help   / check if openSM installed
$ sudo apt install opensm / installation
$ sudo apt install rdma-core ibverbs-utils infiniband-diags  / other dependancies
$ sudo modprobe ib_umad 

  - Start Opensm: $ sudo systemctl start opensm    / HCP Port on nodes should show `Active` now.
                                                     - sm_lid = 1  as well.
===========================================================================================

# ibstat  / check IB details
            $ sudo apt install infiniband-diags  / package installation
  Adapter- port details, status, Channel Adapter CA (`ibp1s0`) details, lid values

# GUID: Global ID ie, MAC address, 64-bit & Global, none-routable
# LID:  16-bit address assigned to each ib port,  unique withing single SM. Used for packet forwarding

# IB Utilities:
`ibping`                 / Connectivity Checks
`ibnetdiscover`          / Topology Discovery

`iblinkinfo`  / show link-level connections
`ibtracert`   / Trace path between nodes, identify hops & switches
                Uses LID: $ ibtracert <source> <destination>  / $ ibtracert 1 2 
`ibhosts`    /   List IB nodes (only hosts)
`ibswitches` /   List all IB SWitches
`ibnodes`    /   List all nodes, Full Fabric View (nodes, switches)

`ibv_devinfo` Detailed HCA capabilities / Hardware validations









