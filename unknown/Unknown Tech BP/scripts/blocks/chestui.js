import { world, system, ItemStack, ItemLockMode } from "@minecraft/server";
const uiItem = "§u§i";
export class ChestUi {
    block;
    dimension;
    containerType;
    containerBlock;
    constructor(block, dimension, containerType) {
        this.block = block;
        this.dimension = dimension;
        this.containerType = containerType;
        this.containerBlock = containerType ? containerType : "minecraft:chest";
    }
    button(slot, icon, name, work) {
        const storage = this.block.above(1);
        if (storage.typeId === this.containerBlock) {
            let item = new ItemStack(icon !== "default" ? icon : "minecraft:barrier", 1);
            item.nameTag = name;
            item.setLore([uiItem]);
            let inv = storage.getComponent("inventory").container;
            if (typeof slot === "number") {
                let itemSlot = inv.getSlot(slot);
                if (work === "set") {
                    itemSlot.setItem(item);
                }
                else if (work === "block") {
                    if (itemSlot.hasItem())
                        return;
                    item.lockMode = ItemLockMode.slot;
                    itemSlot.setItem(item);
                }
            }
            else if (Array.isArray(slot)) {
                let [startSlot, endSlot] = slot;
                for (let i = startSlot; i <= endSlot; i++) {
                    let itemSlot = inv.getSlot(i);
                    if (work === "set") {
                        itemSlot.setItem(item);
                    }
                    else if (work === "block") {
                        if (itemSlot.hasItem())
                            return;
                        item.lockMode = ItemLockMode.slot;
                        itemSlot.setItem(item);
                    }
                }
            }
            //  world.sendMessage("add item")
        }
        return this;
    }
}
system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent("um:chestui", {
        onTick: (e) => {
            const { block, dimension } = e;
            new ChestUi(block, dimension)
                .button([0, 1], "minecraft:barrier", "§1", "set")
                .button([5, 8], "minecraft:barrier", "§1", "set")
                .button([9, 10], "minecraft:barrier", "§1", "set")
                .button(14, "minecraft:barrier", "§1", "set")
                .button([16, 17], "minecraft:barrier", "§1", "set")
                .button([18, 19], "minecraft:barrier", "§1", "set")
                .button([23, 26], "minecraft:barrier", "§1", "set");
        }
    });
});
/*system.runInterval(() => {

    for (let player of world.getAllPlayers()) {
        let inv = player.getComponent("inventory").container
        for (let i = 0; i < inv.size; i++) {
            let slot = inv.getSlot(i)
            let name = slot.getItem()?.getLore()[0]

            if (name?.endsWith(uiItem)) {
                slot.setItem(undefined)
            }
        }
    }

}, 4)
world.afterEvents.entitySpawn.subscribe(e => {
    if (e.entity.typeId !== "minecraft:item") return;
    let item = e.entity?.getComponent("minecraft:item")?.itemStack;
    if (!item) return;
    let lore = item.getLore()[0];
    if (lore?.endsWith(uiItem)) {
        e.entity.remove();
    }
});*/
