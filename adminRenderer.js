const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getScoreboardData: () => ipcRenderer.invoke("getScoreboardData"),
  updateScoreboardData: (data) =>
    ipcRenderer.send("updateScoreboardData", data),
  startStopTimer: (start) => ipcRenderer.send("startStopTimer", start),
  adjustTime: (deltaSeconds) => ipcRenderer.send("adjustTime", deltaSeconds),
});

window.addEventListener("DOMContentLoaded", async () => {
  const teamANameInput = document.getElementById("teamAName");
  const teamALogoInput = document.getElementById("teamALogo");
  const teamBNameInput = document.getElementById("teamBName");
  const teamBLogoInput = document.getElementById("teamBLogo");

  const teamAScoreMinusBtn = document.getElementById("teamAScoreMinus");
  const teamAScoreValue = document.getElementById("teamAScoreValue");
  const teamAScorePlusBtn = document.getElementById("teamAScorePlus");
  const teamBScoreMinusBtn = document.getElementById("teamBScoreMinus");
  const teamBScoreValue = document.getElementById("teamBScoreValue");
  const teamBScorePlusBtn = document.getElementById("teamBScorePlus");

  const quarterSelect = document.getElementById("quarterSelect");

  const timeDisplay = document.getElementById("timeDisplay");
  const startStopTimeBtn = document.getElementById("startStopTimeBtn");
  const back10sBtn = document.getElementById("back10sBtn");
  const forward10sBtn = document.getElementById("forward10sBtn");
  const back1mBtn = document.getElementById("back1mBtn");
  const forward1mBtn = document.getElementById("forward1mBtn");
  const customTimeInput = document.getElementById("customTime");
  const setTimeBtn = document.getElementById("setTimeBtn");

  // Cargar datos iniciales
  let scoreboardData = await window.electronAPI.getScoreboardData();

  // Mostrar valores iniciales en UI
  teamANameInput.value = scoreboardData.teamAName;
  teamBNameInput.value = scoreboardData.teamBName;
  teamAScoreValue.textContent = scoreboardData.teamAScore;
  teamBScoreValue.textContent = scoreboardData.teamBScore;
  quarterSelect.value = scoreboardData.quarter;
  timeDisplay.textContent = formatTime(scoreboardData.remainingTime);

  // Handlers de equipo y marcador
  teamANameInput.addEventListener("change", () => {
    updateData({ teamAName: teamANameInput.value });
  });
  teamALogoInput.addEventListener("change", () => {
    if (teamALogoInput.files && teamALogoInput.files[0]) {
      updateData({ teamALogo: teamALogoInput.files[0].path });
    }
  });
  teamBNameInput.addEventListener("change", () => {
    updateData({ teamBName: teamBNameInput.value });
  });
  teamBLogoInput.addEventListener("change", () => {
    if (teamBLogoInput.files && teamBLogoInput.files[0]) {
      updateData({ teamBLogo: teamBLogoInput.files[0].path });
    }
  });

  teamAScoreMinusBtn.addEventListener("click", () => {
    updateData({ teamAScore: scoreboardData.teamAScore - 1 });
  });
  teamAScorePlusBtn.addEventListener("click", () => {
    updateData({ teamAScore: scoreboardData.teamAScore + 1 });
  });
  teamBScoreMinusBtn.addEventListener("click", () => {
    updateData({ teamBScore: scoreboardData.teamBScore - 1 });
  });
  teamBScorePlusBtn.addEventListener("click", () => {
    updateData({ teamBScore: scoreboardData.teamBScore + 1 });
  });

  quarterSelect.addEventListener("change", () => {
    updateData({ quarter: quarterSelect.value });
  });

  // Temporizador
  startStopTimeBtn.addEventListener("click", () => {
    const start = !scoreboardData.timeRunning;
    window.electronAPI.startStopTimer(start);
    scoreboardData.timeRunning = start;
    startStopTimeBtn.textContent = start ? "Pausar" : "Iniciar";
  });

  back10sBtn.addEventListener("click", () => {
    window.electronAPI.adjustTime(-10);
  });
  forward10sBtn.addEventListener("click", () => {
    window.electronAPI.adjustTime(10);
  });
  back1mBtn.addEventListener("click", () => {
    window.electronAPI.adjustTime(-60);
  });
  forward1mBtn.addEventListener("click", () => {
    window.electronAPI.adjustTime(60);
  });

  setTimeBtn.addEventListener("click", () => {
    // Esperamos mm:ss
    const parts = customTimeInput.value.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const totalSeconds = minutes * 60 + seconds;
      // Ajustamos scoreboardData directamente
      updateData({ remainingTime: totalSeconds });
    }
  });

  // Recibir notificaciones de tiempo actualizado desde el main
  ipcRenderer.on("timeUpdated", (event, newTime) => {
    scoreboardData.remainingTime = newTime;
    timeDisplay.textContent = formatTime(scoreboardData.remainingTime);
  });

  // Recibir confirmación de scoreboardUpdated y sincronizar scoreboardData local
  ipcRenderer.on("scoreboardUpdated", (event, updatedData) => {
    scoreboardData = updatedData;
    // Refrescar UI si es necesario
    teamAScoreValue.textContent = scoreboardData.teamAScore;
    teamBScoreValue.textContent = scoreboardData.teamBScore;
    timeDisplay.textContent = formatTime(scoreboardData.remainingTime);
  });

  // Función para mandar data actualizada al main
  function updateData(partialData) {
    scoreboardData = { ...scoreboardData, ...partialData };
    window.electronAPI.updateScoreboardData(partialData);
    // Actualizamos la UI inmediatamente
    if (partialData.teamAScore !== undefined) {
      teamAScoreValue.textContent = scoreboardData.teamAScore;
    }
    if (partialData.teamBScore !== undefined) {
      teamBScoreValue.textContent = scoreboardData.teamBScore;
    }
    if (partialData.remainingTime !== undefined) {
      timeDisplay.textContent = formatTime(scoreboardData.remainingTime);
    }
    if (partialData.quarter !== undefined) {
      quarterSelect.value = scoreboardData.quarter;
    }
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }
});
