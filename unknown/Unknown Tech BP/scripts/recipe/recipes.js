export { alloySmelterRecipes };
const alloySmelterRecipes = [
    {
        shaped: true,
        input: [
            {
                itemId: "minecraft:iron_ingot",
                count: 1,
                slot: 0
            },
            {
                itemId: "minecraft:copper_ingot",
                count: 1,
                slot: 1
            }
        ],
        output: {
            itemId: "minecraft:gold_ingot",
            count: 1,
            slot: 3
        },
        time: 60, // in tick;
        energy: 100
    },
    {
        shaped: false,
        input: [
            {
                itemId: "minecraft:iron_ingot",
                count: 1,
             
            },
            {
                itemId: "minecraft:gold_ingot",
                count: 1,
              
            }
        ],
        output: {
            itemId: "minecraft:diamond",
            count: 1,
            slot: 3
        },
        time: 100, // in tick;
        energy: 500
    }
];
