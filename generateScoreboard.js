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

// Función para copiar los logos a "obs-stream-herramientas" y retornar la ruta relativa
function copyLogo(logoPath, destFolder) {
  if (logoPath && fs.existsSync(logoPath)) {
    const logoName = path.basename(logoPath);
    const destPath = path.join(destFolder, logoName);
    fs.copyFileSync(logoPath, destPath);
    return `./${logoName}`; // Ruta relativa
  }
  return ""; // O una ruta a un logo por defecto
}

module.exports = function generateScoreboard(scoreboardData) {
  try {
    // 1) Obtener la ruta a "Documentos"
    const documentsPath = app.getPath("documents");

    // 2) Crear (si no existe) la carpeta "obs-stream-herramientas" dentro de Documentos
    const templatesFolder = path.join(documentsPath, "obs-stream-herramientas");
    if (!fs.existsSync(templatesFolder)) {
      fs.mkdirSync(templatesFolder, { recursive: true });
    }

    // 3) Definir la ruta final donde se escribirá scoreboard.html
    const outputPath = path.join(templatesFolder, "scoreboard.html");

    // 4) Ruta a la plantilla scoreboardTemplate.html
    const templatePath = path.join(__dirname, "scoreboardTemplate.html");
    // Leer la plantilla
    let template = fs.readFileSync(templatePath, "utf8");

    // 5) Copiar logos a "obs-stream-herramientas" y obtener rutas relativas
    const teamALogoRelative = copyLogo(
      scoreboardData.teamALogo,
      templatesFolder
    );
    const teamBLogoRelative = copyLogo(
      scoreboardData.teamBLogo,
      templatesFolder
    );

    // 6) Reemplazos de placeholders
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

    // Rutas relativas para los logos
    const teamALogoPath = teamALogoRelative || "";
    const teamBLogoPath = teamBLogoRelative || "";

    template = template.replace(/{{teamALogo}}/g, teamALogoPath);
    template = template.replace(/{{teamBLogo}}/g, teamBLogoPath);

    // 7) Escribir el scoreboard.html en la carpeta "obs-stream-herramientas"
    fs.writeFileSync(outputPath, template, "utf8");

    console.log(`scoreboard.html generado en: ${outputPath}`);
  } catch (err) {
    console.error("Error generando scoreboard.html:", err);
  }
};
