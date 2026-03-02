import { world, system, Dimension, Vector3 } from "@minecraft/server";
import { Energy, EnergyBlocks } from "./Energy";  // Assuming Energy is in separate file
import { Common } from "../blocks/common";

const NAMESPACE = "um";
const EntityId = "um:energyfluid";

const GeneratorConfig = {
    "um:solar_panel": {
        productionPerTick: 1000,
        maxStorage: 10000,
        transferOutPerTick: 800
    },
    "um:coal_generator": {
        productionPerTick: 500,
        maxStorage: 5000,
        transferOutPerTick: 300
    },
    // Add more: "um:wind_turbine": { productionPerTick: 700, maxStorage: 8000, transferOutPerTick: 500 }
};

const CableConfig = {
    "um:energy_cable": {
        transferPerTick: 200
    },
    "um:thick_cable": {
        transferPerTick: 500
    }
    // Add more cable types with their transfer limits
};

export class Generator {
    constructor(block, dimension, config) {
        this.block = block;
        this.dimension = dimension;
        this.config = config;
        // Compose Energy like in Harvestor
        this.energy = new Energy(block, dimension);
        // Ensure entity exists for storage (optional, since Common.addEnergyAndFluid handles)
        if (!this.energy.entity) {
            this.spawnEntity();
            this.energy.entity = this.energy.getEntity();
        }
     
    }

    spawnEntity() {
        const center = Vector3.create(
            this.block.location.x + 0.5,
            this.block.location.y + 0.5,
            this.block.location.z + 0.5
        );
        this.dimension.spawnEntity(EntityId, center);
    }

    produce() {
        const produced = this.config.productionPerTick;
        const added = this.energy.addEnergy(produced);
        // Optional: log or effect if full
        if (added < produced) {
            // Storage full, maybe particle effect
            this.dimension.spawnParticle("minecraft:heart_particle", this.block.location);
        }
    }

    export() {
        const available = this.energy.getEnergy();
        if (available <= 0) return;

        const exportAmount = Math.min(available, this.config.transferOutPerTick);
        if (exportAmount > 0) {
            this.exportThroughNetwork(exportAmount);
            this.energy.burnEnergy(exportAmount);
        }
    }

    exportThroughNetwork(flowAmount) {
        if (flowAmount <= 0) return;

        const startLoc = this.getOutputLoc();
        const queue = [{ location: startLoc, flow: flowAmount }];
        const visited = new Set();

        while (queue.length > 0) {
            const { location, flow } = queue.shift();
            const key = `${location.x},${location.y},${location.z}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const block = this.dimension.getBlock(location);
            if (!block) continue;

            if (this.isCable(block)) {
                const cableConfig = CableConfig[block.typeId] || { transferPerTick: 0 };
                const maxFlow = Math.min(flow, cableConfig.transferPerTick);
                if (maxFlow <= 0) continue;

                // Get connected adjacent locations
                const offsets = this.getCableOffsets(block);
                const connectedCount = offsets.filter(({ connected }) => connected).length;
                if (connectedCount === 0) continue;

                const flowPerConnection = maxFlow / connectedCount;  // Even split

                for (const { pos, connected } of offsets) {
                    if (!connected) continue;
                    const posKey = `${pos.x},${pos.y},${pos.z}`;
                    if (visited.has(posKey)) continue;

                    const nextBlock = this.dimension.getBlock(pos);
                    if (this.isCable(nextBlock)) {
                        // Propagate to next cable
                        queue.push({ location: pos, flow: flowPerConnection });
                    } else if (nextBlock && EnergyBlocks.includes(nextBlock.typeId) && 
                               !this.locationsEqual(nextBlock.location, this.block.location)) {
                        // Deliver to target energy block (not self) - use Energy for any block
                        const target = new Energy(nextBlock, this.dimension);
                        const delivered = target.addEnergy(flowPerConnection);
                        // Optional: reduce flow by delivered, but for sim, continue
                    }
                }
            } else if (block && EnergyBlocks.includes(block.typeId) && 
                       !this.locationsEqual(block.location, this.block.location)) {
                // Direct adjacent energy block
                const target = new Energy(block, this.dimension);
                target.addEnergy(flow);
            }
        }
    }

    isCable(block) {
        return CableConfig[block.typeId] !== undefined;
    }

    getCableOffsets(block) {
        const offsets = [
            { pos: block.offset({ x: 0, y: 0, z: -1 }), face: "um:f_north" },   // North
            { pos: block.offset({ x: 0, y: 0, z: 1 }), face: "um:f_south" },    // South
            { pos: block.offset({ x: 1, y: 0, z: 0 }), face: "um:f_east" },     // East
            { pos: block.offset({ x: -1, y: 0, z: 0 }), face: "um:f_west" },    // West
            { pos: block.offset({ x: 0, y: 1, z: 0 }), face: "um:f_top" },      // Up
            { pos: block.offset({ x: 0, y: -1, z: 0 }), face: "um:f_bottom" }   // Down
        ];
        return offsets.map(({ pos, face }) => ({
            pos,
            connected: block.permutation.getState(face) === true
        }));
    }

    locationsEqual(loc1, loc2) {
        return loc1.x === loc2.x && loc1.y === loc2.y && loc1.z === loc2.z;
    }

    getOutputLoc() {
        const face = this.block.permutation.getState("minecraft:cardinal_direction");
        switch (face) {
            case "north": return this.block.offset({ x: 0, y: 0, z: 1 });
            case "south": return this.block.offset({ x: 0, y: 0, z: -1 });
            case "east": return this.block.offset({ x: -1, y: 0, z: 0 });
            case "west": return this.block.offset({ x: 1, y: 0, z: 0 });
            default: return this.block.offset({ x: 1, y: 0, z: 0 });  // Default east
        }
    }
}

// Register custom component for all generators (add "um:generator" to block JSON in behavior pack)
system.beforeEvents.startup.subscribe(event => {
    event.blockComponentRegistry.registerCustomComponent("um:generator", {
        onTick: (eventData) => {
            const { block, dimension } = eventData;
            const config = GeneratorConfig[block.typeId];
            if (config) {
                const gen = new Generator(block, dimension, config);
                gen.produce();
                gen.export();
            }
        },
        onPlayerInteract: (eventData) => {
            const { player, block, dimension } = eventData;
            const config = GeneratorConfig[block.typeId];
            if (config) {
                const gen = new Generator(block, dimension, config);
                const stored = gen.energy.getEnergy();
                const cap = gen.energy.getCapacity();
                player.sendMessage(`§a${block.typeId}: §e${stored} / ${cap} EU`);
            }
        },
        onPlace: e => {
            Common.addEnergyAndFluid(e.block);
            const config = GeneratorConfig[block.typeId];
            if (config) {
                const gen = new Generator(block, dimension, config);
                
                const cap = gen.energy.setCapacity(comfig.maxStorage);
         
            }
        }
    });
});

// Auto-register generators as EnergyBlocks on world load or via event
/*world.afterEvents.worldInitialize.subscribe(() => {
    Object.keys(GeneratorConfig).forEach(typeId => {
        if (!EnergyBlocks.includes(typeId)) {
            EnergyBlocks.push(typeId);
        }
    });
});*/

// Script event for dynamic registration (extend Energy's)
system.afterEvents.scriptEventReceive.subscribe(e => {
    if (e.id === "um:registerGenerator") {
        const typeId = e.message;
        if (GeneratorConfig[typeId]) {
            if (!EnergyBlocks.includes(typeId)) {
                EnergyBlocks.push(typeId);
            }
            // Optional: dynamic config load from JSON via world.getDynamicProperty
        }
    }
});