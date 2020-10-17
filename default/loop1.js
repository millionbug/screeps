"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWork = void 0;
var CREEP_STATUS_RELAXING = 'relaxing';
var CREEP_STATUS_BACK = 'harvestBacking';
var CREEP_STATUS_HARVEST = 'harvesting';
var CREEP_STATUS_UPGRADING = 'upgrading';
var Spawn1;
var workers;
var sources;
for (var name_1 in Memory.creeps) {
    if (!Object.keys(Memory.creeps[name_1]).length) {
        delete Memory.creeps[name_1];
    }
}
function startWork() {
    Spawn1 = Game.spawns['Spawn1'];
    initSourceMap();
    clearCreeps();
    var creepsAcount = Object.keys(Game.creeps).length;
    createNewCreep();
    for (var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
        // console.log(creep.name, creep.memory.goal, creepsAcount, creep.store.energy, creep.memory.status)
        if (creep.store.energy < creep.store.getCapacity()
            && (creep.memory.status === CREEP_STATUS_HARVEST || creep.memory.status === CREEP_STATUS_RELAXING)
            && sources && sources.length
            || creep.store.energy === 0) {
            startHarvester(creep);
        }
        else {
            // 当前数量超出10个后，所有的能量都用于升级controller
            // console.log(creep.memory.goal === 'transfer', creepsAcount < 10, creep.name, 'dfddf')
            creep.memory.status = CREEP_STATUS_BACK;
            if (creep.memory.goal === 'transfer' && creepsAcount <= 6) {
                var result = creep.transfer(Spawn1, RESOURCE_ENERGY);
                if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(Spawn1);
                }
                else if (result === OK && creep.store.energy === 0) {
                    creep.memory.status = CREEP_STATUS_RELAXING;
                }
            }
            else if ((creep.memory.goal === 'upgradeController' || creepsAcount > 6) && Spawn1.room.controller) {
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
            }
        }
    }
}
exports.startWork = startWork;
function createNewCreep() {
    // 如果当前有 creep 正在被孵化则返回
    if (Spawn1.spawning && Spawn1.spawning.needTime) {
        return;
    }
    var creepsAcount = Object.keys(Game.creeps).length;
    if (Spawn1.store[RESOURCE_ENERGY] >= 300 && creepsAcount < 4) {
        console.log(Spawn1.store[RESOURCE_ENERGY], 'working');
        createWorkCreep();
    }
    else if (Spawn1.store[RESOURCE_ENERGY] >= 300 && creepsAcount >= 4 && creepsAcount < 10) {
        console.log(Spawn1.store[RESOURCE_ENERGY], 'upgrading');
        createUpgradCreep();
    }
}
function createUpgradCreep() {
    var result = Spawn1.spawnCreep([WORK, CARRY, MOVE], 'work' + Spawn1.memory.startIndex);
    var creepResult = Game.creeps['work' + Spawn1.memory.startIndex];
    if (result === OK && creepResult) {
        Spawn1.memory.startIndex++;
        var sourceName = findCouldHarvestSource();
        Spawn1.memory.sourceMap[sourceName].push(sourceName);
        creepResult.memory.sourceMap = sourceName;
        creepResult.memory.status = CREEP_STATUS_RELAXING;
        creepResult.memory.goal = 'upgradeController';
    }
}
function createWorkCreep() {
    var result = Spawn1.spawnCreep([WORK, CARRY, MOVE], 'work' + Spawn1.memory.startIndex);
    var creepResult = Game.creeps['work' + Spawn1.memory.startIndex];
    if (result === OK && creepResult) {
        Spawn1.memory.startIndex++;
        var sourceName = findCouldHarvestSource();
        Spawn1.memory.sourceMap[sourceName].push(sourceName);
        creepResult.memory.sourceMap = sourceName;
        creepResult.memory.status = CREEP_STATUS_RELAXING;
        creepResult.memory.goal = 'transfer';
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
function initSourceMap() {
    sources = Spawn1.room.find(FIND_SOURCES);
    sources.forEach(function (s, index) {
        if (!Spawn1.memory.sourceMap) {
            Spawn1.memory.sourceMap = {};
        }
        if (!Spawn1.memory.sourceMap[index]) {
            Spawn1.memory.sourceMap[index] = [];
        }
    });
}
function clearCreeps() {
    for (var name_2 in Memory.creeps) {
        var creepMemory = Memory.creeps[name_2];
        // 如果这个 creep 死掉了，需要清空所有有关的数据
        if (!Game.creeps[name_2]) {
            // 删除当前在采矿的出勤表
            var sourceMap = Memory.spawns['Spawn1'].sourceMap[creepMemory.sourceMap];
            if (sourceMap) {
                var index = sourceMap.indexOf(name_2);
                sourceMap.splice(index, 1);
            }
            // 删除 creep 的 memory
            delete Memory.creeps[name_2];
        }
    }
}
function startHarvester(creep) {
    // const source = sources[Number(creep.memory.sourceMap) || 0];
    var source = Game.getObjectById('5bbcae0a9099fc012e638598');
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
        creep.memory.status = CREEP_STATUS_HARVEST;
    }
}
