import { world, Block, Dimension, system, Entity } from "@minecraft/server";

const NAMESPACE = "um";
const EntityId = "um:energyfluid";

export const EnergyBlocks = [
    
];

let objective = null;


// Optional: Re-init on world load for safety (e.g., if reloaded)
world.afterEvents.worldLoad.subscribe(e => {
const sb = world.scoreboard;
    objective = {
        energy: sb.getObjective("energy") ?? sb.addObjective("energy", "energy"),
        energyCap: sb.getObjective("energyCap") ?? sb.addObjective("energyCap", "energyCap")
    };
});

export class Energy {
    constructor(block, dimension, isOutput = false) {
        this.block = block;
        this.dimension = dimension;
        this.entity = this.getEntity();
        this.output = isOutput;
                
        if(!this.output && !EnergyBlocks.includes(block.typeId)){

        EnergyBlocks.push(block.typeId)
      
}
    }

    getEntity() {
        const entitie = this.dimension.getEntitiesAtBlockLocation(this.block.location)[0];
        return entitie   //entities.find(e => e.typeId === EntityId);
    }

    getEnergy() {
        if (!this.entity) return 0;
           let id = this.entity.scoreboardIdentity

        return objective?.energy?.getScore(id) || 0;
    }

    setEnergy(value) {
        if (!this.entity) return 0;
        const cap = this.getCapacity();
        const clampedValue = Math.min(value, cap);
        objective?.energy?.setScore(this.entity, clampedValue);
        return clampedValue;
    }

    getCapacity() {
        if (!this.entity) return 0;
        let id = this.entity.scoreboardIdentity
        return objective?.energyCap?.getScore(id) || 0;
    }
    
    setCapacity(energyCap) {
    if (!this.entity) return 
            objective?.energyCap?.setScore(this.entity, energyCap)
        
    }

    burnEnergy(value) {
        if (!this.entity) return;
        let currentEnergy = this.getEnergy();
        const newEnergy = Math.max(currentEnergy - value, 0);
        objective?.energy?.setScore(this.entity, newEnergy);
    }

    addEnergy(value) {
        if (!this.entity) return 0;
        let currentEnergy = this.getEnergy();
        let energyCap = this.getCapacity();
        const usedAmount = energyCap - currentEnergy;
        const useAmount = Math.min(usedAmount, value);
        const newEnergy = Math.min(currentEnergy + useAmount, energyCap);
        objective?.energy?.setScore(this.entity, newEnergy);
        console.log(`${newEnergy}`)
        return newEnergy;
    }

    hasEnergy(value) {
        const currentEnergy = this.getEnergy();
        return currentEnergy >= value;
    }
}


//registorEnergyBlock OtherAddon

system.afterEvents.scriptEventReceive.subscribe(e => {

    if (e.id === "um:ragistorEnergyBlock") {
        EnergyBlocks.push(e.message)
    }
})