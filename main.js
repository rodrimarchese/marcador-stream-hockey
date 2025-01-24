const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const generateScoreboard = require("./generateScoreboard");

// --- DATOS DEL SCOREBOARD ---
// **Observa que 'remainingTime' arranca en 0 para mostrar 00:00.**
let scoreboardData = {
  teamAName: "Equipo A",
  teamBName: "Equipo B",
  teamAScore: 0,
  teamBScore: 0,
  timeRunning: false,
  remainingTime: 0, // Empieza en 00:00
  quarter: "1Q",
  teamALogo: "",
  teamBLogo: "",
};

let mainWindow = null;
let timerInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Panel de Administración - Hockey Scoreboard",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

// Cuando la app esté lista
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cerrar cuando se cierran todas las ventanas
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- Lógica del Timer (Ascendente) ---
function startTimerInterval() {
  if (!timerInterval) {
    timerInterval = setInterval(() => {
      // **Solo incrementa si 'timeRunning' es true.**
      if (scoreboardData.timeRunning) {
        scoreboardData.remainingTime += 1; // ← Suma 1s cada segundo
        generateScoreboard(scoreboardData);

        // Notificar al renderer (panel) para actualizar su display
        if (mainWindow) {
          mainWindow.webContents.send(
            "timeUpdated",
            scoreboardData.remainingTime
          );
        }
      }
    }, 1000);
  }
}

// --- Handlers IPC ---
ipcMain.handle("getScoreboardData", async () => {
  return scoreboardData;
});

ipcMain.handle("selectLogoDialog", async () => {
  // Abre un diálogo para seleccionar una imagen
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Seleccionar Logo",
    properties: ["openFile"],
    filters: [
      { name: "Imágenes", extensions: ["png", "jpg", "jpeg", "gif", "bmp"] },
    ],
  });
  if (!canceled && filePaths.length > 0) {
    return filePaths[0]; // Ruta local absoluta
  }
  return null;
});

ipcMain.on("updateScoreboardData", (event, partialData) => {
  // Mezclamos la data existente con la nueva
  console.log("RECIBIENDO partialData:", partialData);

  scoreboardData = { ...scoreboardData, ...partialData };
  // Actualizamos scoreboard.html
  generateScoreboard(scoreboardData);

  // Enviamos la data actualizada de vuelta al renderer (opcional)
  event.reply("scoreboardUpdated", scoreboardData);
});

ipcMain.on("startStopTimer", (event, shouldStart) => {
  scoreboardData.timeRunning = shouldStart;
  startTimerInterval();
});

ipcMain.on("adjustTime", (event, deltaSeconds) => {
  scoreboardData.remainingTime += deltaSeconds;
  if (scoreboardData.remainingTime < 0) {
    scoreboardData.remainingTime = 0;
  }
  generateScoreboard(scoreboardData);
  if (mainWindow) {
    mainWindow.webContents.send("timeUpdated", scoreboardData.remainingTime);
  }
});
