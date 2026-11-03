# zed-brightscript-language

Soporte de **BrightScript** y **BrighterScript** para [Zed](https://zed.dev):
resaltado tree-sitter, el language server de BrighterScript, y un pipeline
completo de Roku — **transpilar, empaquetar y sideloadear desde Zed, sin abrir
VS Code ni una terminal externa**.

Port de [`RokuCommunity/vscode-brightscript-language`](https://github.com/RokuCommunity/vscode-brightscript-language)
dentro de los límites de la plataforma de extensiones de Zed.

> 🇬🇧 English documentation available in [README.md](README.md).

## Instalación

Ver [docs/INSTALL.md](docs/INSTALL.md). Resumen:

```sh
node scripts/prepare-dev.mjs   # prepara las gramáticas locales para git fetch
# En Zed: Extensions > Install Dev Extension > este directorio
```

## Qué incluye

| Área | Detalle |
|---|---|
| Resaltado | Gramáticas tree-sitter vendidas y extendidas: BrightScript (`.brs`), BrighterScript (`.bs`, `.d.bs`), XML SceneGraph (`.xml`) con inyecciones para `text/brightscript`, `text/brighterscript` y CDATA |
| Lenguaje | LSP `brighterscript` (`bsc --lsp`): diagnósticos, hover, completion, go-to-def, rename, references, folding, format — para `.brs` **y** `.bs` |
| Outline | `outline.scm` jerárquico: subs/funciones, clases, interfaces, enums, namespaces, `#const` |
| Build | CLI `roku-zed` (Node) que reutiliza **BrighterScript** y **roku-deploy**: `transpile`, `build`, `package`, `sideload`, `deploy`, `discover`, `logs`, `lint`, `types`, `init`, `key`, `deeplink` |
| Slash commands | `/roku-transpile`, `/roku-build`, `/roku-package`, `/roku-sideload`, `/roku-deploy`, `/roku-discover`, `/roku-logs`, `/roku-lint`, `/roku-types`, `/roku-init`, `/roku-key`, `/roku-deeplink` |
| Tareas | `/roku-init` genera `.zed/tasks.json` (`roku: transpile/build/package/sideload/deploy/lint/logs/types`), `.zed/debug.json` y `.zed/settings.json` |
| Debug | Adaptador DAP `roku-debug --dap` (stdio) con `sourceMaps: true` — breakpoints sobre los `.bs` originales |
| Snippets | `snippets/brightscript.json` (subs, funciones, clases, interfaces, enums, namespaces, template strings) |

## BrighterScript first-class

- Dos lenguajes registrados (`brightscript`, `brighter-script`) con gramáticas
  tree-sitter propias; la de BrighterScript no existía y se escribió para este
  proyecto (clases, interfaces, enums, namespaces, `import`, `const`, `throw`,
  anotaciones `@`, template strings, `??`/`?.`/ternario, tipos con `?`/`!`/`|`,
  tipos `function`).
- El build **verifica** que el zip enviado al Roku contiene BrightScript y
  nunca `.bs` (falla si algún `.bs` sobrevive) e incluye sourcemaps.
- `bsconfig.json` se valida con error de fichero/línea/columna; `extends`,
  `plugins` y el resto los resuelve BrighterScript dentro del pipeline.
- El zip solo se firma (`roku-zed package`) si hay `signingPassword`.

## Comandos principales

En la paleta del assistant panel de Zed:

```text
/roku-discover            # lista dispositivos (SSDP + ECP: IP, modelo, estado)
/roku-build               # transpila (si aplica) + stage + zip en out/
/roku-deploy              # build + sideload + launch
/roku-logs                # captura de logs del dispositivo (ECP console)
```

O bien usa las tareas `roku: build` / `roku: deploy` / `roku: logs` de la
paleta de tareas (`task: spawn`), generadas por `/roku-init`.

## Matriz de paridad

[docs/PARITY.md](docs/PARITY.md) cubre feature a feature frente a la extensión
de VS Code, con estado honesto (`nativo` / `emulado` / `no soportado`) y cómo
se consigue cada uno.

## Las tres limitaciones principales

1. **Sin UI propia**: Zed no expone webviews/panels a extensiones — el
   discovery, remote control y device list son textuales (slash commands) y
   los logs vivos van a una terminal de Zed. Ver [docs/PARITY.md](docs/PARITY.md).
2. **Sin settings de usuario para el LSP** en `zed_extension_api` 0.7.0: la
   configuración fina se hace con `bsconfig.json` (que el LSP lee de disco).
3. **Debug no validado contra hardware real**: el adaptador y la resolución
   de binarios están implementados y tipados, pero el flujo end-to-end con
   breakpoints sobre `.bs` no se pudo probar sin dispositivo en red. Ver
   [docs/DEBUGGING.md](docs/DEBUGGING.md).

## Estructura

```text
├── extension.toml           # manifest de la extensión
├── src/                     # crate WASM (LSP, DAP, slash commands)
├── grammars/                # tree-sitter vendidas + extendidas
├── languages/               # config.toml + queries por lenguaje
├── cli/                     # roku-zed (Node/TS): pipeline Roku completo
├── snippets/                # snippets de BrightScript/BrighterScript
├── debug_schemas/           # esquema del escenario DAP
├── examples/                # brightscript-basic y brighterscript-advanced
├── scripts/prepare-dev.mjs  # gramáticas locales -> file:// para Zed
└── docs/                    # PARITY, GRAMMARS, BRIGHTERSCRIPT, DEBUGGING,
                             # INSTALL, LIMITATIONS, TROUBLESHOOTING, RESEARCH
```

## Desarrollo

```sh
# extensión (WASM)
cargo build --target wasm32-wasip2 --release
# en Windows sin MSVC:
cargo +stable-x86_64-pc-windows-gnu build --target wasm32-wasip2 --release

# gramáticas
cd grammars/tree-sitter-brightscript && tree-sitter generate && tree-sitter test

# CLI + smoke tests de los ejemplos
cd cli && npm install && npm run build && npm test
```

CI en [.github/workflows/ci.yml](.github/workflows/ci.yml): `cargo fmt
--check`, `cargo clippy -D warnings`, build WASM, corpus de las tres
gramáticas y smoke tests del CLI contra los dos ejemplos.

## Contribuir

- Los PRs deben dejar el repo compilando (`cargo build`, `npm test`).
- Toda feature nueva de lenguaje se prueba primero con `.bs` (BrighterScript
  no es opcional: es el caso principal).
- Lee [docs/RESEARCH.md](docs/RESEARCH.md) antes de tocar gramáticas o APIs
  de Zed — documenta las trampas verificadas.

## Licencia

MIT
