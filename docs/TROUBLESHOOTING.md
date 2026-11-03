# Troubleshooting

## La extensión no carga / las gramáticas fallan

**Error del tipo `grammar directory ... is not a git clone of '<url>'` o
`failed to fetch revision`.** Zed obtiene las gramáticas vía git. Ejecuta
`node scripts/prepare-dev.mjs` y reinstala la extensión de desarrollo.

**`grammar wasm` no se compila / falta clang.** Zed compila cada gramática con
clang. En Windows instala LLVM/WinLibs si el log de Zed muestra errores de
compilación C:
`winget install BrechtSanders.WinLibs.POSIX.UCRT.LLVM`.

## No hay resaltado

1. Mira el log de Zed (`zed: open log`): los errores de queries aparecen como
   `failed to load highlights query` etc.
2. Confirma que el fichero se detectó con el lenguaje correcto (modeline o
   selector de lenguaje). Puedes mapear extensiones en settings:
   `"file_types": { "SceneGraph XML": ["xml"] }`.
3. Si otro proyecto/estructura modificó `languages/*/config.toml`, valida el
   TOML con `cargo run`... (no aplica) — revisa sintaxis y claves.

## El LSP de BrighterScript no arranca

- Necesitas `node` (y `npx`) en el `$PATH` de Zed. Comprueba en una terminal
  de Zed: `node --version`.
- Modo local: si el proyecto tiene `node_modules/brighterscript`, la extensión
  usa `node <proyecto>/node_modules/brighterscript/dist/cli.js --lsp`.
  Si instalaste con otra versión, borra `node_modules/brighterscript` y deja
  que el fallback `npx -y brighterscript --lsp` lo gestione.
- Ver en vivo: Zed → editor → language server logs para `brighterscript`.

## `/roku-*` falla con "CLI was not found"

```sh
cd <proyecto>
npm install --save-dev roku-zed-cli
# o instala el CLI local de este repo:
cd cli && npm install && npm run build && npm link
```

También funciona `npx -y roku-zed-cli` automáticamente, pero es más lento.

## Build falla con "zip containing N .bs file(s)"

Tu `bsconfig.json` está incluyendo `.bs` en el staging. Revisa `files` y
`excludeFiles` — los `.bs` deben transpilarse (BrighterScript lo hace en el
pipeline) o excluirse del empaquetado.

## Sideload falla

- **No device host**: `--host <ip>`, `ROKU_DEVICE_IP`, o `host` en
  `bsconfig.json`. Descubre IPs con `/roku-discover`.
- **No developer password**: `--password`, `ROKU_DEV_PASSWORD`, o
  `devPassword` en `bsconfig.json`.
- **HTTP 403 / dev tools off**: activa el modo desarrollador en el Roku
  (Settings → System → Advanced → Developer settings).

## Depuración no arranca

- Comprueba que `roku-debug` está disponible (`npx roku-debug --version`).
- Los breakpoints en `.bs` requieren `sourceMap: true` en `bsconfig.json` y un
  build reciente (los `.map` van dentro del zip).
- Si Zed no encuentra el adaptador, revisa `lsp`/`debug` en el log de Zed.

## CI: `tree-sitter test` falla en Windows

Necesita un compilador C. Sin MSVC: `winget install
BrechtSanders.WinLibs.POSIX.UCRT` y exporta
`CC=C:/.../WinLibs/.../mingw64/bin/gcc.exe` antes de invocar tree-sitter.
