import { world, Block, Dimension, Vector3, system } from "@minecraft/server";
import { Energy, EnergyBlocks } from "./Energy.js";

export class Manager {
    constructor(block, dimension, isOutput = false) {
        this.block = block;
        this.dimension = dimension;
        this.output = isOutput 
        this.energy = new Energy(block, dimension, this.output);
    }

    produce(power) {
        const produced = power;
        this.energy.addEnergy(produced);
    }

    export(power) {
        const available = this.energy.getEnergy();
        if (available <= 0) return;

        const exportAmount = Math.min(available, power);
        if (exportAmount > 0) {
            this.exportThroughNetwork(exportAmount);
        }
    }

    exportThroughNetwork(flowAmount) {
        if (flowAmount <= 0) return;

        const startLoc = this.getOutputLoc();
        const allLoc = [startLoc.location];
        const allEnergyBlock = [];
        const keyLoc = new Set();

        while (allLoc.length > 0) {
            const loc = allLoc.shift();
            const key = `${loc.x},${loc.y},${loc.z}`;
            if (keyLoc.has(key)) continue;
            keyLoc.add(key);

            const block = this.dimension.getBlock(loc);
            if (!block) continue;

            if (block.typeId === "um:energy_cable") {
                const offSet = [
                    { pos: block.north(1).location, face: "um:f_north" },
                    { pos: block.south(1).location, face: "um:f_south" },
                    { pos: block.east(1).location, face: "um:f_east" },
                    { pos: block.west(1).location, face: "um:f_west" },
                    { pos: block.above(1).location, face: "um:f_top" },
                    { pos: block.below(1).location, face: "um:f_bottom" },
                ];

                for (const { pos, face } of offSet) {
                    const blockState = block.permutation.getState(face);
                    if (blockState === true) {
                        allLoc.push(pos);
                    }
                }
                continue;
            } else if (EnergyBlocks.includes(block.typeId)) {
                if(this.block.typeId === block.typeId) continue;
                allEnergyBlock.push(block.location);
                continue;
            }
        }

        if (allEnergyBlock.length > 0) {
            const splitPower = Math.ceil(flowAmount / allEnergyBlock.length);
            
            
            
            for (const loc of allEnergyBlock) {
                const block = this.dimension.getBlock(loc);
                if (!block) continue;
                const energy = new Energy(block, block.dimension);
                if(block.typeId !== "minecraft:air" && this.block.typeId !== "minecraft:air"){
                energy.addEnergy(splitPower);
                
             // console.log(`${splitPower}` + "->addEnergy")
                 this.energy.burnEnergy(splitPower);
               //  console.log(`${splitPower}` + "<-burnEnergy")
                 continue 
                }
                
             }
            return
        }
        return
      }

    getOutputLoc() {
        const face = this.block.permutation.getState("minecraft:cardinal_direction");
        switch (face) {
            case "north": return this.block.offset({ x: 0, y: 0, z: 1 });
            case "south": return this.block.offset({ x: 0, y: 0, z: -1 });
            case "east": return this.block.offset({ x: -1, y: 0, z: 0 });
            case "west": return this.block.offset({ x: 1, y: 0, z: 0 });
            default: return this.block.offset({ x: 1, y: 0, z: 0 });
        }
    }
}
