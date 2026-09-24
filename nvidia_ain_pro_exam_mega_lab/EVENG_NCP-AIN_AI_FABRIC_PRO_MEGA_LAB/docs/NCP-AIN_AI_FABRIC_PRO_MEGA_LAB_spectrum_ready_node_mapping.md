# NCP-AIN AI Fabric Pro Mega Lab: Spectrum-Ready Node Mapping

This sheet tells you exactly which EVE-NG nodes to keep as Arista EOS and which ones to swap to NVIDIA Spectrum-class nodes.

## Recommended deployment profile

Use a mixed-vendor lab:

- keep `RR1`, `RR2`, `SPINE1`, `SPINE2`, `PE1`, `PE2`, `REMOTE-DC` on `Arista EOS`
- swap `LEAF1`, `LEAF2`, `LEAF3`, `LEAF4`, `BL1`, `BL2` to `NVIDIA Spectrum`
- keep `GPU-A`, `GPU-B`, `GPU-C`, `STORAGE`, `COLLECTOR` as `Ubuntu VMs`

This gives you the most useful NCP-AIN practice split:

- NVIDIA-style AI fabric at the leaf and border layer
- stable EOS control-plane nodes for route-reflection, spine underlay, and external edge emulation

## Exact node-by-node mapping

| EVE-NG node | Current lab role | Keep or swap | What it should run | Why |
|---|---|---|---|---|
| `RR1` | EVPN route reflector | Keep | `Arista EOS` | simple RR role, no Spectrum-specific value here |
| `RR2` | EVPN route reflector | Keep | `Arista EOS` | same as RR1 |
| `SPINE1` | underlay spine | Keep | `Arista EOS` | stable spine emulation, simpler for EVE-NG |
| `SPINE2` | underlay spine | Keep | `Arista EOS` | same as SPINE1 |
| `LEAF1` | POD1 MLAG leaf | Swap | `NVIDIA Spectrum` | AI host-facing leaf, VLAN110 and VLAN210 |
| `LEAF2` | POD1 MLAG leaf | Swap | `NVIDIA Spectrum` | paired with LEAF1 for MLAG / anycast gateway |
| `LEAF3` | POD2 MLAG leaf | Swap | `NVIDIA Spectrum` | AI host-facing leaf, VLAN110 and VLAN120 |
| `LEAF4` | POD2 MLAG leaf | Swap | `NVIDIA Spectrum` | paired with LEAF3 for MLAG / anycast gateway |
| `BL1` | border leaf | Swap | `NVIDIA Spectrum` | services VLAN130, collector access, eBGP handoff |
| `BL2` | border leaf | Swap | `NVIDIA Spectrum` | paired with BL1 for MLAG border role |
| `PE1` | external provider edge | Keep | `Arista EOS` | external edge simulation only |
| `PE2` | external provider edge | Keep | `Arista EOS` | external edge simulation only |
| `REMOTE-DC` | remote DC/service edge | Keep | `Arista EOS` | remote route origin / edge emulation |
| `GPU-A` | AI worker host | Keep | `Ubuntu VM` | dual-homed host |
| `GPU-B` | AI worker host | Keep | `Ubuntu VM` | dual-homed host |
| `GPU-C` | AI worker host | Keep | `Ubuntu VM` | dual-homed host |
| `STORAGE` | storage host | Keep | `Ubuntu VM` | dual-homed storage endpoint |
| `COLLECTOR` | ops/service host | Keep | `Ubuntu VM` | services endpoint on VLAN130 |

## What "NVIDIA Spectrum" means in this lab

For the swapped nodes, use whichever NVIDIA image you already have working in EVE-NG for Ethernet switching, such as:

- `Cumulus VX` if that is your available Spectrum-style lab image
- `SONiC on NVIDIA` if that is what you have functioning in EVE-NG
- another `NVIDIA Ethernet switch VM` image you already use successfully

The important part is not the exact product branding inside EVE-NG. The important part is that these six nodes represent the NVIDIA Ethernet fabric roles:

- `LEAF1-4`
- `BL1-2`

## Port role mapping for the Spectrum nodes

### `LEAF1`
- uplinks: `Ethernet1` to `SPINE1`, `Ethernet2` to `SPINE2`
- peer-link: `Ethernet10-11` to `LEAF2`
- host links: `Ethernet20` to `GPU-A`, `Ethernet21` to `GPU-C`
- tenant roles: `VLAN110`, `VLAN210`

### `LEAF2`
- uplinks: `Ethernet1` to `SPINE1`, `Ethernet2` to `SPINE2`
- peer-link: `Ethernet10-11` to `LEAF1`
- host links: `Ethernet20` to `GPU-A`, `Ethernet21` to `GPU-C`
- tenant roles: `VLAN110`, `VLAN210`

### `LEAF3`
- uplinks: `Ethernet1` to `SPINE1`, `Ethernet2` to `SPINE2`
- peer-link: `Ethernet10-11` to `LEAF4`
- host links: `Ethernet20` to `GPU-B`, `Ethernet21` to `STORAGE`
- tenant roles: `VLAN110`, `VLAN120`

### `LEAF4`
- uplinks: `Ethernet1` to `SPINE1`, `Ethernet2` to `SPINE2`
- peer-link: `Ethernet10-11` to `LEAF3`
- host links: `Ethernet20` to `GPU-B`, `Ethernet21` to `STORAGE`
- tenant roles: `VLAN110`, `VLAN120`

### `BL1`
- uplinks: `Ethernet1` to `SPINE1`, `Ethernet2` to `SPINE2`
- peer-link: `Ethernet10-11` to `BL2`
- service host: `Ethernet20` to `COLLECTOR`
- external edge: `Ethernet30` to `PE1`
- services role: `VLAN130`

### `BL2`
- uplinks: `Ethernet1` to `SPINE1`, `Ethernet2` to `SPINE2`
- peer-link: `Ethernet10-11` to `BL1`
- service host: `Ethernet20` to `COLLECTOR`
- external edge: `Ethernet30` to `PE2`
- services role: `VLAN130`

## Practical EVE-NG swap plan

For each of these nodes:

- `LEAF1`
- `LEAF2`
- `LEAF3`
- `LEAF4`
- `BL1`
- `BL2`

edit the node in EVE-NG and change it from the current `veos-lab` style node to your working `NVIDIA Spectrum` image/template.

Keep these unchanged:

- `RR1`, `RR2`
- `SPINE1`, `SPINE2`
- `PE1`, `PE2`
- `REMOTE-DC`
- all Ubuntu VMs

## Config conversion expectation

The full configs in this package are EOS-oriented reference configs:

- `configs/full_configs/LEAF1.cfg`
- `configs/full_configs/LEAF2.cfg`
- `configs/full_configs/LEAF3.cfg`
- `configs/full_configs/LEAF4.cfg`
- `configs/full_configs/BL1.cfg`
- `configs/full_configs/BL2.cfg`

When you swap those six nodes to NVIDIA, port these features to the NVIDIA CLI you are using:

- MLAG or equivalent multi-chassis LAG
- VLANs and SVIs
- anycast gateway
- EVPN/VXLAN
- jumbo MTU
- QoS / RoCE policy constructs
- eBGP on `BL1` and `BL2`

## Best realistic profile for your lab

Because you said you already have `Spectrum` and `Arista` running in EVE-NG, the best final layout is:

- `Spectrum`: `LEAF1-4`, `BL1-2`
- `Arista`: `RR1`, `RR2`, `SPINE1`, `SPINE2`, `PE1`, `PE2`, `REMOTE-DC`
- `Ubuntu`: `GPU-A`, `GPU-B`, `GPU-C`, `STORAGE`, `COLLECTOR`

That is the node mapping I recommend you use.
