"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreepController = exports.loop = exports.createCreep = void 0;
var CREEP_STATUS_RELAXING = 'relaxing';
var CREEP_STATUS_BACK = 'harvestBacking';
var CREEP_STATUS_HARVEST = 'harvesting';
var CREEP_STATUS_UPGRADING = 'upgrading';
var CREEP_STATUS_BUILDING = 'building';
function createCreep() {
    // 这里只创建 creeteCreep
    var Spawn1 = Game.spawns['Spawn1'];
    var createResult = Spawn1.spawnCreep([WORK, CARRY, MOVE], 'work' + Spawn1.memory.startIndex);
    var creep = Game.creeps['work' + Spawn1.memory.startIndex];
    if (createResult === OK && creep) {
        Spawn1.memory.startIndex++;
        var sourceName = findCouldHarvestSource();
        Spawn1.memory.sourceMap[sourceName].push(sourceName);
        creep.memory.sourceMap = sourceName;
        creep.memory.status = CREEP_STATUS_RELAXING;
        return creep;
        // goal 待定
        creep.memory.goal = 'upgradeController';
    }
    return null;
}
exports.createCreep = createCreep;
var workScheduling = [
    { name: 'transfers', need: 1 },
    { name: 'upgraders', need: 1 },
    { name: 'roadBuilders', need: 5 },
    { name: 'extensionBuilders', need: 3 }
];
function loop() {
    var Spawn1 = Game.spawns['Spawn1'];
    if (!Spawn1.memory.workList) {
        Spawn1.memory.workList = {};
    }
    var workList = Spawn1.memory.workList;
    for (var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
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
exports.loop = loop;
function creepRun(creep) {
    switch (creep.memory.goal) {
        case 'transfers':
            CreepController.transfer(creep);
            break;
        case 'upgraders':
            CreepController.upgrader(creep);
            break;
        case 'roadBuilders':
            CreepController.builder(creep, [STRUCTURE_EXTENSION, STRUCTURE_ROAD]);
            break;
        case 'extensionBuilders': CreepController.builder(creep, [STRUCTURE_EXTENSION, STRUCTURE_ROAD]);
    }
}
var CreepController = /** @class */ (function () {
    function CreepController() {
    }
    CreepController.transfer = function (creep) {
        var target;
        var Spawn1 = Game.spawns['Spawn1'];
        var extensions = Spawn1.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });
        for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
            var exten = extensions_1[_i];
            if (exten.energy < exten.store.getCapacity(RESOURCE_ENERGY)) {
                target = exten;
                break;
            }
        }
        if (!target) {
            target = Spawn1;
        }
        var transferResult = creep.transfer(target, RESOURCE_ENERGY);
        if (transferResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        else if (transferResult === OK && creep.store.energy === 0) {
            creep.memory.status = CREEP_STATUS_RELAXING;
        }
        else {
            creep.say(transferResult.toString());
        }
        return;
    };
    CreepController.upgrader = function (creep) {
        var Spawn1 = Game.spawns['Spawn1'];
        if (!Spawn1.room.controller) {
            return;
        }
        var result = creep.upgradeController(Spawn1.room.controller);
        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(Spawn1.room.controller);
        }
        else if (result === OK) {
            if (creep.store.energy === 0) {
                creep.memory.status = CREEP_STATUS_RELAXING;
            }
            else if (creep.store.energy > 0) {
                creep.memory.status = CREEP_STATUS_UPGRADING;
            }
        }
    };
    CreepController.builder = function (creep, buildQue) {
        var nowBuildableSiteList = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (creep.memory.status === CREEP_STATUS_HARVEST
            && creep.store.energy < creep.store.getCapacity(RESOURCE_ENERGY)
            || creep.store.energy === 0) {
            harvest(creep);
            return;
        }
        if (nowBuildableSiteList && nowBuildableSiteList.length) {
            var target = void 0;
            var _loop_1 = function (type) {
                var tt = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                    filter: function (site) { return site.structureType === type; }
                });
                if (tt) {
                    target = tt;
                    return "break";
                }
            };
            for (var type in buildQue) {
                var state_1 = _loop_1(type);
                if (state_1 === "break")
                    break;
            }
            if (target) {
                var buildResult = creep.build(target);
                if (buildResult === OK && creep.store.energy > 0) {
                    creep.memory.status = CREEP_STATUS_BUILDING;
                }
                else if (buildResult === ERR_NOT_IN_RANGE) {
                    creep.memory.status = CREEP_STATUS_BACK;
                }
                else {
                    creep.say(buildResult.toString());
                }
            }
        }
        else {
            // 如果没有需要修建的建筑则全部去储能，还没想好
            this.transfer(creep);
        }
    };
    return CreepController;
}());
exports.CreepController = CreepController;
function checkWorkToDo() {
    var Spawn1 = Game.spawns['Spawn1'];
    if (!Spawn1.memory.workList) {
        Spawn1.memory.workList = {};
    }
    var workList = Spawn1.memory.workList;
    return workScheduling.find(function (work) {
        var _a;
        if (!workList[work.name]) {
            workList[work.name] = [];
        }
        if (((_a = workList[work.name]) === null || _a === void 0 ? void 0 : _a.length) < work.need) {
            return true;
        }
        return false;
    }) || workScheduling[workScheduling.length - 1];
}
function updateCurrentListFromMap(memoryList, currentMap) {
    // 根据最新的 hashmap 来更新 memoryList
    memoryList = memoryList.filter(function (id) {
        return currentMap && currentMap[id];
    });
    Object.keys(currentMap).map(function (id) {
        if (!memoryList.includes(id)) {
            memoryList.push(id);
        }
    });
    return memoryList;
}
function updateCurrentListFroArr(memoryList, currentArr) {
    // 根据最新的 arr 来更新 memoryList
    memoryList = memoryList.filter(function (id) {
        return currentArr.find(function (curr) { return curr.id === id; });
    });
    currentArr.forEach(function (curr) {
        if (!memoryList.includes(curr.id)) {
            memoryList.push(curr.id);
        }
    });
    return memoryList;
}
function harvest(creep) {
    var source = Game.getObjectById('5bbcae0a9099fc012e638598');
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
        creep.memory.status = CREEP_STATUS_HARVEST;
    }
}
function findCouldHarvestSource() {
    // 暂时先等于 0 ，没找到怎么判断每个矿的距离
    return '0';
    for (var mapName in Memory.spawns['Spawn1'].sourceMap) {
        if (Memory.spawns['Spawn1'].sourceMap[mapName].length < 4) {
            return mapName;
        }
    }
    return 'noSourceCouldHarvest';
}
