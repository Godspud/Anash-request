import { world, Block, Entity, ItemStack, Dimension, system } from "@minecraft/server";

const NAMESPACE = "um";
const EntityId = "um:energyfluid";

const propartys = {
    FluidType: "um:fluid_type",
    FluidCap: "um:fluid_cap",
    FluidLevel: "um:fluid_level"
};

export class Fluid {
    constructor(block, dimension) {
        this.block = block;
        this.dimension = dimension;
    }

    hasFluid(fluidType) {
        const entity = this.getEntity();
        if (!entity) return false;
        const state = entity.getProperty(propartys.FluidType);
        if (fluidType === undefined) {
            if (state === "air") return false;
            return true;
        } else if (fluidType === state) {
            return true;
        } else {
            return false;
        }
    }

    hasFluidAmount(amount) {
        const entity = this.getEntity();
        if (!entity) return false;
        const fluidLevel = entity.getProperty(propartys.FluidLevel);
        return fluidLevel <= amount;
    }

    setFluidAmount(amount) {
        const entity = this.getEntity();
        if (!entity) return false;
        if (this.hasFluid()) {
            const fluidCap = entity.getProperty(propartys.FluidCap);
            const addAmount = Math.min(fluidCap, amount);
            entity.setProperty(propartys.FluidLevel, addAmount);
            return true;
        }
        return false;
    }

    getFluidAmount() {
        const entity = this.getEntity();
        if (!entity) return 0;
        return entity.getProperty(propartys.FluidLevel);
    }

    getEntity() {
        const entitys = this.dimension.getEntitiesAtBlockLocation(this.block.location);
        return entitys.find(e => e.typeId === EntityId);
    }

    getFluidWithAmount() {
        const entity = this.getEntity();
        if (!entity) return { fluidType: "air", fluidAmount: 0 };
        const fluidType = entity.getProperty(propartys.FluidType);
        const fluidAmount = this.getFluidAmount();
        return { fluidType, fluidAmount };
    }

    addFluidAmount(amount) {
        const entity = this.getEntity();
        if (!entity) return 0;
        if (this.hasFluid()) {
            const fluidCap = entity.getProperty(propartys.FluidCap);
            const fluidAmount = this.getFluidAmount();
            const usedAmount = fluidCap - fluidAmount;
            const useAmount = Math.min(amount, usedAmount);
            entity.setProperty(propartys.FluidLevel, fluidAmount + useAmount);
            return useAmount;
        }
        return 0;
    }

    removeFluidAmount(amount) {
        const entity = this.getEntity();
        if (!entity) return;
        if (this.hasFluid()) {
            const fluidAmount = entity.getProperty(propartys.FluidLevel);
            const usedAmount = fluidAmount - amount;
            entity.setProperty(propartys.FluidLevel, Math.max(usedAmount, 0));
        }
    }
}