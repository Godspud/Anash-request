import { world, Player, Block, Dimension, Vector3, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { CreateFactory, Common } from "./common";
import { Energy } from "../api/Energy";

const StorageBlock = "minecraft:barrel";

class TreeCutter extends CreateFactory {
    constructor(block, dimension) {
        super(block, dimension);
        this.block = block;
        this.dimension = dimension;
        this.energy = new Energy(block, dimension);
         this.energy.setCapacity(1000000)
    }

    cutTree() {
        if (!this.energy.hasEnergy(50)) return;
        this.energy.burnEnergy(50);

        const face = this.block.permutation.getState("minecraft:cardinal_direction");
        let northBlock;
        const MAX_CUT_LOG = 50;

        switch (face) {
            case "north":
                northBlock = this.block.north(1);
                break;
            case "south":
                northBlock = this.block.south(1);
                break;
            case "west":
                northBlock = this.block.west(1);
                break;
            case "east":
                northBlock = this.block.east(1);
                break;
        }

        if (!northBlock || !northBlock.hasTag("log")) return this;

        let logBlock = northBlock;
        let allPos = [logBlock.location];
        let sensur = new Set();
        let destroyBlock = 0;

        while (allPos.length > 0 && destroyBlock <= MAX_CUT_LOG) {
            let loc = allPos.shift();
            let key = `${loc.x},${loc.y},${loc.z}`;
            if (sensur.has(key)) continue;
            sensur.add(key);

            let block = this.dimension.getBlock(loc);
            if (block && block.hasTag("log")) {
                let allLoc = [
                    block.above(1).location,
                    block.below(1).location,
                    block.north(1).location,
                    block.south(1).location,
                    block.west(1).location,
                    block.east(1).location
                ];

                for (let pos of allLoc) allPos.push(pos);

                destroyBlock++;
                this.dimension.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
            }
        }

        return this;
    }

    interact(player) {
        const energy = this.energy.getEnergy() ?? 0;
        const energyCap = this.energy.getCapacity() ?? 0;
        const blockName = Common.blockNameById(this.block.typeId);

        const form = new ActionFormData();
        form.title(blockName);
        form.body(`§7Energy: §e${energy}FE/${energyCap}FE\n§eInsert §8Coal §einto the §6Top Chest §eto start the §a${blockName}§e.\n§71 Coal §eruns it for §b1 Minute§e.\n§7Keep it fueled to keep it working!\n\n§aMax Timer: 60 seconds`);
        form.button("Back");
        form.show(player).then(res => {
            if (res.canceled) return;
            if (res.selection === 1) return;
        });
    }
}

system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent("um:tree_cutter", {
        onTick(ev) {
            const treeCutter = new TreeCutter(ev.block, ev.dimension);
            treeCutter.cutTree();
        },
        onPlayerInteract(ev) {
            const treeCutter = new TreeCutter(ev.block, ev.dimension);
            treeCutter.interact(ev.player);
        },
                onPlace: (e) => {
            Common.addEnergyAndFluid(e.block)


        }

    });
});