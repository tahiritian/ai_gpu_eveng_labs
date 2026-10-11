# EVE-NG Flat ShuffleBox / Spraypoint Concept Lab

This folder contains an EVE-NG lab that simulates the cabling and routing ideas from a flat randomized data center fabric:

- ShuffleBox concept: represented as a fixed cabling matrix of point-to-point links.
- Flat fabric: 8 Arista routers in a 4-degree quasi-random graph.
- Spraypoint concept: approximated with BGP ECMP, `maximum-paths`, and `multipath-relax`.
- Validation: ping, traceroute, BGP path inspection, ECMP inspection, iperf traffic, and link-failure testing.

Files:

- `Flat_ShuffleBox_Spraypoint_Arista.unl` - EVE-NG topology file.
- `configs/` - startup configs for R1-R8.
- `host_configs/` - Linux host IP setup commands.
- `docs/LAB_GUIDE.md` - full build, config, validation, and failure testing guide.
- `docs/SHUFFLEBOX_CABLING_MATRIX.csv` - logical cabling matrix.

Import notes:

1. Import or copy `Flat_ShuffleBox_Spraypoint_Arista.unl` into EVE-NG.
2. The topology uses the common Arista template name `veos`.
3. If your EVE-NG uses `vEOS`, `veos-lab`, `ceos`, or another template name, edit the `.unl` node template field before import.
4. Paste configs from `configs/` into each Arista node.
5. Configure Linux hosts using the commands in `host_configs/`.

This lab is an approximation. It does not emulate AWS proprietary Spraypoint or a real passive optical ShuffleBox. It gives you the hands-on network behavior: randomized cabling, flat graph routing, multipath forwarding, and failure-domain validation.
