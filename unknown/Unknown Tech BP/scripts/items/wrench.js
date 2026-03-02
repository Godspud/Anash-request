import {system, world, ItemStack } from "@minecraft/server";


class BlockInputeOutput {
    constructor(block, player, p) {
       this.block = block;
       this.player = player;
       this.p = p;
    }
    
    changeFace(face) {
      let getState;
      let value;
        switch (face) {
            case "North":
            getState = this.p.getState("um:north")
           value = (getState == "none") ? "output" : "none"
            this.block.setPermutation(this.p.withState("um:north", value))
            
                break;
            case "South":
            getState = this.p.getState("um:south")
           value = (getState == "none") ? "output" : "none"
            this.block.setPermutation(this.p.withState("um:south", value))
            
                break;
            case "East":
            getState = this.p.getState("um:east")
           value = (getState == "none") ? "output" : "none"
            this.block.setPermutation(this.p.withState("um:east", value))
            
                break;
            case "West":
            getState = this.p.getState("um:west")
           value = (getState == "none") ? "output" : "none"
            this.block.setPermutation(this.p.withState("um:west", value))
            
                break;
            default:
                // default body
                break;
        }
    }
    
  
}


system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("um:wrench", {
        onUseOn(event) {
            const { source, usedOnBlockPermutation, block, blockFace } = event;
              if(block.typeId == "um:creative_battery"){
                new BlockInputeOutput(block, source, usedOnBlockPermutation).changeFace(blockFace)
              }
        },
    });
});