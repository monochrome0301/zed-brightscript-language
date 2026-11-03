# BrighterScript en Zed

BrighterScript (`.bs`) es un superconjunto de BrightScript que se transpila a
`.brs` antes de empaquetar. **El zip que llega al Roku contiene solo
BrightScript, nunca BrighterScript** — el build lo verifica (falla si algún
`.bs` sobrevive en el staging).

## Lenguajes registrados

| Lenguaje | Extensiones | Gramática |
|---|---|---|
| BrightScript | `.brs` | `brightscript` (vendida, extendida) |
| BrighterScript | `.bs`, `.d.bs` | `brighterscript` (propia) |
| SceneGraph XML | `.xml` | `roku_xml` (vendida de tree-sitter-grammars) |

Un `.bs` tiene resaltado, outline (clases/interfaces/enums/namespaces),
diagnósticos, hover, completion, go-to-def, rename, folding y formateo vía el
LSP de BrighterScript (`bsc --lsp`), que sirve a ambos lenguajes.

XML SceneGraph reconoce los tres modos: `<script type="text/brightscript">`,
`<script type="text/brighterscript">` y bloques `<![CDATA[ ... ]]>` — todos
se inyectan con la gramática correspondiente.

## bsconfig.json

El CLI y el LSP respetan la configuración del proyecto. Campos usados por el
pipeline de build (`cli/src/bsconfig.ts`):

- `rootDir`, `files`, `stagingDir`, `outDir`, `outFile`, `createPackage`
- `plugins` (BrighterScript los carga en la transpilación; el CLI añade
  `@rokucommunity/bslint` cuando está instalado)
- `sourceMap` (el build incluye `.map` en el zip; los breakpoints del DAP
  apuntan al `.bs` original)
- `signingPassword` (usado por `roku-zed package`; no se imprime nunca)
- `diagnosticFilters`, `excludeFiles`, `extends` — BrighterScript los aplica
  al construir el programa; `extends` se resuelve relativo al fichero que lo
  declara (lo maneja el propio BrighterScript)

El `bsconfig.json` se valida al leerlo: un JSON inválido produce un error con
fichero, línea y columna del problema.

## Plugins de BrighterScript

- Los plugins declarados en `bsconfig.plugins` se cargan dentro del proceso
  de transpilación (mismo mecanismo que el CLI de BrighterScript).
- **Un plugin que dependa de APIs de VS Code no funcionará en Zed** — no hay
  cliente de VS Code. Usa plugins puros basados en `brighter-ast`
  (`ProgramBuilder` + eventos del plugin interface). `@rokucommunity/bslint`
  es el ejemplo canónico y funciona sin VS Code.

## Declaraciones `.d.bs` y roku-types

- Los ficheros `.d.bs` del proyecto (o de `node_modules/roku-types`) alimentan
  autocompletado/typings vía LSP.
- `/roku-types` instala o actualiza `roku-types` en el proyecto (`npm install
  --save-dev roku-types`). Recarga el proyecto para que el servidor los
  recoja.

## Flujo recomendado

```sh
/roku-init      # genera .zed/tasks.json, .zed/debug.json, .zed/settings.json
/roku-types     # (opcional) instala roku-types
/roku-transpile # comprueba que .bs -> .brs sin errores
/roku-build     # zip en out/ con solo .brs + source maps
/roku-deploy    # build + sideload al dispositivo
```
