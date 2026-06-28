"use strict";

let activeDrills = [];
let fastItems = [];

Events.on(EventType.ClientLoadEvent, cons(e => {
    let seq = Vars.content.items();
    for (let i = 0; i < seq.size; i++) {
        fastItems.push(seq.get(i));
    }
    
    Vars.content.blocks().each(b => {
        if (b instanceof Drill) {
            b.itemCapacity = Math.max(b.itemCapacity, 150);
        }
    });
}));

Events.on(EventType.WorldLoadEvent, cons(e => {
    activeDrills = [];
    let width = Vars.world.width();
    let height = Vars.world.height();
    
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let build = Vars.world.build(x, y);
            if (build != null && build.block instanceof Drill) {
                activeDrills.push({ b: build, rot: 0 });
            }
        }
    }
}));

Events.on(EventType.TileChangeEvent, cons(e => {
    if (e.tile != null && e.tile.build != null && e.tile.build.block instanceof Drill) {
        let exists = false;
        for(let i = 0; i < activeDrills.length; i++) {
            if(activeDrills[i].b === e.tile.build) {
                exists = true; 
                break;
            }
        }
        if (!exists) {
            activeDrills.push({ b: e.tile.build, rot: 0 });
        }
    }
}));

Events.run(Trigger.update, () => {
    if (Vars.state.isPaused()) return;
    
    let nextDrills = [];
    
    for (let i = 0; i < activeDrills.length; i++) {
        let wrapper = activeDrills[i];
        let drill = wrapper.b;
        
        if (!drill.isValid() || !(drill.block instanceof Drill)) {
            continue;
        }
        nextDrills.push(wrapper);

        if (drill.liquids != null && drill.liquids.currentAmount() > 0) {
            drill.dumpLiquid(drill.liquids.current());
        }

        if (drill.items.total() === 0) continue;

        let pSize = drill.proximity.size;
        if (pSize === 0) continue;

        wrapper.rot++;

        let currentItem = null;
        for (let k = 0; k < fastItems.length; k++) {
            let item = fastItems[k];
            if (drill.items.get(item) > 0) {
                currentItem = item;
                break;
            }
        }

        if (currentItem == null) continue;

        let attempts = 30;
        
        while (attempts > 0 && drill.items.get(currentItem) > 0) {
            let transferred = false;
            
            for (let j = 0; j < pSize; j++) {
                let target = drill.proximity.get((j + wrapper.rot) % pSize);
                
                if (target.block instanceof Drill) {
                    if (target.items.get(currentItem) + 1 < drill.items.get(currentItem) && 
                        target.items.get(currentItem) < target.block.itemCapacity) {
                        
                        drill.items.remove(currentItem, 1);
                        target.items.add(currentItem, 1);
                        transferred = true;
                        break; 
                    }
                } 
                else {
                    if (target.acceptItem(drill, currentItem)) {
                        drill.items.remove(currentItem, 1);
                        target.handleItem(drill, currentItem); 
                        transferred = true;
                        break;
                    }
                }
            }
            
            if (transferred) {
                attempts--;
            } else {
                break; 
            }
        }
    }
    
    activeDrills = nextDrills;
});