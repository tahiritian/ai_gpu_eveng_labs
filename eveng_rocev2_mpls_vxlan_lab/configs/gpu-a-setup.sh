ip addr flush dev ens3
ip addr add 172.16.10.11/24 dev ens3
ip link set ens3 up
modprobe rdma_rxe
modprobe ib_uverbs
modprobe rdma_ucm
rxe_cfg start
rxe_cfg add ens3
rdma link show
ibv_devices

