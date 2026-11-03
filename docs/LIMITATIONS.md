# Limitaciones conocidas

Cada entrada explica el límite y la alternativa concreta.

## Gramáticas

- **Keywords sensibles a mayúsculas/minúsculas**: la gramática solo reconoce
  keywords en minúsculas (`sub`, `end sub`). BrightScript real es
  case-insensitive y el código heredado con `SUB ... END SUB` no parseará.
  *Alternativa*: escribir keywords en minúsculas (convención dominante en
  Roku y obligatoria de facto en BrighterScript). Parche bienvenue: convertir
  los literales de keyword a regex case-insensitive en `grammar.js`.
- **Labels `goto`**: implementados como `identifier:`, con conflicto GLR
  declarado; en casos raros un `label:` puede parsear como parte de una
  expresión. Los tests del corpus cubren el uso normal.
- **`++`/`--`**: no están en la gramática ni confirmados en BrighterScript
  actual; si tu proyecto los usa, transpilará igualmente pero el resaltado
  degradará en esa línea.

## Extensiones de Zed (plataforma)

- **Sin UI propia**: una extensión no puede renderizar webviews, paneles ni
  tree views. → Remote control textual (`/roku-key`), device list textual
  (`/roku-discover`); el árbol SceneGraph se navega abriendo el `.xml`.
- **Sin interceptar guardado**: no hay hot-redeploy al guardar. → tarea
  `roku: deploy` ejecutada manualmente o desde terminal.
- **Sin lectura de settings de usuario** (`zed_extension_api` 0.7.0 no
  expone el módulo `settings`, disponible solo en 0.8 no publicado): la
  configuración del LSP que sirve la extensión es fija (secciones
  `brightscript`/`files`/`search` vacías → defaults del servidor).
  *Alternativa*: todo lo relevante se controla con `bsconfig.json`, que el
  LSP lee de disco directamente.
- **Slash commands sin streaming**: `run_slash_command` devuelve la salida al
  terminar el proceso. → `/roku-logs` es captura acotada; el streaming real
  está en la tarea `roku: logs` de `.zed/tasks.json`.
- **`Command` sin `cwd`**: la API de procesos de la extensión no permite
  fijar el directorio de trabajo. → el CLI recibe `--cwd <worktree root>` y
  resuelve todas las rutas relativas contra él.
- **Gramáticas locales necesitan repos git + URL absoluta**: Zed hace
  `git fetch` del `repository` de cada gramática. → `scripts/prepare-dev.mjs`
  materializa repos y reescribe `extension.toml` (ver `docs/INSTALL.md`).
- **Clave de gramática sin guiones**: el símbolo wasm exportado se deriva de
  la clave (`tree_sitter_<clave>`), y los guiones no son válidos en
  identificadores C. → clave `brighterscript`, lenguaje `brighter-script`.

## CLI / dispositivo

- **Firma (`roku-zed package`)**: necesita `signingPassword` y un dispositivo
  accesible para el rekey. Sin contraseña, el build produce zip sin firmar.
- **Sourcemaps y breakpoints**: validación pendiente contra hardware real
  (no había dispositivo en la red de desarrollo). Ver `docs/DEBUGGING.md`.
- **`roku-zed logs` en dispositivos muy nuevos**: el puerto de consola varía
  según firmware; el CLI prueba 8085 (rendezvous/debug) y 8080 (telnet
  clásico). Si tu firmware desactiva ambos, no hay consola remota.

## Tooling de desarrollo (Windows sin MSVC)

- `cargo build --target wasm32-wasip2` compila build-scripts para el host, lo
  que en este equipo requiere el toolchain GNU:
  `cargo +stable-x86_64-pc-windows-gnu build --target wasm32-wasip2 --release`
  (en Linux/macOS o con VS Build Tools instalado no hace falta el `+`).
- Los corpus de tree-sitter necesitan compilador C; en Windows sin MSVC se
  usó WinLibs (`winget install BrechtSanders.WinLibs.POSIX.UCRT`).
