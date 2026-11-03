# Gramáticas tree-sitter

## Qué existe y qué se generó

- **BrightScript**: no existía una gramática oficial de RokuCommunity. Se
  partió de `DusanLesan/tree-sitter-brightscript` (MIT, rev
  `4dda50c38bede5f8d362d1beac6244665398c474`) y se vendó en
  `grammars/tree-sitter-brightscript` con extensiones (ver abajo).
- **BrighterScript**: **no existía ninguna gramática** tree-sitter. Se escribió
  `grammars/tree-sitter-brighterscript` como superconjunto de la de
  BrightScript (las reglas base se duplican deliberadamente: tree-sitter no
  soporta herencia de gramáticas).
- **XML SceneGraph**: se vendó `tree-sitter-grammars/tree-sitter-xml` (MIT)
  como `grammars/tree-sitter-roku-xml` (fusion de `xml/grammar.js` +
  `common/common.mjs` a CommonJS, `scanner.h` en línea y símbolos del scanner
  re-aliados a `tree_sitter_roku_xml`).

## Renombrado y por qué

Zed compila cada gramática con `clang -Wl,--export=tree_sitter_<clave>` y la
carga buscando exactamente ese símbolo (derivado del nombre de fichero del
wasm, que es la **clave** en `extension.toml`). Consecuencias:

- La clave de gramática **no puede contener guiones** (los símbolos C no los
  admiten): por eso la gramática de BrighterScript se llama `brighterscript`
  aunque el lenguaje se llame `brighter-script`.
- El `name` dentro de `grammar.js` debe generar el mismo símbolo: los nombres
  de gramática de tree-sitter tampoco admiten guiones (`roku_xml`).

## Extensiones sobre la gramática original de BrightScript

La gramática base no parseaba código Roku real. Se añadió:

- `print` (incluyendo el atajo `?`), `dim`, `stop`
- comentarios `rem` (con frontera de palabra para no romper `removeItem`)
- preprocesador `#if` / `#else if` / `#else` / `#end if`, `#const`, `#error`
- literales hexadecimales (`&hFF`) y con exponente (`1e5`)
- claves en arrays asociativos y campos separados por saltos de línea
- strings con comillas dobles escapadas (`""`)
- terminador de bucle `next` (además de `end for`)
- `while` sin `do` obligatorio
- labels + `goto`
- `sub`/`function` con `end sub`/`end function` estricto (no mezclables)

## BrighterScript: sintaxis cubierta

Clases (campos, `public/protected/private`, `override`, constructores `new`),
interfaces, enums, namespaces, `import`, `const`, `throw`, anotaciones `@`,
template strings con `${}`, ternario, `??`, `?.`, `&&`/`||`, asignación
compuesta (`+=` etc.), `new`/`super`, y tipos extendidos (uniones `|`,
nullable `?`, non-null `!`, tipos `function(...)`).

## Tests

Cada gramática tiene corpus en `test/corpus/*.txt` (18 tests BrightScript,
14 BrighterScript). Se ejecutan con:

```sh
cd grammars/tree-sitter-brightscript
tree-sitter generate && tree-sitter test
```

Requiere tree-sitter CLI 0.27+ y un compilador C (`gcc`/`clang`; en Windows
sin MSVC sirve WinLibs: `winget install BrechtSanders.WinLibs.POSIX.UCRT`).

## Validación de queries

Las queries viven en `languages/<id>/*.scm` (Zed las lee del directorio del
lenguaje, no del repo de la gramática). Se validaron con:

```sh
cp languages/brightscript/highlights.scm grammars/tree-sitter-brightscript/queries/
tree-sitter query queries/highlights.scm sample.brs
```

## Publicación (para empaquetar fuera de este árbol)

Las entradas `[grammars.*]` apuntan a `file://grammars/...` para desarrollo
local (`scripts/prepare-dev.mjs` las convierte en URLs absolutas + SHAs). Para
publicar la extensión, sube cada directorio de gramática a su propio repo de
GitHub y referencia:

```toml
[grammars.brightscript]
repository = "https://github.com/<org>/tree-sitter-brightscript"
rev = "<sha>"
```
