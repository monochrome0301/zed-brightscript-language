# Depuración con roku-debug

## Preparación

1. `/roku-init` genera `.zed/debug.json` con un escenario listo:

```json
{
    "scenarios": [
        {
            "label": "Debug on Roku (brighterscript)",
            "adapter": "roku-debug",
            "transport": "stdio",
            "request": "launch",
            "config": {
                "host": "$ROKU_DEVICE_IP",
                "password": "$ROKU_DEV_PASSWORD",
                "rootDir": "$ZED_WORKTREE_ROOT",
                "outDir": "$ZED_WORKTREE_ROOT/out",
                "sourceMaps": true,
                "enableDebugProtocol": true,
                "injectRaleTrackerEvent": false
            }
        }
    ]
}
```

2. Asegúrate de que `sourceMap: true` está en `bsconfig.json` (el generado por
   `/roku-init` ya lo incluye). Los sourcemaps viajan en el zip
   (`main.brs.map`) y permiten que roku-debug resuelva breakpoints contra los
   `.bs` originales.

3. Instala roku-debug en el proyecto (`npm install --save-dev roku-debug`) o
   deja que la extensión use `npx -y roku-debug`.

## Cómo arranca el adaptador

La extensión implementa `get_dap_binary` (trait `Extension`):

- `roku-debug` en el `$PATH` → `<bin> --dap` (stdio)
- `node_modules/roku-debug` del proyecto → `node .../dist/cli.js --dap`
- fallback: `npx -y roku-debug --dap`

La configuración del escenario viaja como los argumentos del request
`launch`/`attach` de DAP (host, password, sourceMaps, `bsConst`,
`componentLibrariesPort`, etc.).

## Flujo

1. `/roku-build` (o la tarea `roku: build`) — transpila + zip.
2. `/roku-sideload` — instala y lanza el canal.
3. Inicia el escenario de depuración desde el panel de debug de Zed.
4. Los logs de consola del dispositivo: tarea `roku: logs` (terminal Zed,
   streaming) o `/roku-logs` (captura acotada).

## Rendezvous

roku-debug usa el puerto de depuración del dispositivo (8085 en OS modernos;
el clásico telnet 8080 en builds antiguos). `roku-zed logs` prueba ambos en
ese orden. El tracking de rendezvous (mensajes `rendezvousTracker`) aparece
en ese stream cuando `injectRaleTrackerEvent` está activo o el firmware lo
emite.

## Estado honesto

- El arranque del adaptador y el mapeo de configuración están implementados y
  compilados, pero **no se ha validado contra hardware Roku real** en este
  repositorio (no había dispositivo en la red de desarrollo).
- Breakpoints en `.bs`: dependen de `sourceMap: true` y del soporte de
  sourcemaps de roku-debug. Si tu versión de roku-debug no los aplica, los
  breakpoints caerán en el `.brs` transpilado.
- Si Zed no puede iniciar el adaptador, el sustituto parcial es
  `/roku-logs` (no hay breakpoints, pero sí diagnóstico en vivo).
