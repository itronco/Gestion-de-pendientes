# CLAUDE.md — Asistente de Pendientes (BBO)

Contexto del proyecto para Claude Code. Leer esto antes de cualquier tarea.

## Qué es este proyecto

Sistema personal de gestión de tareas/pendientes de trabajo para un ejecutivo de BBO (Bolivia).
El objetivo es capturar, organizar y consultar pendientes en **lenguaje natural**, integrado con
las apps que ya se usan (WhatsApp principalmente), con IA para interpretar y resumir.

Principio de diseño rector: **interfaz conversacional, no formularios**. Infraestructura
**liviana y de bajo costo**. Las decisiones de arquitectura se toman con pros/cons explícitos.
Idioma de trabajo y de las respuestas del asistente: **español**.

## Arquitectura (4 capas)

1. **Canales** — WhatsApp (principal), con la app de Claude / Telegram como complementos.
2. **Orquestador** — n8n en un VPS (~$5–10/mes). Es el cerebro: recibe, decide, llama a la IA, mueve datos.
3. **IA** — Claude API: interpreta lenguaje natural, infiere categoría/prioridad/tiempo, calcula
   fechas desde HOY, redacta resúmenes y responde consultas.
4. **Datos** — Google Sheet (tab `TAREAS`) + webhook de Google Apps Script ya existente.

## Modelo de números de WhatsApp (decisión tomada)

Tres roles, tres números distintos:

- **Número personal chileno (+56)** → el usuario. Desde acá le escribe comandos al bot.
  Es el ÚNICO número con permiso de respuesta del asistente (lista blanca).
- **Número corporativo boliviano (+591)** → el bot/asistente, vía **Coexistencia** (Cloud API
  oficial + WhatsApp Business app en simultáneo). Sigue siendo la línea de trabajo real.
- El asistente conversa: el usuario escribe desde el +56 al +591; n8n recibe vía webhook,
  procesa y responde del +591 al +56.

Restricción de seguridad CRÍTICA (porque el inbox corporativo entero pasa por el webhook):

- **Lista blanca dura**: n8n solo procesa y responde mensajes provenientes del +56.
- Mensajes de cualquier otro remitente (contactos reales) → **descartar sin guardar ni enviar a Claude**.
- El bot NUNCA debe auto-responder a un contacto corporativo real.
- Confirmar políticas de datos de BBO antes de conectar el número corporativo.

Notas Coexistencia: requiere BSP con Embedded Signup (ej. 360dialog); verificar elegibilidad de +591;
desactiva integraciones no oficiales; WhatsApp Web/Mac se desvinculan en el onboarding (re-vincular después).

## Categorías de tareas

`Directorio`, `Finanzas`, `Legal`, `RRHH`, `Abastecimiento`, `TI`.

## Esquema del Sheet (tab `TAREAS`)

Columnas: `ID`, `Titulo`, `Estado`, `Prioridad`, `Categoria`, `Fecha_Limite`, `Tiempo_min`, `Notas`.

Endpoints (rellenar con los valores reales; NO commitear secretos):
- Lectura: URL CSV publicada (`<SHEET_CSV_URL>`). También existe patrón `gviz/tq`.
- Escritura: webhook de Apps Script (`<APPS_SCRIPT_WEBHOOK_URL>`), acciones `add` y `update`.

## Aprendizajes técnicos a respetar

- **Apps Script webhook**: recibe con `Content-Type: text/plain` (por CORS + fetch `no-cors`).
  `doPost` lee el cuerpo como `e.postData ? e.postData.contents : JSON.stringify(e.parameter)`.
  Cada cambio de código requiere desplegar una versión nueva; la URL del webhook no cambia.
- **Fechas**: parsear `Fecha_Limite` con `new Date(v + "T12:00:00")` para evitar el off-by-one
  por zona horaria.
- **Sheet publishing**: el endpoint `gviz/tq` necesita "Publicar en la web"; la URL CSV publicada
  funciona sin eso.
- **Claude API desde artifacts**: llamar la API directo desde un artifact de Claude falla por CORS;
  la lógica de IA va server-side (n8n) o con otro patrón de fetch.
- "Hoy" siempre se calcula desde la fecha real al interpretar tareas.

## Estructura de carpetas sugerida

```
/panel        — app React (index.html, vía CDN, sin build step). Deploy en Vercel.
/n8n          — workflows exportados como JSON (versionados).
/apps-script  — código del webhook (mantener con clasp si se quiere).
/prompts      — prompt de sistema de Claude para interpretar tareas.
/infra        — docker-compose de n8n + reverse proxy para el VPS.
/docs         — arquitectura, hojas de ruta, decisiones.
```

## Fases de construcción (orden)

1. Cerrar deploy del panel React en Vercel (estaba en el paso de subir el archivo al repo).
2. Escribir + probar el prompt de interpretación (mensaje natural → fila estructurada del Sheet).
3. Workflow base de n8n: ingreso de tarea → Claude → escribe en Sheet → confirma estructura.
4. docker-compose para levantar n8n en el VPS.
5. Conectar WhatsApp (Coexistencia) — último paso, después de probar el cerebro con el +56.
6. Resumen matutino (cron 7:00) + alertas de vencimiento. Ojo ventana 24h → plantilla de utilidad.

## Funcionalidades en el horizonte

Captura por voz, foto de acta/pizarra → tareas, briefing pre-reunión, seguimiento de
delegaciones, tareas estancadas, snooze, búsqueda semántica, borradores desde una tarea,
time-blocking con Google Calendar, resumen ejecutivo semanal.

## Cómo trabajar en este repo

- Preferir soluciones simples y de bajo overhead; evitar tooling de build innecesario.
- Antes de cambios difíciles de revertir, plantear pros/cons.
- No commitear tokens, URLs con secretos ni credenciales. Usar variables de entorno / `.env` (gitignored).
- Responder en español.
