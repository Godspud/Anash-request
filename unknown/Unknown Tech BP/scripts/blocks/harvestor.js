import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { world, system } from "@minecraft/server";
import { CreateFactory, Common } from "./common";
import { Energy } from "../api/Energy";

class Harvestor extends CreateFactory {
    constructor(block, player, dimension) {
        super(block, dimension);
        this.block = block;
        this.player = player;
        this.dimension = dimension;
        this.energy = new Energy(block, dimension);
        this.energy.setCapacity(1000000)
    }

    getBlockKey() {
        return `${this.block.location.x},${this.block.location.y},${this.block.location.z}`;
    }

    openMenu() {
        if (!this.player) return;
        const energy = this.energy.getEnergy();
        const energyLeft = `${energy}s`;

        const form = new ActionFormData()
            .title("§6Harvestor System")
            .body(
                `§7Timer: §e${energyLeft}\n§eInsert §8Coal §einto the §6Top Chest §eto start the §aHarvester§e.\n§71 Coal §eruns it for §b1 Minute§e.\n§7Keep it fueled to keep it working!\n\n§aMax Timer: 60 seconds`
            )
            .button("§aSettings\n§7Configure Area", "textures/ui/gear");

        form.show(this.player).then(res => {
            if (res.canceled) return;
            if (res.selection === 0) {
                this.openConfigMenu();
            }
        });
    }

    openConfigMenu() {
        if (!this.player) return;

        const blockP = this.block.permutation;
        const blockArea = blockP.getState("um:area");
        const dropdown = ["2x2", "4x4", "6x6", "8x8"];
        const defaultAreaStateIndex = blockArea ? dropdown.indexOf(blockArea) : 0;

        const form = new ModalFormData()
            .title("§6Harvestor Settings")
            .dropdown("§eSelect Area Size", dropdown, { defaultValueIndex: defaultAreaStateIndex });

        form.show(this.player).then(res => {
            if (res.canceled) return;
            const selectedIndex = res.formValues?.[0];
            const selectedArea = dropdown[selectedIndex];
            const newPermutation = blockP.withState("um:area", selectedArea);
            this.block.setPermutation(newPermutation);
            this.player.sendMessage(`§aArea set to: ${selectedArea}`);
        });
    }

    tryConsumeCoal() {
        if (!this.player) return false;
        const inv = this.player.getComponent("inventory");
        if (!inv?.container) return false;

        for (let i = 0; i < inv.container.size; i++) {
            const item = inv.container.getItem(i);
            if (item && item.typeId === "minecraft:coal") {
                if (item.amount > 1) {
                    item.amount--;
                    inv.container.setItem(i, item);
                } else {
                    inv.container.setItem(i, undefined);
                }
                this.player.sendMessage("§a+60s added! Coal consumed.");
                return true;
            }
        }
        return false;
    }

    tick() {



        const energy = this.energy.getEnergy();
   
        if (!this.energy.hasEnergy(100)) return;

        const block = this.block;
        const getArea = block.permutation.getState("um:area");
        if (!getArea) return;

                this.energy.burnEnergy(100)


        switch (getArea) {
            case "2x2":
                this.breakCrops(2);
                break;
            case "4x4":
                this.breakCrops(4);
                break;
            case "6x6":
                this.breakCrops(6);
                break;
            case "8x8":
                this.breakCrops(8);
                break;
        }
    }

    breakCrops(area) {
        const block = this.block;
        const halfArea = Math.floor(area / 2);

        for (let x = -halfArea; x <= halfArea; x++) {
            for (let z = -halfArea; z <= halfArea; z++) {
                const targetBlock = this.dimension.getBlock({
                    x: block.location.x + x,
                    y: block.location.y,
                    z: block.location.z + z
                });

                if (!targetBlock) continue;

                const growthState = targetBlock.permutation.getState("growth");
                const ageState = targetBlock.permutation.getState("age");

                if (growthState !== undefined && growthState >= 1 && growthState <= 15) {
                    if (growthState === 7 || growthState === 15) {
                        this.harvestAndReplant(targetBlock, "growth", 0);
                    }
                    continue;
                }

                if (ageState !== undefined && ageState >= 1 && ageState <= 15) {
                    if (ageState >= 3) {
                        this.harvestAndReplant(targetBlock, "age", 0);
                    }
                    continue;
                }
            }
        }
    }

    harvestAndReplant(targetBlock, stateType, resetValue) {
        try {
            const location = targetBlock.location;
            const blockTypeId = targetBlock.typeId;

            this.dimension.runCommand(
                `loot spawn ${location.x} ${location.y} ${location.z} mine ${location.x} ${location.y} ${location.z}`
            );

            const newPermutation = targetBlock.permutation.withState(stateType, resetValue);
            targetBlock.setPermutation(newPermutation);
        } catch (error) {
            const location = targetBlock.location;
            const blockTypeId = targetBlock.typeId;

            this.dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
            this.dimension.runCommand(
                `setblock ${location.x} ${location.y} ${location.z} ${blockTypeId} [${stateType}=${resetValue}]`
            );
        }
    }
    
      getEnergyToTop() {
        let topBlock = this.block.above(1)
        let energy = new Energy(topBlock, this.dimension)
                if (!energy.hasEnergy(50)) return;

        energy.burnEnergy(50)
        this.energy.addEnergy(50)
    }

}

system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent("um:harvestor", {
        onPlayerInteract: e => {
            const { block, player, dimension } = e;
            const harvestor = new Harvestor(block, player, dimension);


            harvestor.openMenu();
        },
        onTick: e => {
            const { block, dimension } = e;
        let harvestor =  new Harvestor(block, undefined, dimension)
        harvestor.getEnergyToTop()
        
            if (system.currentTick%20 === 0) {
                //harvestor.tick()
            }

        
        },
        onPlace: e => {
            Common.addEnergyAndFluid(e.block);
        }
    });
});