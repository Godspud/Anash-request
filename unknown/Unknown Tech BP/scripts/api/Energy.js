import { world, system } from "@minecraft/server";
import { findEntityFromLocation, removeEntityFromBlockLocation } from "../utility/utilitys";
const NAMESPACE = "um";
const EntityId = "um:energy_fluid_slot";
export const EnergyBlocks = [
    "um:alloy_smelter"
];
let objective = null;
// Optional: Re-init on world load for safety (e.g., if reloaded)
world.afterEvents.worldLoad.subscribe(() => {
    const sb = world.scoreboard;
    objective = {
        energy: sb.getObjective("energy") ?? sb.addObjective("energy", "energy"),
        energyCap: sb.getObjective("energyCap") ?? sb.addObjective("energyCap", "energyCap")
    };
});
export class Energy {
    block;
    dimension;
    entity;
    output;
    energyValid;
    constructor(block, dimension, isOutput = false) {
        this.block = block;
        this.dimension = dimension;
        this.entity = this.getEntity();
        this.output = isOutput;
        this.energyValid = this.entity ? true : false;
        if (!this.output && !EnergyBlocks.includes(block.typeId)) {
            EnergyBlocks.push(block.typeId);
        }
    }
    getEntity() {
        return findEntityFromLocation(this.block.location, this.dimension, EntityId);
    }
    getEnergy() {
        if (!this.entity)
            return 0;
        const id = this.entity.scoreboardIdentity;
        if (!id)
            return 0;
        return objective?.energy?.getScore(id) ?? 0;
    }
    setEnergy(value) {
        if (!this.entity)
            return 0;
        const cap = this.getCapacity();
        const clampedValue = Math.min(value, cap);
        objective?.energy?.setScore(this.entity, clampedValue);
        return clampedValue;
    }
    getCapacity() {
        if (!this.entity)
            return 0;
        const id = this.entity.scoreboardIdentity;
        if (!id)
            return 0;
        return objective?.energyCap?.getScore(id) ?? 0;
    }
    setCapacity(energyCap) {
        if (!this.entity)
            return;
        objective?.energyCap?.setScore(this.entity, energyCap);
    }
    burnEnergy(value) {
        if (!this.entity)
            return;
        const currentEnergy = this.getEnergy();
        const newEnergy = Math.max(currentEnergy - value, 0);
        objective?.energy?.setScore(this.entity, newEnergy);
    }
    addEnergy(value) {
        if (!this.entity)
            return 0;
        const currentEnergy = this.getEnergy();
        const energyCap = this.getCapacity();
        const usedAmount = energyCap - currentEnergy;
        const useAmount = Math.min(usedAmount, value);
        const newEnergy = Math.min(currentEnergy + useAmount, energyCap);
        objective?.energy?.setScore(this.entity, newEnergy);
     //   console.log(`${newEnergy}`);
        return newEnergy;
    }
    hasEnergy(value) {
        const currentEnergy = this.getEnergy();
        return currentEnergy >= value;
    }
}
// registerEnergyBlock OtherAddon
system.afterEvents.scriptEventReceive.subscribe((e) => {
    if (e.id === "um:ragistorEnergyBlock") {
        EnergyBlocks.push(e.message);
    }
});
system.beforeEvents.startup.subscribe(e => {
    e.blockComponentRegistry.registerCustomComponent("um:energy_block", {
        onPlace: (e, p) => {
            const { block, dimension } = e;
            const { capacity, entity: entityId, gui_id } = p.params;
            if (capacity < 0 && (!entityId || typeof entityId !== "string"))
                return;
            let { x, y, z } = block.location;
            let entity = dimension.spawnEntity(entityId, { x: x + 0.5, y, z: z + 0.5 });
            if (!entity)
                return;
            gui_id ? entity.nameTag = gui_id : "";
            let energy = new Energy(block, dimension, false);
            energy.setCapacity(capacity);
        },
        onPlayerBreak: (e, p) => removeEntityFromBlockLocation(e.block, e.dimension, p.params.entity)
    });
});
