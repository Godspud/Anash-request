import { world, system, ItemTypes } from "@minecraft/server";
import { Common } from "./common";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
const blockArea = [
    "2x2", "4x4", "6x6", "8x8"
];
const blockAreaForBesic = [
    "2x2", "4x4", "6x6"
];
class ItemCollector {
    block;
    dimension;
    constructor(block, dimension) {
        this.block = block;
        this.dimension = dimension;
    }
    openHomeManu(player, isBasic) {
        let blockName = Common.blockNameById(this.block.typeId);
        const form = new ActionFormData();
        form.title(`§6§l${blockName}`);
        form.body(`§7Welcome to your §eItem Collector§7!\n§7Click below to configure settings.`);
        form.button('§a§lSettings\n§8Configure collector', 'textures/ui/settings_glyph_color_2x');
        form.show(player).then(res => {
            if (res.canceled)
                return;
            this.openSettingMenu(player, isBasic);
        });
    }
    openSettingMenu(player, isBasic) {
        const blockName = Common.blockNameById(this.block.typeId);
        const form = new ActionFormData();
        form.title(`§6§l${blockName} - Settings`);
        form.body(`§7Choose what you want to configure:`);
        form.button('§e§lSelect Area\n§8Set collection range', 'textures/ui/World');
        if (!isBasic) {
            form.button(`§b§lFilter Items\n§8Choose what to collect`, 'textures/ui/store_filter_icon');
        }
        form.button("§c§lBack\n§8Return to menu", 'textures/ui/back_button_default');
        form.show(player).then(res => {
            if (res.canceled)
                return;
            switch (res.selection) {
                case 0:
                    this.editSettingMeny(player, isBasic);
                    break;
                case isBasic ? undefined : 1:
                    this.editFiltorMenu(player);
                    break;
                case isBasic ? 1 : 2:
                    this.openHomeManu(player, isBasic);
                    break;
            }
        });
    }
    editSettingMeny(player, isBasic) {
        let getArea = Common.getStateById(this.block, "um:area");
        let getOffsetY = Common.getStateById(this.block, "um:offsetY");
        let positiveOffset = Common.getStateById(this.block, "um:addOffset");
        let defaultAreaStateIndex = blockArea.indexOf(getArea) || 0;
        let defaultOffSetY = positiveOffset ? 0 + getOffsetY : 0 - getOffsetY;
        const form = new ModalFormData();
        form.title(`§6§l${Common.blockNameById(this.block.typeId)} - Area Settings`);
        form.dropdown(`§eSelect Collection Area§r\n§8Larger area = more items collected`, isBasic ? blockAreaForBesic : blockArea, { defaultValueIndex: defaultAreaStateIndex });
        form.slider(`§eVertical OffsetY`, -5, 5, { defaultValue: defaultOffSetY });
        form.submitButton("§a§lSave Settings");
        form.show(player).then(res => {
            if (res.canceled)
                return;
            let area = res.formValues[0];
            let offsetY = res.formValues[1];
            let positiveOffset;
            if (offsetY < 0) {
                positiveOffset = false;
            }
            else {
                positiveOffset = true;
            }
            let offsetNum = Math.abs(offsetY);
            Common.setState(this.block, "um:area", blockArea[area]);
            Common.setState(this.block, "um:addOffset", positiveOffset);
            Common.setState(this.block, "um:offsetY", offsetNum);
            player.sendMessage(`§a§l[SUCCESS]§r §8Area set to §e${blockArea[area]}§8 with offset §e${offsetY > 0 ? '+' : ''}${offsetY}§8!`);
            player.playSound("random.orb");
        });
    }
    editFiltorMenu(player) {
        const blockName = Common.blockNameById(this.block.typeId);
        const key = Common.getKeyByBlock(this.block);
        const filtorItems = JSON.parse(world.getDynamicProperty(key));
        const filtorMeseage = filtorItems.item === undefined ? "§8No filters set - §eAll items§8 will be collected" : `§a${filtorItems.item.length} items§8 in filter:\n§e` + filtorItems.item.map(item => `• ${Common.blockNameById(item)}`).join("\n§e");
        const form = new ActionFormData()
            .title(`§6§l${blockName} - Item Filter`)
            .body(`${filtorMeseage}`)
            .button("§a§lAdd Item\n§8Add from ID/Name", 'textures/ui/confirm');
        if (filtorItems.item !== undefined && filtorItems?.item.length > 0) {
            form.button("§e§lRemove Item\n§8Remove specific item", 'textures/ui/cancel');
            form.button("§c§lClear All\n§8Remove all filters", 'textures/ui/trash_default');
        }
        form.button("§8§lBack\n§8Return to settings", 'textures/ui/back_button_default');
        form.show(player).then(res => {
            if (res.canceled)
                return;
            switch (res.selection) {
                case (filtorItems.item !== undefined && filtorItems?.item.length > 0) ? 3 : 1:
                    this.openSettingMenu(player, false);
                    break;
                case 0:
                    this.addItemById(player);
                    break;
                case (filtorItems.item !== undefined && filtorItems?.item.length > 0) ? 1 : undefined:
                    this.filtorItemRemove(player, false);
                    break;
                case 2:
                    this.filtorItemRemove(player, true);
                    break;
            }
        });
    }
    filtorItemRemove(player, allItem) {
        if (allItem) {
            this.confromRemoveMeseage(player, "§c§lRemove All Filters", "§8Are you sure you want to remove §call filters§8?\n§eThis cannot be undone!", undefined);
        }
        else {
            let arrey = JSON.parse(world.getDynamicProperty(Common.getKeyByBlock(this.block)));
            let form = new ModalFormData()
                .title("§e§lRemove Item Filter")
                .dropdown("§8Select item to remove:", arrey.item.map(item => Common.blockNameById(item)))
                .submitButton("§c§lRemove Item")
                .show(player).then(res => {
                if (res.canceled)
                    return;
                let removeItemIndex = res.formValues[0];
                let newItem = [...arrey.item];
                let removeItemName = newItem.splice(removeItemIndex, 1);
                let data = JSON.stringify({ item: (newItem.length > 0) ? newItem : undefined });
                this.confromRemoveMeseage(player, `§e§lRemove: ${Common.blockNameById(removeItemName[0])}`, `§8Remove §e${Common.blockNameById(removeItemName[0])}§8 from filter?\n§8This item will §cno longer§8 be collected.`, data);
            });
        }
    }
    confromRemoveMeseage(player, title, meseage, data) {
        let form = new MessageFormData()
            .title(title)
            .body(meseage)
            .button1("§a§lYES")
            .button2("§c§lNO")
            .show(player).then(res => {
            if (res.canceled)
                return;
            if (res.selection === 0) {
                world.setDynamicProperty(Common.getKeyByBlock(this.block), data);
                player.sendMessage("§a§l[SUCCESS]§r §8Filter updated successfully!");
                player.playSound("random.levelup");
            }
            if (res.selection === 1) {
                player.sendMessage("§e§l[CANCELLED]§r §8Action cancelled.");
                system.runTimeout(() => {
                    this.editFiltorMenu(player);
                }, 5);
            }
        });
    }
    addItemById(player) {
        let currentData = JSON.parse(world.getDynamicProperty(Common.getKeyByBlock(this.block)));
        let form = new ModalFormData()
            .title(`§6§l${Common.blockNameById(this.block.typeId)} - Add Filter`)
            .textField("§eEnter Item ID or Name§r\n§8Use underscores (_) instead of spaces\n§8Example: §bdiamond_block§8 or §biron_ingot", "Search...", { tooltip: "§8Partial names work too!\n§8Try: §ediamond§8, §eiron§8, §ewood" })
            .submitButton("§a§lSearch Items")
            .show(player).then(res => {
            if (res.canceled)
                return;
            let blockId = res.formValues[0];
            if (blockId && blockId.length >= 3) {
                this.setItemById(player, blockId);
            }
            else {
                player.sendMessage("§c§l[ERROR]§r §8Please enter at least §e3 characters§8!");
                player.playSound("note.bass");
            }
        });
    }
    setItemById(player, blockId) {
        //  let blocks = BlockTypes.getAll();
        let items = ItemTypes.getAll();
        let allStuff = [];
        //  allStuff.push(...blocks);
        allStuff.push(...items);
        let showIds = allStuff.filter(e => e.id.includes(blockId));
        if (showIds.length === 0) {
            player.sendMessage(`§c§l[ERROR]§r §8No items found matching §e"${blockId}"§8!`);
            player.playSound("note.bass");
            system.runTimeout(() => {
                this.addItemById(player);
            }, 10);
            return;
        }
        let form = new ActionFormData()
            .title(`§6§lSearch Results: §e"${blockId}"`)
            .body(`§7Found §a${showIds.length}§7 matching items\n§7Select one to add to filter:`)
            .button("§c§lBack\n§8Search again", 'textures/ui/back_button_default');
        for (let id of showIds) {
            form.button(`§e${Common.blockNameById(id.id)}\n§8${id.id}`, 'textures/items/' + id.id.split(':')[1]);
        }
        form.show(player).then(res => {
            if (res.canceled)
                return;
            if (res.selection === 0) {
                this.addItemById(player);
            }
            else if (res.selection !== 0) {
                let id = showIds[(res.selection - 1)].id;
                let currentData = JSON.parse(world.getDynamicProperty(Common.getKeyByBlock(this.block)));
                let newItem = currentData.item === undefined ? [] : [...currentData.item];
                if (newItem.includes(id)) {
                    player.sendMessage(`§e§l[INFO]§r §8Item §e${Common.blockNameById(id)}§8 is already in the filter!`);
                    player.playSound("note.pling");
                }
                else {
                    newItem.push(id);
                    let valuse = JSON.stringify({ item: newItem });
                    world.setDynamicProperty(Common.getKeyByBlock(this.block), valuse);
                    player.sendMessage(`§a§l[SUCCESS]§r §8Added §e${Common.blockNameById(id)}§8 to filter!`);
                    player.playSound("random.orb");
                }
                system.runTimeout(() => {
                    this.editFiltorMenu(player);
                }, 5);
            }
        });
    }
    onTick(isBasic) {
        let getArea = Common.getStateById(this.block, "um:area");
        let offsetNum = Common.getStateById(this.block, "um:offsetY");
        let getOffsetY = Common.getStateById(this.block, "um:addOffset") ? 0 + offsetNum : 0 - offsetNum;
        let block = this.block;
        let areaNum = this.getNumFromArea(getArea);
        let dx = block.x - (areaNum / 2);
        let dy = block.y + getOffsetY;
        let dz = block.z - (areaNum / 2);
        let belowBlock = this.getBlockByDirection();
        let containerBlock = belowBlock?.getComponent("minecraft:inventory")?.container;
        for (let x = dx; x <= (dx + areaNum); x++) {
            for (let z = dz; z <= (dz + areaNum); z++) {
                let entitys = this.dimension.getEntitiesAtBlockLocation({ x: x, y: dy, z: z });
                if (!entitys)
                    continue;
                for (let entity of entitys) {
                    let item = entity.getComponent("minecraft:item")?.itemStack;
                    if (!item)
                        continue;
                    if (!isBasic) {
                        let getItems = JSON.parse(world.getDynamicProperty(Common.getKeyByBlock(this.block)));
                        if (getItems && getItems.item !== undefined && getItems.item.includes(item.typeId)) {
                            if (containerBlock?.isValid === true && containerBlock?.emptySlotsCount >= 1) {
                                containerBlock.addItem(item);
                            }
                            else {
                                this.dimension.spawnItem(item, block.location);
                            }
                            entity.remove();
                        }
                        else if (!getItems || getItems.item === undefined) {
                            if (containerBlock?.isValid === true && containerBlock?.emptySlotsCount >= 1) {
                                containerBlock.addItem(item);
                            }
                            else {
                                this.dimension.spawnItem(item, block.location);
                            }
                            entity.remove();
                        }
                    }
                    else {
                        if (containerBlock?.isValid === true && containerBlock?.emptySlotsCount >= 1) {
                            containerBlock.addItem(item);
                        }
                        else {
                            this.dimension.spawnItem(item, block.location);
                        }
                        entity.remove();
                    }
                }
            }
        }
    }
    getNumFromArea(area) {
        switch (area) {
            case "2x2":
                return 2;
                break;
            case "4x4":
                return 4;
                break;
            case "6x6":
                return 6;
                break;
            case "8x8":
                return 8;
                break;
        }
    }
    getBlockByDirection() {
        let direction = Common.getStateById(this.block, "minecraft:block_face");
        switch (direction) {
            case "down":
                return this.block.above(1);
            case "up":
                return this.block.below(1);
            case "west":
                return this.block.east(1);
            case "east":
                return this.block.west(1);
            case "south":
                return this.block.north(1);
            case "north":
                return this.block.south(1);
        }
    }
    addFiltorData() {
        world.setDynamicProperty(Common.getKeyByBlock(this.block), JSON.stringify({ item: undefined }));
    }
}
system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent("um:basicItemCollector", {
        onPlayerInteract: (e) => {
            let itemCollector = new ItemCollector(e.block, e.dimension);
            itemCollector.openHomeManu(e.player, true);
        },
        onTick: (e) => {
            let itemCollector = new ItemCollector(e.block, e.dimension);
            itemCollector.onTick(true);
            //console.log(itemCollector.getBlockByDirection().typeId)
        }
    });
    e.blockComponentRegistry.registerCustomComponent("um:advancedItemCollector", {
        onPlayerInteract: (e) => {
            let itemCollector = new ItemCollector(e.block, e.dimension);
            itemCollector.openHomeManu(e.player, false);
        },
        onTick: (e) => {
            let itemCollector = new ItemCollector(e.block, e.dimension);
            itemCollector.onTick(false);
        },
        onPlace: (e) => {
            let itemCollector = new ItemCollector(e.block, e.dimension);
            itemCollector.addFiltorData();
        },
        onPlayerBreak: (e) => {
            new ItemCollector(e.block, e.dimension).addFiltorData();
        }
    });
});
