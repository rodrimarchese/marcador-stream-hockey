// generateScoreboard.js
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

// Función opcional para formatear el tiempo (mm:ss)
function formatTime(secondsTotal) {
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = secondsTotal % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

module.exports = function generateScoreboard(scoreboardData) {
  try {
    // 1) Obtenemos la ruta a "Documentos"
    const documentsPath = app.getPath("documents");
    // 2) Creamos (si no existe) la carpeta "obsTemplates" dentro de Documentos
    const templatesFolder = path.join(documentsPath, "obsTemplates");
    if (!fs.existsSync(templatesFolder)) {
      fs.mkdirSync(templatesFolder, { recursive: true });
    }

    // 3) Definimos la ruta final donde escribiremos scoreboard.html
    const outputPath = path.join(templatesFolder, "scoreboard.html");

    // 4) Ruta a la plantilla scoreboardTemplate.html
    const templatePath = path.join(__dirname, "scoreboardTemplate.html");
    // Leemos la plantilla
    let template = fs.readFileSync(templatePath, "utf8");

    // 5) Reemplazos de placeholders
    template = template.replace(
      /{{teamAName}}/g,
      scoreboardData.teamAName || ""
    );
    template = template.replace(
      /{{teamBName}}/g,
      scoreboardData.teamBName || ""
    );
    template = template.replace(
      /{{teamAScore}}/g,
      String(scoreboardData.teamAScore)
    );
    template = template.replace(
      /{{teamBScore}}/g,
      String(scoreboardData.teamBScore)
    );
    template = template.replace(/{{quarter}}/g, scoreboardData.quarter);
    template = template.replace(
      /{{time}}/g,
      formatTime(scoreboardData.remainingTime)
    );
    template = template.replace(
      /{{teamALogo}}/g,
      scoreboardData.teamALogo || ""
    );
    template = template.replace(
      /{{teamBLogo}}/g,
      scoreboardData.teamBLogo || ""
    );

    // 6) Escribimos el scoreboard.html en la carpeta "obsTemplates"
    fs.writeFileSync(outputPath, template, "utf8");

    console.log(`scoreboard.html generado en: ${outputPath}`);
  } catch (err) {
    console.error("Error generando scoreboard.html:", err);
  }
};
