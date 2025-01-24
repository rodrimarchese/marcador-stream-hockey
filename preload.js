const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Pedir datos del scoreboard
  getScoreboardData: () => ipcRenderer.invoke("getScoreboardData"),

  // Actualizar datos del scoreboard
  updateScoreboardData: (partialData) =>
    ipcRenderer.send("updateScoreboardData", partialData),

  // Iniciar o Pausar el tiempo
  startStopTimer: (start) => ipcRenderer.send("startStopTimer", start),

  // Ajustar el tiempo (sumar o restar segundos)
  adjustTime: (deltaSeconds) => ipcRenderer.send("adjustTime", deltaSeconds),

  // Escuchar cuando el main notifique que el tiempo cambió
  onTimeUpdated: (callback) => ipcRenderer.on("timeUpdated", callback),

  // Escuchar cuando scoreboardData se actualizó por completo
  onScoreboardUpdated: (callback) =>
    ipcRenderer.on("scoreboardUpdated", callback),

  selectLogoDialog: () => ipcRenderer.invoke("selectLogoDialog"),
});
