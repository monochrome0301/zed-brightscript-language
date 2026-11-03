# zed-brightscript-language

**BrightScript** and **BrighterScript** support for [Zed](https://zed.dev):
tree-sitter highlighting, the BrighterScript language server, and a full Roku
pipeline — **transpile, package and sideload straight from Zed, without
opening VS Code or an external terminal**.

A port of [`RokuCommunity/vscode-brightscript-language`](https://github.com/RokuCommunity/vscode-brightscript-language)
within the limits of Zed's extension platform.

> 🇪🇸 Documentación también disponible en [español](README.es.md).

## Installation

See [docs/INSTALL.md](docs/INSTALL.md). Summary:

```sh
node scripts/prepare-dev.mjs   # prepares the vendored grammars for git fetch
# In Zed: Extensions > Install Dev Extension > pick this directory
```

## What's included

| Area | Detail |
|---|---|
| Highlighting | Vendored and extended tree-sitter grammars: BrightScript (`.brs`), BrighterScript (`.bs`, `.d.bs`), SceneGraph XML (`.xml`) with injections for `text/brightscript`, `text/brighterscript` and CDATA |
| Language | `brighterscript` LSP (`bsc --lsp`): diagnostics, hover, completion, go-to-def, rename, references, folding, formatting — for both `.brs` **and** `.bs` |
| Outline | Hierarchical `outline.scm`: subs/functions, classes, interfaces, enums, namespaces, `#const` |
| Build | `roku-zed` CLI (Node) reusing **BrighterScript** and **roku-deploy**: `transpile`, `build`, `package`, `sideload`, `deploy`, `discover`, `logs`, `lint`, `types`, `init`, `key`, `deeplink`. When the project defines npm build scripts (`build:dev` / `build` / `build:prod`), `build` and `package` delegate to them — reproducing exactly the project's own build (custom bs-plugins, monorepo chains). `--no-npm` forces the builtin pipeline |
| Slash commands | `/roku-transpile`, `/roku-build`, `/roku-package`, `/roku-sideload`, `/roku-deploy`, `/roku-discover`, `/roku-logs`, `/roku-lint`, `/roku-types`, `/roku-init`, `/roku-key`, `/roku-deeplink` |
| Tasks | Built-in task templates (`roku: transpile/build/package/sideload/deploy/discover/lint/logs/types`) available from `task: spawn` whenever a `.brs`/`.bs` file is open — no setup needed; `/roku-init` still generates `.zed/tasks.json` (tunable per project), `.zed/debug.json` and `.zed/settings.json` |
| Debugging | DAP adapter `roku-debug --dap` (stdio) with `sourceMaps: true` — breakpoints on the original `.bs` files |
| Snippets | `snippets/brightscript.json` (subs, functions, classes, interfaces, enums, namespaces, template strings) |

## BrighterScript first-class

- Two registered languages (`brightscript`, `brighter-script`) with their own
  tree-sitter grammars; the BrighterScript one did not exist and was written
  for this project (classes, interfaces, enums, namespaces, `import`, `const`,
  `throw`, `@` annotations, template strings, `??`/`?.`/ternary, `?`/`!`/`|`
  types, `function` types).
- The build **verifies** that the zip shipped to the Roku contains
  BrightScript and never `.bs` (it fails if any `.bs` survives) and includes
  source maps.
- `bsconfig.json` is validated with file/line/column errors; `extends`,
  `plugins` and the rest are resolved by BrighterScript inside the pipeline.
- The zip is only signed (`roku-zed package`) when a `signingPassword` exists.

## Key commands

From Zed's assistant panel:

```text
/roku-discover            # list devices (SSDP + ECP: IP, model, status)
/roku-build               # transpile (if needed) + stage + zip into out/
/roku-deploy              # build + sideload + launch
/roku-logs                # bounded device log capture (ECP console)
```

Or use the built-in `roku: build` / `roku: deploy` / `roku: logs` tasks from
Zed's task palette (`task: spawn` in the command palette): with a `.brs`/`.bs`
file open, the tasks ship with the extension — no `/roku-init` required.
In projects that build with npm scripts (e.g. playlet), `roku: build` runs the
project's own chain, so the result matches the VS Code build task exactly.

## Parity matrix

[docs/PARITY.md](docs/PARITY.md) covers every feature of the VS Code
extension with an honest status (`native` / `emulated` / `not supported`) and
how each one is achieved.

## The three main limitations

1. **No custom UI**: Zed does not expose webviews/panels to extensions —
   discovery, remote control and the device list are textual (slash
   commands) and live logs go to a Zed terminal. See [docs/PARITY.md](docs/PARITY.md).
2. **No user settings for the LSP** in `zed_extension_api` 0.7.0: fine-grained
   configuration happens through `bsconfig.json` (which the LSP reads from
   disk).
3. **Debugging unvalidated against real hardware**: the adapter and binary
   resolution are implemented and typed, but the end-to-end flow with
   breakpoints on `.bs` could not be tested without a device on the network.
   See [docs/DEBUGGING.md](docs/DEBUGGING.md).

## Repository layout

```text
├── extension.toml           # extension manifest
├── src/                     # WASM crate (LSP, DAP, slash commands)
├── grammars/                # vendored + extended tree-sitter grammars
├── languages/               # config.toml + queries per language
├── cli/                     # roku-zed (Node/TS): full Roku pipeline
├── snippets/                # BrightScript/BrighterScript snippets
├── debug_schemas/           # DAP scenario schema
├── examples/                # brightscript-basic and brighterscript-advanced
├── scripts/prepare-dev.mjs  # local grammars -> file:// URLs for Zed
└── docs/                    # PARITY, GRAMMARS, BRIGHTERSCRIPT, DEBUGGING,
                             # INSTALL, LIMITATIONS, TROUBLESHOOTING, RESEARCH
```

## Development

```sh
# extension (WASM)
cargo build --target wasm32-wasip2 --release
# on Windows without MSVC:
cargo +stable-x86_64-pc-windows-gnu build --target wasm32-wasip2 --release

# grammars
cd grammars/tree-sitter-brightscript && tree-sitter generate && tree-sitter test

# CLI + smoke tests against the examples
cd cli && npm install && npm run build && npm test
```

CI in [.github/workflows/ci.yml](.github/workflows/ci.yml): `cargo fmt
--check`, `cargo clippy -D warnings`, WASM build, corpus tests for all three
grammars, and CLI smoke tests against both examples.

## Contributing

- PRs must leave the repo building (`cargo build`, `npm test`).
- Every new language feature is tested with `.bs` first (BrighterScript is
  not optional: it is the primary use case).
- Read [docs/RESEARCH.md](docs/RESEARCH.md) before touching grammars or Zed
  APIs — it documents verified gotchas.

## License

MIT
