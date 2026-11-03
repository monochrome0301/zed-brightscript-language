# RESEARCH — decisiones y APIs verificadas

Escrito al final del trabajo, como registro de lo aprendido. Todo lo que hay
aquí se verificó contra el código fuente de Zed / la API en el momento de
usarlo.

## zed_extension_api 0.7.0

- **Trait `Extension`**: solo `new()` es obligatorio; 18 métodos con default,
  entre ellos `language_server_command`,
  `language_server_workspace_configuration`, `run_slash_command`,
  `get_dap_binary`, `dap_request_kind`, `dap_config_to_scenario`.
- **Slash commands**: se declaran en `extension.toml` como
  `[slash_commands.<name>]` con `description` y `requires_argument`
  (`SlashCommandManifestEntry` en `crates/extension/src/extension_manifest.rs`).
  `SlashCommandOutput { text, sections: Vec<SlashCommandOutputSection> }`,
  y los `Range` de sección son `u32`.
- **`Command`** (procesos): `{ command, args, env }` + `.output()` — **sin
  `cwd`**. Por eso el CLI recibe `--cwd`.
- **`Worktree`**: `id`, `root_path`, `read_text_file`, `which`, `shell_env`.
  Es la única vía de I/O (no hay escritura de ficheros en el worktree).
- **`current_platform()`** → `(Os, Architecture)`; las variantes de `Os` son
  `Linux | Mac | Windows` (¡`Mac`, no `MacOs`!).
- **`DebugAdapterBinary`** requiere `request_args:
  StartDebuggingRequestArguments` (no es `Option`).
- `extension.toml`: `schema_version = 1` es el valor actual
  (`SchemaVersion::CURRENT`).

## Cómo Zed sirve la configuración del LSP

`crates/project/src/lsp_store.rs` (WorkspaceConfiguration handler): para cada
item con `section`, Zed hace `workspace_config.get(section)` sobre el valor
devuelto por `language_server_workspace_configuration`. El LSP de
BrighterScript pide las secciones `brightscript`, `files` y `search`
(`LanguageServer.ts` línea ~932), así que la config debe ser un objeto con
esas claves de primer nivel.

## Cómo Zed compila y carga las gramáticas

`crates/extension/src/extension_builder.rs`:

1. `checkout_repo(dir, repository, rev)`: `git init` + `remote add origin` +
   `fetch --depth 1 origin <rev>` + `checkout <rev>`. → El `repository` debe
   ser un repositorio git accesible (una URL `file://` **absoluta** funciona;
   una relativa no: git la rechaza) y el directorio de la gramática **no**
   puede ser un subdirectorio de otro repo sin ser repo él mismo.
2. Compila con `clang -Wl,--export=tree_sitter_<clave>` → el símbolo exportado
   se deriva de la **clave** del manifest (por eso las claves no pueden tener
   guiones).
3. En runtime, `crates/language/src/language_registry.rs` carga el wasm con
   `store.load_language(<file_stem>, bytes)` y `lib/src/wasm_store.c` busca
   `tree_sitter_<file_stem>` exacto (sin normalizar guiones).

## tree-sitter 0.27

- `alias($._x, $.variable)` con `variable` en `supertypes` → error
  "Named alias conflicts with a supertype" (más estricto que versiones
  anteriores).
- Los nombres de gramática no admiten guiones (`must not contain non-word
  characters`).
- `conflicts` es una lista de **listas** de reglas.
- Las reglas `inline` y las ocultas (`_x`) no se pueden referenciar en
  queries; los literales que son cuerpo único de una regla (`stop: () =>
  'stop'`) se convierten en nodos nombrados, no tokens anónimos.
- Los campos declarados en reglas ocultas no son consultables por `field:`
  en la query (p. ej. `method:` del method-call): se empareja con el token
  anónimo `":"` + hermano.

## roku tooling (npm)

- `brighterscript@0.73.8`: LSP = `bsc --lsp`; el transpilador es
  `ProgramBuilder.run({...bsconfig, createPackage})`. `getOutDir` deriva el
  directorio de salida de un `outFile` **absoluto**; `zipPackage` recibe
  `outFile: path.basename(...)`.
- `roku-deploy@3.18.4`: `createPackage(options)` no devuelve la ruta (usar
  `getOutputZipFilePath(options)`); `publish(options)` sube un zip existente;
  `deploy()` hace stage desde `rootDir` (sin transpilar) — por eso el
  sideload de proyectos BS pasa por BrighterScript antes.
- `roku-debug@0.24.7`: `roku-debug --dap` corre el DAP sobre stdio.
- El paquete npm llamado `bslint` NO es el de Roku (es "zero-dependency
  eslint"); el real es `@rokucommunity/bslint`.
- `brighterscript` expone el LSP en la sección `brightscript` de
  configuración (heredado del nombre del paquete hermano de VS Code).

## Entorno de desarrollo detectado

- Windows 10/11 sin MSVC: `link.exe` resuelve al `link` de Git Bash y rompe
  la compilación de build-scripts del host. Solución: toolchain
  `stable-x86_64-pc-windows-gnu` (ya instalado) para compilar el crate WASM:
  `cargo +stable-x86_64-pc-windows-gnu build --target wasm32-wasip2 --release`.
- Sin compilador C para los corpus de tree-sitter: WinLibs
  (`BrechtSanders.WinLibs.POSIX.UCRT` vía winget) aporta `gcc`; se exporta
  `CC` apuntando a su `gcc.exe`.
- El CLI de `zed.exe` en Windows no expone subcomandos de extensiones
  (`zed extension package` no existe aquí); el empaquetado real queda para
  entornos macOS/Linux o el flujo de dev-install.
