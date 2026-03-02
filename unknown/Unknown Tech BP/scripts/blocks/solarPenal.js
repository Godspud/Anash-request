import { system } from "@minecraft/server";
import { Energy, EnergyBlocks } from "../api/Energy";
import { Manager } from "../api/Manager";
import { Common } from "./common";



  /*class SolarPenal {
    constructor(block, dimenson) {
        this.block = block;
        this.dimenson = dimenson;
    }

    exportPower(power) {
        const startLoc = this.getOutputLoc();
        const allLoc = [startLoc];
        const keyLoc = new Set();

        while (allLoc.length > 0) {
            const loc = allLoc.shift();
            const key = `${loc.x},${loc.y},${loc.z}`;
            if (keyLoc.has(key)) continue;
            keyLoc.add(key);

            const block = this.dimenson.getBlock(loc);
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
                const energy = new Energy(block, block.dimension);
                energy.addEnergy(power);
            }
        }
    }

    getOutputLoc() {
        const face = this.block.permutation.getState("minecraft:cardinal_direction");
        switch (face) {
            case "north":
                return this.block.south(1).location;
            case "south":
                return this.block.north(1).location;
            case "east":
                return this.block.west(1).location;
            case "west":
                return this.block.east(1).location;
        }
    }
}*/

system.beforeEvents.startup.subscribe(event => {
    event.blockComponentRegistry.registerCustomComponent("um:generator", {
        onTick: (event) => {
            const { block, dimension } = event;
        let manager = new Manager(block, dimension, true)
        if (system.currentTick%10 === 0) {
        manager.export(100)
        }
        manager.produce(1)
        },
        onPlayerInteract: (event) => {
            const { player, block, dimension, face, faceLocation } = event;
        }
    });
});

