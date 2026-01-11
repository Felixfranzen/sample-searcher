"use strict";
const electron = require("electron");
var APIEvent = /* @__PURE__ */ ((APIEvent2) => {
  APIEvent2["OPEN_SELECT_FILE_DIALOG"] = "OPEN_SELECT_FILE_DIALOG";
  APIEvent2["START_ANALYSIS"] = "START_ANALYSIS";
  APIEvent2["ANALYSIS_PROGRESS"] = "ANALYSIS_PROGRESS";
  APIEvent2["SEARCH"] = "SEARCH";
  APIEvent2["DELETE_DIRECTORY"] = "DELETE_DIRECTORY";
  return APIEvent2;
})(APIEvent || {});
const api = {
  openSelectFileDialog: async () => electron.ipcRenderer.invoke(APIEvent.OPEN_SELECT_FILE_DIALOG),
  startAnalysis: async (path) => electron.ipcRenderer.invoke(APIEvent.START_ANALYSIS, path),
  onAnalysisProgress: (callback) => {
    electron.ipcRenderer.on(APIEvent.ANALYSIS_PROGRESS, (_, progress) => {
      callback(progress);
    });
  },
  search: async (query, resultsCount = 10) => electron.ipcRenderer.invoke(APIEvent.SEARCH, query, resultsCount),
  deleteDirectory: (directoryId) => electron.ipcRenderer.invoke(APIEvent.DELETE_DIRECTORY, directoryId)
};
electron.contextBridge.exposeInMainWorld("api", api);
