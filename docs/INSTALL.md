# Instalación

## Requisitos

- **Zed** (build reciente; el flujo "Install Dev Extension" se usa durante el desarrollo).
- **Node.js ≥ 18** en el `$PATH`: el LSP de BrighterScript y el CLI `roku-zed` corren sobre Node.
- **npm** (incluido con Node).
- Para depurar: `roku-debug` (opcional; se resuelve con `npx` si no está instalado).

## Opción A: extensión de desarrollo (recomendada hoy)

Las gramáticas de esta extensión se venden dentro del propio repositorio, y Zed las
obtiene vía `git fetch <repository> <rev>`, lo que exige un repositorio git y una
URL `file://` **absoluta**. El script `scripts/prepare-dev.mjs` prepara todo:

```sh
node scripts/prepare-dev.mjs
```

El script:

1. Copia cada gramática vendida a `target/grammar-repos/<nombre>`.
2. Inicializa un repo git en cada copia y fija un commit.
3. Reescribe las entradas `[grammars.*]` de `extension.toml` con URLs `file://` absolutas + SHAs.

Después, en Zed:

1. Abre la paleta de comandos → **Extensions: Install Dev Extension**.
2. Selecciona este directorio (`zed-brightscript-language`).

Vuelve a ejecutar el script cada vez que cambies una gramática (los SHAs cambian).

## Opción B: paquete `.zedext`

```sh
zed extension package   # en builds de Zed que exponen el subcomando `extension`
```

Para que esto funcione fuera de este árbol, publica las gramáticas como repositorios
públicos (ver `docs/GRAMMARS.md`) y cambia las entradas `[grammars.*]` a sus URLs de
GitHub con un SHA fijo.

## CLI `roku-zed`

Los slash commands `/roku-*` resuelven el CLI en este orden:

1. `roku-zed` en el `$PATH` del worktree,
2. `roku` en el `$PATH` (mismo contrato de binario),
3. `node_modules/roku-zed-cli` del proyecto,
4. `npx -y roku-zed-cli` (descarga bajo demanda).

Instálalo en el proyecto (`npm install --save-dev roku-zed-cli`) o globalmente
(`npm install -g roku-zed-cli`) para evitar la descarga de npx en cada invocación.
Alternativamente, construye el CLI local: `cd cli && npm install && npm run build`.

## Variables de entorno

| Variable | Uso |
|---|---|
| `ROKU_DEVICE_IP` | Dispositivo por defecto para sideload/logs/key/deeplink |
| `ROKU_DEV_PASSWORD` | Contraseña de desarrollador del Roku |

También puedes pasarlas por flags (`--host`, `--password`) o ponerlas en
`bsconfig.json` (`host`, `devPassword`).
