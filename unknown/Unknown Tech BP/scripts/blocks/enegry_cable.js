import { BlockPermutation, system, world } from "@minecraft/server";

 
const Checks = [
  {
    ThisFace: "um:top",
    OtherFace: "um:bottom",
    Direction: { x: 0, y: 1, z: 0 }
  },
  {
    ThisFace: "um:bottom",
    OtherFace: "um:top",
    Direction: { x: 0, y: -1, z: 0 }
  },
  {
    ThisFace: "um:east",
    OtherFace: "um:west",
    Direction: { x: 1, y: 0, z: 0 }
  },
  {
    ThisFace: "um:west",
    OtherFace: "um:east",
    Direction: { x: -1, y: 0, z: 0 }
  },
  {
    ThisFace: "um:north",
    OtherFace: "um:south",
    Direction: { x: 0, y: 0, z: -1 }
  },
  {
    ThisFace: "um:south",
    OtherFace: "um:north",
    Direction: { x: 0, y: 0, z: 1 }
  }
]



function vector3(sX, sY, sZ, eX, eY, eZ) {
  return { x: sX + eX, y: sY + eY, z: sZ + eZ }
}


system.beforeEvents.startup.subscribe(event => {
  event.blockComponentRegistry.registerCustomComponent("um:energy_cable", {
    onTick: (event) => {
      updatePipe(event)

    },
    
    onPlayerInteract: (event) => {
            const { player, block, dimension, face, faceLocation } = event;
           
           disConectPipe(block,face,player)
        },

  })
})


function updatePipe(event) {
  const { block, dimension } = event;


  let thisStates = block.permutation?.getAllStates();

  Checks.forEach(check => {
    let otherBlock = block.dimension.getBlock(vector3(block.location.x, block.location.y, block.location.z, check.Direction.x, check.Direction.y, check.Direction.z));

    let inv = otherBlock?.getComponent("inventory")?.container
    
    if(block.typeId == otherBlock.typeId){  
     thisStates[check.ThisFace] = true;
          } else if(otherBlock?.hasTag("energyCable")) {
thisStates[check.ThisFace] = true;
     } else {
     thisStates[check.ThisFace] = false;
     }
    

  })

  block.setPermutation(BlockPermutation.resolve(block.typeId, thisStates));
}


function  disConectPipe(block, face, player){
  
  const inv = player.getComponent("inventory").container
  const item = inv.getSlot(player.selectedSlotIndex)
  
  if(item.getItem()?.typeId == "um:wrench"){
   // console.log(face)
   
   let faceState;
   let faceName;
   let currentState;
   
   switch (face) {
       case "East":
       currentState = block.permutation.getState("um:f_east");
      faceState = currentState ? false : true
      faceName = "um:f_east"
           break;
       case "West":
       currentState = block.permutation.getState("um:f_west");
      faceState = currentState ? false : true
      faceName = "um:f_west"
           break;
       case "North":
       currentState = block.permutation.getState("um:f_north");
      faceState = currentState ? false : true
      faceName = "um:f_north"
           break;
       case "South":
       currentState = block.permutation.getState("um:f_south");
      faceState = currentState ? false : true
      faceName = "um:f_south"
           break;
       case "Up":
       currentState = block.permutation.getState("um:f_top");
      faceState = currentState ? false : true
      faceName = "um:f_top"
           break;
       case "Down":
       currentState = block.permutation.getState("um:f_bottom");
      faceState = currentState ? false : true
      faceName = "um:f_bottom"
           break;
      default:
      console.log(face)
      break;
   }
   
   block.setPermutation(block.permutation.withState(faceName,faceState))
  }
  
}