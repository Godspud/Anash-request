import {system, world, ItemStack } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

import {BatteryData} from "./creative_battery.js"


system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.blockComponentRegistry.registerCustomComponent("um:blockDatas",
    {
    
    onPlayerInteract: (event) => {
            const { player, block, dimension, face, faceLocation } = event;
        
           openMenu(player)
    },
    
      
    })
})


function openMenu(player){
  
  const from = new ActionFormData()
  .title("All Blocks Data")
  .button("creative Battery Data")
  .show(player).then(res => {
    
    if (res.canceled) return;

      if (res.selection === 0){
        openCreativeBatteryMenu(player)
      }
  })
}

function openCreativeBatteryMenu(player){
  
  const from = new MessageFormData()
  .title("Creative Battery Data")
  .body(`${mapToString(BatteryData, "EU")}`)
  .show(player).then(res => {
    
  })
}


function mapToString(map, valueName) {
  let result = "";
  for (let [key, value] of map) {
    result += `Key: ${key}: {${valueName}: ${value[valueName]}}\n`;
  }
  return result.trim();
}
