"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tasks_exports = {};
__export(tasks_exports, {
  addTask: () => addTask,
  deleteTask: () => deleteTask,
  getTasks: () => getTasks,
  updateTask: () => updateTask
});
module.exports = __toCommonJS(tasks_exports);
var import_consts = require("./consts");
var import_userRequest = require("./userRequest");
async function addTask(token) {
  let uInfo = await (0, import_userRequest.userRequest)(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  } else {
    if (uInfo.data.tasks)
      uInfo.data.tasks.push("");
    await import_consts.authDB.updateOne({ user: uInfo.data.user, fieldName: "UserData" }, {
      $set: { tasks: uInfo.data.tasks ?? [""] }
    }, { upsert: true });
    return { status: "SUCCESS", data: null, token };
  }
}
async function getTasks(token) {
  let uInfo = await (0, import_userRequest.userRequest)(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  } else {
    return { status: "SUCCESS", data: { tasks: uInfo.data.tasks ?? [] }, token };
  }
}
async function updateTask(token, id, updated) {
  let uInfo = await (0, import_userRequest.userRequest)(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  } else {
    if (uInfo.data.tasks && uInfo.data.tasks.length > id)
      uInfo.data.tasks[id] = updated;
    await import_consts.authDB.updateOne({ user: uInfo.data.user, fieldName: "UserData" }, {
      $set: { tasks: uInfo.data.tasks ?? [] }
    }, { upsert: true });
    return { status: "SUCCESS", data: null, token };
  }
}
async function deleteTask(token, id, completedQ = false) {
  let uInfo = await (0, import_userRequest.userRequest)(token);
  if (uInfo.status != "SUCCESS") {
    return uInfo;
  } else {
    if (uInfo.data.tasks && uInfo.data.tasks.length > id)
      uInfo.data.tasks.splice(id, 1);
    await import_consts.authDB.updateOne({ user: uInfo.data.user, fieldName: "UserData" }, {
      $set: { tasks: uInfo.data.tasks ?? [] },
      $inc: { tasksCompleted: completedQ ? 1 : 0 }
    }, { upsert: true });
    return { status: "SUCCESS", data: null, token };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addTask,
  deleteTask,
  getTasks,
  updateTask
});
//# sourceMappingURL=tasks.js.map
