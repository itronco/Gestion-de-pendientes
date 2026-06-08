const SHEET_NAME = "TAREAS";
const SPREADSHEET_ID = "18egARosb15csJ41UPPgic5-VN999pY0dnyGcRdmxWUA";

function doPost(e) {
  try {
    const contenido = e.postData ? e.postData.contents : JSON.stringify(e.parameter);
    const tarea = JSON.parse(contenido);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName(SHEET_NAME);

    // Generar ID único
    const ultimaFila = hoja.getLastRow();
    const nuevoID = "T" + String(ultimaFila).padStart(3, "0");

    // Agregar fila
    hoja.appendRow([
      nuevoID,
      tarea.Titulo || "",
      tarea.Estado || "Pendiente",
      tarea.Prioridad || "Media",
      tarea.Categoria || "",
      tarea.Fecha_Limite || "",
      tarea.Tiempo_min || "",
      tarea.Notas || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: nuevoID }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
