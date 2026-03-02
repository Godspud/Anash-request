import { world, system, ItemStack } from "@minecraft/server";
import { alloySmelterRecipes } from "../recipe/recipes";
import { findEntityFromLocation, getEntityContainer, updateAmountOnSlot, addItemInContainor, formatNumberToString, onBlockBreakDropItems } from "../utility/utilitys";
import { Energy } from "../api/Energy";
const RecipeTimer = new Map();
const Block_Entity_Id = "um:energy_fluid_slot";
const Gui_Id = "um.alloy_smelter.ui";
const CustomComponentID = "um:alloy_smelter";
const BlockID = "um:alloy_smelter";
system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent(CustomComponentID, AlloySmelterComponent);
});
world.beforeEvents.playerBreakBlock.subscribe(e => {
    if (e.block.typeId !== BlockID)
        return;
    onBlockBreak(e);
});
class RecipesProcessor {
    block;
    dimension;
    recipes;
    key;
    constructor(block, dimension, recipes) {
        this.block = block;
        this.dimension = dimension;
        this.recipes = recipes;
        let key = `${this.block.x},${this.block.y},${this.block.z},${this.dimension.id}`;
    }
    process() {
        const recipe = this.findMatchedRecipe();
        let timer = this.getTimer();
        if (recipe) {
            let energy = new Energy(this.block, this.dimension);
          //  console.log(`${energy.getEnergy()}`)
            if (!energy.hasEnergy(recipe.energy))
                return false;
               // console.log(`${energy.hasEnergy(recipe.energy)}`)
                console.log(`${timer}`)
            let hasTime = recipe.time / 5;
            if (hasTime <= timer) {
                this.consumeInputs(recipe);
                this.addOutput(recipe);
                energy.burnEnergy(recipe.energy);
                this.resetTimer();
            }
            else {
                this.addTimer();
            }
        }
        return true;
    }
    getTimer() {
        return RecipeTimer.get(this.key);
    }
    hasTimer(amount) {
        let timer = RecipeTimer.get(this.key);
        if (timer >= amount)
            return true;
        return false;
    }
    addTimer(amount = 1) {
        let timer = RecipeTimer.get(this.key) || 0;
        RecipeTimer.set(this.key, timer + amount);
    }
    resetTimer() {
        RecipeTimer.set(this.key, 0);
    }
    findMatchedRecipe() {
        const entity = findEntityFromLocation(this.block.location, this.dimension, Block_Entity_Id);
        if (!entity)
            return null;
        const inv = getEntityContainer(entity);
        for (const recipe of this.recipes) {
            const valid = recipe.shaped
                ? this.checkShaped(recipe, inv)
                : this.checkShapeless(recipe, inv);
            if (valid && this.chackOutputSlot(inv, recipe))
                return recipe;
        }
        return null;
    }
    checkShapeless(recipe, inv) {
        let matched = 0;
        for (const input of recipe.input) {
            for (let i = 0; i < 3; i++) {
                const item = inv.getItem(i);
                if (!item)
                    continue;
                if (item.typeId === input.itemId &&
                    item.amount >= input.count) {
                    matched++;
                    break;
                }
            }
        }
        return matched === recipe.input.length;
    }
    checkShaped(recipe, inv) {
        for (const input of recipe.input) {
            const item = inv.getItem(input.slot);
            if (!item ||
                item.typeId !== input.itemId ||
                item.amount < input.count) {
                return false;
            }
        }
        return true;
    }
    consumeInputs(recipe) {
        const entity = findEntityFromLocation(this.block.location, this.dimension, Block_Entity_Id);
        if (!entity)
            return;
        const inv = getEntityContainer(entity);
        for (const input of recipe.input) {
            const slot = input.slot ?? this.findSlot(inv, input.itemId);
            if (slot === -1)
                continue;
            const item = inv.getItem(slot);
            if (!item)
                continue;
            if (item.amount - input.count > 0) {
                item.amount -= input.count;
                inv.setItem(slot, item);
                continue;
            }
            inv.setItem(slot, undefined);
        }
    }
    addOutput(recipe) {
        const entity = findEntityFromLocation(this.block.location, this.dimension, Block_Entity_Id);
        if (!entity)
            return;
        const inv = getEntityContainer(entity);
        const outputSlot = recipe.output.slot;
        let slot = inv.getSlot(outputSlot);
        addItemInContainor(recipe.output.itemId, recipe.output.count, slot);
    }
    findSlot(inv, itemId) {
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (item?.typeId === itemId)
                return i;
        }
        return -1;
    }
    chackOutputSlot(inv, recipe) {
        let slot = inv.getSlot(recipe.output.slot);
        if (!slot.getItem())
            return true;
        let item = slot.getItem();
        if (item.typeId === recipe.output.itemId && item.amount <= (item.maxAmount - recipe.output.count))
            return true;
        return false;
    }
}
const AlloySmelterComponent = {
    onPlace: (e) => onPlace(e),
    onTick: (e) => onTick(e),
};
function onPlace(e) {
    const { block, dimension } = e;
    let key = `${block.x},${block.y},${block.z},${dimension.id}`;
    RecipeTimer.set(key, 0);
}
function onBlockBreak(e) {
    onBlockBreakDropItems(e.block, e.dimension, Block_Entity_Id);
}
;
function onTick(e) {
    const { block, dimension } = e;
    let recipe = new RecipesProcessor(block, dimension, alloySmelterRecipes);
    recipe.process();
    onTickForUpdateEnergy(block, dimension);
}
function onTickForUpdateEnergy(block, dimension) {
    if (!block && !dimension)
        return;
    //energy bar code
    // energy label code
    let energy = new Energy(block, dimension, false);
    let currentAmount = energy.getEnergy() || 0;
    let energyCap = energy.getCapacity() || 0;
    if (currentAmount < 0 && energyCap < 0)
        return;
    let entity = findEntityFromLocation(block.location, dimension, Block_Entity_Id);
    if (!energy)
        return;
    let inv = getEntityContainer(entity);
    let energyLabel = `§1${formatNumberToString(energyCap)}UE/${formatNumberToString(currentAmount)}UE`;
    let slot = inv.getSlot(4);
    let item = slot?.getItem();
    //onTickForUpdateEnergyBar(block, dimension, slot, energy)
    if (!item) {
        let item = new ItemStack("minecraft:stick", 1);
        item.nameTag = energyLabel;
        slot.setItem(item);
    }
    else {
        item.nameTag = energyLabel;
        slot.setItem(item);
        updateAmountOnSlot(energyCap, currentAmount, slot);
    }
}
;
