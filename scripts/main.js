"use strict";

Events.on(EventType.ClientLoadEvent, cons(e => {
    let blocks = Vars.content.blocks().toArray();

    for(let i = 0; i < blocks.length; i++){
        let block = blocks[i];
        
        if(block instanceof Drill){
            
            block.acceptsItems = true;
            block.outputsLiquid = true;

            block.buildType = () => extend(Drill.DrillBuild, block, {
                
                acceptItem(source, item) {
                    if (source != null && source.block instanceof Drill) {
                        return this.items.get(item) < this.block.itemCapacity;
                    }
                    return false;
                },

                updateTile() {
                    this.super$updateTile();

                    if (this.items.total() > 0) {
                        this.dump();
                    }

                    if (this.liquids.currentAmount() > 0) {
                        this.dumpLiquid(this.liquids.current());
                    }
                }
            });
        }
    }
}));