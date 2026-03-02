import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { world, system } from "@minecraft/server";
// Timer data store karne ke liye
export const harvestorTimers = new Map();
class Harvestor {
    block;
    player;
    dimension;
    constructor(block, player, dimension) {
        this.block = block;
        this.player = player;
        this.dimension = dimension;
    }
    getBlockKey() {
        return `${this.block.x},${this.block.y},${this.block.z}`;
    }
    getTimer() {
        return harvestorTimers.get(this.getBlockKey()) || 0;
    }
    setTimer(value) {
        harvestorTimers.set(this.getBlockKey(), Math.max(0, Math.min(60, value)));
    }
    openMenu() {
        if (!this.player)
            return;
        const timer = this.getTimer();
        const timeLeft = `${timer}s`;
        const form = new ActionFormData()
            .title("§6Harvestor System")
            .body(`§7Timer: §e${timeLeft}\n§eInsert §8Coal §einto the §6Top Chest §eto start the §aHarvester§e.\n
§71 Coal §eruns it for §b1 Minute§e.\n
§7Keep it fueled to keep it working!\n\n§aMax Timer: 60 seconds`)
            .button("§aSettings\n§7Configure Area", "textures/ui/gear")
            .show(this.player).then(res => {
            if (res.canceled)
                return;
            if (res.selection === 0) {
                this.openConfigMenu();
            }
        });
    }
    openConfigMenu() {
        if (!this.player)
            return;
        const blockP = this.block.permutation;
        const blockArea = blockP.getState("um:area");
        const dropdown = ["2x2", "4x4", "6x6", "8x8"];
        const defaultAreaStateIndex = blockArea ? dropdown.indexOf(blockArea) : 0;
        const form = new ModalFormData()
            .title("§6Harvestor Settings")
            .dropdown("§eSelect Area Size", dropdown, {
            defaultValueIndex: defaultAreaStateIndex
        })
            .show(this.player).then(res => {
            if (res.canceled)
                return;
            const selectedIndex = res.formValues?.[0];
            const selectedArea = dropdown[selectedIndex];
            const newPermutation = blockP.withState("um:area", selectedArea);
            this.block.setPermutation(newPermutation);
            this.player?.sendMessage(`§aArea set to: ${selectedArea}`);
        });
    }
    // Coal consume karne ka function
    tryConsumeCoal() {
        if (!this.player)
            return false;
        const inv = this.player.getComponent("inventory");
        if (!inv?.container)
            return false;
        // Player inventory se coal dhundo
        for (let i = 0; i < inv.container.size; i++) {
            const item = inv.container.getItem(i);
            if (item && item.typeId === "minecraft:coal") {
                if (item.amount > 1) {
                    item.amount--;
                    inv.container.setItem(i, item);
                }
                else {
                    inv.container.setItem(i, undefined);
                }
                this.player.sendMessage("§a+60s added! Coal consumed.");
                return true;
            }
        }
    }
    tryConsumeCoalFromChest() {
        // Chest check (upar wala block)
        const aboveBlock = this.dimension.getBlock({
            x: this.block.x,
            y: this.block.y + 1,
            z: this.block.z
        });
        if (aboveBlock && aboveBlock.typeId === "minecraft:chest") {
            const chestInv = aboveBlock.getComponent("inventory");
            if (chestInv?.container) {
                for (let i = 0; i < chestInv.container.size; i++) {
                    const item = chestInv.container.getItem(i);
                    if (item && item.typeId === "minecraft:coal") {
                        if (item.amount > 1) {
                            item.amount--;
                            chestInv.container.setItem(i, item);
                        }
                        else {
                            chestInv.container.setItem(i, undefined);
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }
    // Player coal add kare tab
    addFuel() {
        if (this.tryConsumeCoal() || this.tryConsumeCoalFromChest()) {
            this.setTimer(60);
        }
    }
    tick() {
        const timer = this.getTimer();
        // Agar timer 0 hai to kuch nahi karo
        if (timer <= 0) {
            this.addFuel();
            return;
        }
        const block = this.block;
        const getArea = block.permutation.getState("um:area");
        if (!getArea)
            return;
        // Har second timer kam karo
        this.setTimer(timer - 1);
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
                    x: block.x + x,
                    y: block.y,
                    z: block.z + z
                });
                if (!targetBlock)
                    continue;
                const growthState = targetBlock.permutation.getState("growth");
                const ageState = targetBlock.permutation.getState("age");
                // Growth state 1 se 15 tak hi harvest
                if (growthState !== undefined && growthState >= 1 && growthState <= 15) {
                    if (growthState === 7 || growthState === 15) {
                        this.harvestAndReplant(targetBlock, "growth", 0);
                    }
                    continue;
                }
                // Age state 1 se 15 tak hi harvest
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
            this.dimension.runCommand(`loot spawn ${location.x} ${location.y} ${location.z} mine ${location.x} ${location.y} ${location.z}`);
            const newPermutation = targetBlock.permutation.withState(stateType, resetValue);
            targetBlock.setPermutation(newPermutation);
        }
        catch (error) {
            const blockTypeId = targetBlock.typeId;
            const location = targetBlock.location;
            this.dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} air destroy`);
            this.dimension.runCommand(`setblock ${location.x} ${location.y} ${location.z} ${blockTypeId} [${stateType}=${resetValue}]`);
        }
    }
}
system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent("um:harvestor", {
        onPlayerInteract: (e) => {
            const { block, player, dimension } = e;
            const harvestor = new Harvestor(block, player, dimension);
            // Agar player sneak kar raha hai to coal add karo
            if (player && player.isSneaking) {
                harvestor.addFuel();
            }
            else {
                harvestor.openMenu();
            }
        },
        onTick: (e) => {
            const { block, dimension } = e;
            // Har 20 ticks (1 second) mein tick call hoga
            new Harvestor(block, undefined, dimension).tick();
        }
    });
});
// Timer display ke liye (optional)
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        // Yahan actionbar mein timer display kar sakte ho
    }
}, 20);
