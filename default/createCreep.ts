import { unique } from 'lodash';
const CREEP_STATUS_RELAXING = 'relaxing';
const CREEP_STATUS_BACK = 'harvestBacking';
const CREEP_STATUS_HARVEST = 'harvesting';
const CREEP_STATUS_UPGRADING = 'upgrading';
const CREEP_STATUS_BUILDING = 'building';


export function createCreep() {
    // 这里只创建 creeteCreep
    const Spawn1 = Game.spawns['Spawn1'];
    const createResult = Spawn1.spawnCreep([WORK, CARRY, MOVE], 'work' + Spawn1.memory.startIndex);
    const creep = Game.creeps['work' + Spawn1.memory.startIndex];
    if (createResult === OK && creep) {
        Spawn1.memory.startIndex++;
        const sourceName = findCouldHarvestSource();
        Spawn1.memory.sourceMap[sourceName].push(sourceName);
        creep.memory.sourceMap = sourceName;
        creep.memory.status = CREEP_STATUS_RELAXING;
        return creep;
        // goal 待定
        creep.memory.goal = 'upgradeController'
    }
    return null;
}

const workScheduling: {
    name: 'transfers' | 'upgraders' | 'roadBuilders' | 'extensionBuilders',
    need: number
}[] = [
    {name: 'transfers', need: 1},
    {name: 'upgraders', need: 1},
    {name: 'roadBuilders', need: 5},
    {name: 'extensionBuilders', need: 3}
];

export function loop() {
    const Spawn1 = Game.spawns['Spawn1'];
    if (!Spawn1.memory.workList) {
        Spawn1.memory.workList = {};
    }
    const workList = Spawn1.memory.workList;
    for (let creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        // 如果这个 creep 是新生儿则对其安排工作
        if (!creep.memory.goal) {
            creep.memory.goal = checkWorkToDo().name;
        }
        if (creep.spawning) {
            continue;
        }
        creepRun(creep);
    }
}

function creepRun(creep: Creep) {
    switch(creep.memory.goal) {
        case 'transfers': CreepController.transfer(creep);break;
        case 'upgraders': CreepController.upgrader(creep);break;
        case 'roadBuilders': CreepController.builder(creep, [STRUCTURE_EXTENSION, STRUCTURE_ROAD]);break;
        case 'extensionBuilders': CreepController.builder(creep, [STRUCTURE_EXTENSION, STRUCTURE_ROAD]);
    }
}

export class CreepController {
    static transfer(creep: Creep) {
        let target;
        const Spawn1 = Game.spawns['Spawn1'];
        const extensions = Spawn1.room.find<StructureExtension>(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        })
        for (let exten of extensions) {
            if (exten.energy < exten.store.getCapacity(RESOURCE_ENERGY)) {
                target = exten;
                break;
            }
        }
        if (!target) {
            target = Spawn1;
        }
        const transferResult = creep.transfer(target, RESOURCE_ENERGY)
        if (transferResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } else if (transferResult === OK && creep.store.energy === 0) {
            creep.memory.status = CREEP_STATUS_RELAXING;
        } else {
            creep.say(transferResult.toString());
        }
    
        return;
    
    }

    static upgrader(creep: Creep) {
        const Spawn1 = Game.spawns['Spawn1'];
        if (!Spawn1.room.controller) {
            return;
        }
        const result = creep.upgradeController(Spawn1.room.controller)
        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(Spawn1.room.controller);
        } else if (result === OK) {
            if (creep.store.energy === 0) {
                creep.memory.status = CREEP_STATUS_RELAXING;
            } else if (creep.store.energy > 0) {
                creep.memory.status = CREEP_STATUS_UPGRADING;
            }
        }
    }

    static builder(creep: Creep, buildQue: BuildableStructureConstant[]) {
        const nowBuildableSiteList = creep.room.find(FIND_CONSTRUCTION_SITES);
    
        if (
            creep.memory.status === CREEP_STATUS_HARVEST
            &&  creep.store.energy < creep.store.getCapacity(RESOURCE_ENERGY)
            || creep.store.energy === 0
        ) {
            harvest(creep);
            return;
        }
    
        if (nowBuildableSiteList && nowBuildableSiteList.length) {
            let target;
            for (let type in buildQue) {
                let tt = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: site => site.structureType === type
                });
                if (tt) {
                    target = tt;
                    break;
                }
            }
            if (target) {
                const buildResult = creep.build(target);
                if (buildResult === OK && creep.store.energy > 0) {
                    creep.memory.status = CREEP_STATUS_BUILDING;
                } else if (buildResult === ERR_NOT_IN_RANGE) {
                    creep.memory.status = CREEP_STATUS_BACK;
                } else {
                    creep.say(buildResult.toString());
                }
            }
        } else {
            // 如果没有需要修建的建筑则全部去储能，还没想好
            this.transfer(creep);
        }
    }
}


function checkWorkToDo() {
    const Spawn1 = Game.spawns['Spawn1'];
    if (!Spawn1.memory.workList) {
        Spawn1.memory.workList = {};
    }
    const workList = Spawn1.memory.workList;
    return workScheduling.find(work => {
        if (!workList[work.name]) {
            workList[work.name] = [];
        }
        if ((workList[work.name]?.length as number) < work.need) {
            return true;
        }
        return false;
    }) || workScheduling[workScheduling.length - 1]
    
}

function updateCurrentListFromMap(memoryList: string[], currentMap: {[key: string]: any}) {
    // 根据最新的 hashmap 来更新 memoryList
    memoryList = memoryList.filter(id => {
        return currentMap && currentMap[id];
    });
    Object.keys(currentMap).map(id => {
        if (!memoryList.includes(id)) {
            memoryList.push(id);
        }
    })
    return memoryList;
}

function updateCurrentListFroArr(memoryList: string[], currentArr: any[]) {
    // 根据最新的 arr 来更新 memoryList
    memoryList = memoryList.filter(id => {
        return currentArr.find(curr => curr.id === id)
    });
    currentArr.forEach(curr => {
        if (!memoryList.includes(curr.id)) {
            memoryList.push(curr.id);
        }
    })
    return memoryList;
}

function harvest(creep: Creep) {
    const source = Game.getObjectById('5bbcae0a9099fc012e638598') as Source;
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
        creep.memory.status = CREEP_STATUS_HARVEST;
    }
}

function findCouldHarvestSource() {
    // 暂时先等于 0 ，没找到怎么判断每个矿的距离
    return '0';
    for (let mapName in Memory.spawns['Spawn1'].sourceMap) {
        if (Memory.spawns['Spawn1'].sourceMap[mapName].length < 4) {
            return mapName;
        }
    }
    return 'noSourceCouldHarvest';
}
