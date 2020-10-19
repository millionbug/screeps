type NAME = 'transfers' | 'upgraders' | 'roadBuilders' | 'extensionBuilders' | 'repairs' | 'harvesters';

export function clearCreeps() {
    for (let name in Memory.creeps) {
        const creepMemory = Memory.creeps[name];
        // 如果这个 creep 死掉了，需要清空所有有关的数据
        if (!Game.creeps[name]) {
            // 删除当前在采矿的出勤表
            const sourceMap = Memory.spawns['Spawn1'].sourceMap[creepMemory.sourceMap];
            if (sourceMap) {
                const index = sourceMap.indexOf(name);
                sourceMap.splice(index, 1);
            }

            const workList = Memory.spawns['Spawn1'].workList;
            if (workList && workList[creepMemory.goal as NAME]) {
                Memory.spawns['Spawn1'].workList[creepMemory.goal as NAME] = workList[creepMemory.goal as NAME]?.filter(id => {
                    return id !== name;
                })
            }

            // 删除 creep 的 memory
            delete Memory.creeps[name];
        }
    }
}
