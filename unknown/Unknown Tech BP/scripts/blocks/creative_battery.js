import {system, world, ItemStack } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

const batteryBlocks = [
  "um:creative_battery"
  ]

export const BatteryData = new Map();

export function updateMap(key, valeu){
  BatteryData.set(key, valeu)
}

class Batery {
    constructor(block, blockData, dimension, per) {
       this.block = block;
       this.data = blockData;
       this.dimension = dimension;
       this.p = per;
    }
    
     CreativeBattery() {
       

       
       let key = `${this.block.x},${this.block.y},${this.block.z}`
       
       
       
    }
    
    getBlockEntity(){
     const entity = this.dimension.getEntitiesAtBlockLocation(this.block.location)
     for(let e of entity){
       if(e.typeId == "um:battery"){
         return e
       }
     }
    }
}


world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const { player, block, dimension } = event;
    
    if(batteryBlocks.includes(block.typeId)){
            let key = `${block.x},${block.y},${block.z}`;
             let deleteData = BatteryData.delete(key)
              console.log(`\n§3Block: ${block.typeId}\nkey: ${key}\nDelete: ${deleteData}`)
    }
});

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.blockComponentRegistry.registerCustomComponent("um:battery",
    {
      onTick: (  event,  p ) => {
                const { player, block, dimension, brokenBlockPermutation } =
                    event;
                const blockData = p.params
                const isCreative = blockData.isCreative
                
                if(isCreative){
                  new Batery(block, blockData, dimension, brokenBlockPermutation)
               .CreativeBattery()
                }
                
               
                
            },
            
    onPlace: (e, p) => {
      const {block, player, dimension} = e;
     let key = `${block.x},${block.y},${block.z}`;
      
      BatteryData.set(key, {EU: 0})
    },
    
    
    
    onPlayerInteract: (event, p) => {
            const { player, block, dimension, face, faceLocation } = event;
           const blockData = p.params
           let key = `${block.x},${block.y},${block.z}`;
           
           
      
      if(BatteryData.has(key)){
        openMenu(player, block)
      } 
    },
    
    
    })
})


function openMenu(player, block){
  const form = new ActionFormData()
  .title("Battery States")
  .button("inpute/output")
  .button("Power States")
  .show(player).then(res => {
    
    if (res.canceled) return;

      if (res.selection === 0){
        openBatteryIOMenu(player, block)
      }
  })
}

function openBatteryIOMenu(player, block){
  let p = block.permutation
  let val = ["None", "Output"]
  let state =[
    "um:north",
    "um:south",
    "um:east",
    "um:west",
    "um:up",
    "um:down",
    ]
  let data = [
    {
      key: "North",
      valus: val,
      state: state[0]
    },
    {
      key: "South",
      valus: val,
      state: state[1]
    },
    {
      key: "East",
      valus: val ,
      state: state[2]
    },
    {
      key: "West",
      valus: val,
      state: state[3]
    },
    {
      key: "Up",
      valus: val,
      state: state[4]
    },
    {
      key: "Down",
      valus: val,
      state: state[5]
    }
    ]

  const from = new ModalFormData()
  .title("I/O Menu")
  for(let {key, valus, state} of data){
    let Default = p.getState(state)
    let num = (Default == "None") ? 0 : 1
  from.dropdown(`${key}`, valus, {defaultValueIndex : num})
    
  }
  from.show(player).then(res => {
    if(res.canceled) return;
// formValues
let i = 0;
  let newPermutation = p;
  while(i <= 5){
    let j = res.formValues[i]
      console.log(`${state[i]} / ${val[j]}`)
      newPermutation = newPermutation.withState(state[i], val[j])
    i++
  }
  block.setPermutation(newPermutation)
  
  })
}

function formatNumber(num) {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return num.toString();
  }
}