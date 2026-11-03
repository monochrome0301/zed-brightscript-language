# Matriz de paridad frente a `vscode-brightscript-language`

Estados: **nativo** (funciona en Zed), **emulado** (funciona con una estrategia
distinta a la de VS Code), **no soportado** (documentado, sin fingir).

| Feature VS Code | Estado en Zed | Cómo se consigue |
|---|---|---|
| Syntax highlighting BrightScript | nativo | `grammars/tree-sitter-brightscript` (vendida y extendida) + queries |
| Syntax highlighting BrighterScript (`.bs`) | nativo | `grammars/tree-sitter-brighterscript` (propia; no existía ninguna) + queries |
| XML SceneGraph + CDATA + `text/brighterscript` | nativo | lenguaje `SceneGraph XML` (gramática `roku_xml`) + `injections.scm` |
| Outline / symbol navigation | nativo | `outline.scm` (subs/funciones, clases, interfaces, enums, namespaces, `#const`) |
| Transpilación `.bs` → `.brs` | nativo | CLI `roku-zed transpile` (BrighterScript `ProgramBuilder`) → `/roku-transpile` |
| Formatting | emulado | `textDocument/formatting` del LSP de BrighterScript (el servidor lo expone; Zed lo aplica) |
| Diagnostics, hover, completion, go-to-def, rename, references | nativo | LSP `brighterscript` (`bsc --lsp`), registrado en `extension.toml` |
| Diagnósticos de `bslint` (opcional) | emulado | `/roku-lint` ejecuta `@rokucommunity/bslint` vía el CLI cuando el proyecto lo declara |
| Autocompletado de APIs Roku (`.d.bs`) | nativo | LSP + `roku-types` (instalable con `/roku-types`) |
| Snippets | nativo | `snippets/brightscript.json` registrado en `extension.toml` |
| Tasks (build, package, sideload, deploy) | emulado | slash commands `/roku-*` + tareas `roku: *` en `.zed/tasks.json` generadas por `/roku-init` |
| Device discovery (ECP/mDNS, SSDP) | emulado | `/roku-discover` → `roku-zed discover` (SSDP `roku:ecp` + ECP device-info) |
| Sideload a dispositivo | emulado | `/roku-sideload` → `roku-zed sideload` (roku-deploy: publish + launch) |
| Device logs + interactive console | emulado | `/roku-logs` captura acotada; tarea `roku: logs` streamea en una terminal de Zed (8085/8080) |
| Debugging con breakpoints / variable inspection | emulado | DAP de Zed + `get_dap_binary` → `roku-debug --dap` (stdio) + sourceMaps de `.bs` |
| Remote control emulation | emulado | `/roku-key <tecla>` → ECP `POST /keypress/<tecla>` |
| Deeplinks | emulado | `/roku-deeplink <url>` → ECP `POST /launch/<app>?...` |
| Rendezvous tracking | emulado | `roku-zed logs` contra el puerto rendezvous 8085 (see `docs/DEBUGGING.md`) |
| `bs_const` desde configuración | emulado | campo `bsConst` en `.zed/debug.json` (esquema DAP) |
| Component libraries | emulado | `componentLibrariesPort`/config en el escenario DAP; stage de librerías vía `files` de bsconfig |
| Visualización de árbol de SceneGraph | no soportado | Zed no expone webviews/tree views a extensiones; alternativa: abrir el `.xml` (highlight + outline de tags) |
| Remote control visual (panel de mando) | no soportado | sin webviews; usar `/roku-key` textual |
| Formulario de device selection en UI | emulado | el CLI lista dispositivos (`/roku-discover`) y el host se pasa por flag/env |
| Hot reload / auto re-deploy on save | no soportado | Zed no permite interceptar el guardado desde una extensión; alternativa: tarea `roku: deploy` reejecutada manualmente o desde CI |

Notas honestas:

- **Debug**: el escenario se resuelve y arranca vía `get_dap_binary`; la
  resolución de breakpoints sobre `.bs` depende de los source maps que
  BrighterScript genera (`sourceMap: true`) y de que roku-debug los aplique.
  El flujo completo (build → sideload → attach → breakpoint en `.bs`) no se ha
  validado contra hardware real en este repositorio; ver `docs/DEBUGGING.md`.
- **Settings por usuario del LSP**: `zed_extension_api` 0.7.0 no expone lectura
  de settings; la configuración del LSP es fija (secciones `brightscript`,
  `files`, `search` con defaults del propio servidor). El comportamiento real
  del LSP se controla con `bsconfig.json`, que el servidor lee de disco.
- **`/roku-logs`**: la API de slash commands devuelve la salida cuando el
  proceso termina, así que el comando hace una captura acotada; el streaming
  real ocurre en la tarea de terminal `roku: logs`.
