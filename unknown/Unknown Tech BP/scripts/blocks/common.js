import { world, system, Block, Dimension, Player } from "@minecraft/server";
import { Energy } from "../api/Energy";
import { Fluid } from "../api/Fluid";

const EntityId = "um:energyfluid";
const actionBarData = [];

export class CreateFactory {
    constructor(block, dimension) {
        this.block = block;
        this.dimension = dimension;
        this.key = `${block.x},${block.y},${block.z}`;
    }

    hasSize() {
        const state = this.block.permutation.getState("um:size");
        return !!state;
    }

    getSize() {
        const state = this.block.permutation.getState("um:size");
        return state || "";
    }
}

export class Common {
    constructor() {}

    blockActionBar(e) {
        const ayy = {
            blockId: e.blockId,
            blockData: {
                blockArea: e.blockData.blockArea,
                blockName: e.blockData.blockName,
                blockTime: e.blockData.blockTime
            }
        };
        actionBarData.push(ayy);
        return this;
    }

    actionBarContent(block, player, e) {
        const blockName = Common.blockNameById(block.typeId);
        const blockArea = block.permutation.getState("um:area");
        const key = `${block.x},${block.y},${block.z}`;
      try{
        const blockEnergy = new Energy(block, block.dimension).getEnergy() ?? 0;
        const energyCap = new Energy(block, block.dimension).getCapacity() ?? 0;

        const bn = e.blockName ? `§6§lBlock: §f${blockName}\n` : "";
        const ba = e.blockArea ? `§3§lBlockArea: §b${blockArea}\n` : "";
        const bt = e.blockTime ? `§e§lEnergy: §a${blockEnergy}FE/${energyCap}FE\n` : "";

        player.onScreenDisplay.setActionBar(`${bn}${ba}${bt}`);
        } catch(e){
        
        }
    }

    static blockNameById(input) {
        let namePart = input.split(":").pop();
        namePart = namePart.replace(/_/g, " ");
        namePart = namePart
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        return namePart;
    }

    static getStateById(block, id) {
        return block.permutation.getState(id);
    }

    static setState(block, id, value) {
        const permutation = block.permutation;
        const newPermutation = permutation.withState(id, value);
        block.setPermutation(newPermutation);
        return true;
    }

    static getKeyByBlock(block) {
        return `${block.x},${block.y},${block.z}`;
    }

    static addEnergyAndFluid(block) {
        block.dimension.spawnEntity(EntityId, { x: block.x + 0.5, y: block.y, z: block.z + 0.5 });
    }
}

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (player) {
            const allData = actionBarData;
            if (allData.length > 0) {
                for (const data of allData) {
                    const view = player.getBlockFromViewDirection({
                        includeTypes: [data.blockId],
                        maxDistance: 15
                    });
                    const block = view ? view.block : undefined;
                    if (block) {
                        new Common().actionBarContent(block, player, {
                            blockArea: data.blockData.blockArea,
                            blockName: data.blockData.blockName,
                            blockTime: data.blockData.blockTime
                        });
                    }
                }
            }
        }
    }
});

world.afterEvents.worldLoad.subscribe(() => {
    system.runTimeout(() => {
        new Common()
            .blockActionBar({
                blockId: "um:tree_cutter",
                blockData: { blockArea: false, blockName: true, blockTime: true }
            })
            .blockActionBar({
                blockId: "um:harvestor",
                blockData: { blockArea: true, blockName: true, blockTime: true }
            })
                        .blockActionBar({
                blockId: "um:solar_panel",
                blockData: { blockArea: false, blockName: true, blockTime: true }
            })
            .blockActionBar({
                blockId: "um:alloy_smelter",
                blockData: { blockArea: false, blockName: true, blockTime: true }
            });
    }, 20);
});