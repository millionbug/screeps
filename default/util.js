"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCreeps = void 0;
function clearCreeps() {
    var _a;
    var _loop_1 = function (name_1) {
        var creepMemory = Memory.creeps[name_1];
        // 如果这个 creep 死掉了，需要清空所有有关的数据
        if (!Game.creeps[name_1]) {
            // 删除当前在采矿的出勤表
            var sourceMap = Memory.spawns['Spawn1'].sourceMap[creepMemory.sourceMap];
            if (sourceMap) {
                var index = sourceMap.indexOf(name_1);
                sourceMap.splice(index, 1);
            }
            var workList = Memory.spawns['Spawn1'].workList;
            if (workList && workList[creepMemory.goal]) {
                Memory.spawns['Spawn1'].workList[creepMemory.goal] = (_a = workList[creepMemory.goal]) === null || _a === void 0 ? void 0 : _a.filter(function (id) {
                    return id !== name_1;
                });
            }
            // 删除 creep 的 memory
            delete Memory.creeps[name_1];
        }
    };
    for (var name_1 in Memory.creeps) {
        _loop_1(name_1);
    }
}
exports.clearCreeps = clearCreeps;
