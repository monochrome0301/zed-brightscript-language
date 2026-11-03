//! roku-debug DAP adapter support.
//!
//! roku-debug (npm) implements the Debug Adapter Protocol over stdio
//! (`roku-debug --dap`). Breakpoints bind to the original `.bs` files when
//! the package was built with `sourceMap: true` (the default in the
//! generated `.zed/debug.json` and `bsconfig.json`).

use zed_extension_api::serde_json::Value;
use zed_extension_api::{
    self as zed, DebugAdapterBinary, DebugTaskDefinition, Os, Result, Worktree,
    StartDebuggingRequestArguments, StartDebuggingRequestArgumentsRequest, current_platform,
};

/// npm package + binary name of the roku debug adapter.
const ROKU_DEBUG_PACKAGE: &str = "roku-debug";
const ROKU_DEBUG_CLI: &str = "node_modules/roku-debug/dist/cli.js";
const DAP_FLAG: &str = "--dap";

fn npx_binary(os: Os) -> &'static str {
    match os {
        Os::Windows => "npx.cmd",
        Os::Linux | Os::Mac => "npx",
    }
}

/// Parses the scenario configuration JSON (empty/invalid -> null).
fn parse_config(raw: &str) -> Value {
    zed::serde_json::from_str(raw).unwrap_or(Value::Null)
}

fn request_from_config(config: &Value) -> StartDebuggingRequestArgumentsRequest {
    match config.get("request").and_then(|r| r.as_str()) {
        Some("attach") => StartDebuggingRequestArgumentsRequest::Attach,
        _ => StartDebuggingRequestArgumentsRequest::Launch,
    }
}

/// Resolves the roku-debug adapter binary for a debug session.
pub fn binary(
    _adapter_name: String,
    config: DebugTaskDefinition,
    user_installed_path: Option<String>,
    worktree: &Worktree,
) -> Result<DebugAdapterBinary, String> {
    let os = current_platform().0;
    let root = worktree.root_path();
    let config_json = parse_config(&config.config);

    if let Some(path) = user_installed_path {
        // user-provided adapter path: run it directly
        return Ok(DebugAdapterBinary {
            command: Some(path),
            arguments: vec![DAP_FLAG.into()],
            envs: Vec::new(),
            cwd: Some(root),
            connection: None,
            request_args: StartDebuggingRequestArguments {
                configuration: config.config,
                request: request_from_config(&config_json),
            },
        });
    }

    let (command, base_args): (String, Vec<String>) =
        if let Some(bin) = worktree.which(ROKU_DEBUG_PACKAGE) {
            (bin, vec![DAP_FLAG.into()])
        } else if worktree
            .read_text_file(&format!("node_modules/{ROKU_DEBUG_PACKAGE}/package.json"))
            .is_ok()
        {
            match worktree.which("node") {
                Some(node) => (
                    node,
                    vec![format!("{root}/{ROKU_DEBUG_CLI}"), DAP_FLAG.into()],
                ),
                None => {
                    return Err(format!(
                        "found a local `{ROKU_DEBUG_PACKAGE}` install but no `node` binary on $PATH; \
                         install Node.js and restart Zed"
                    ));
                }
            }
        } else {
            (
                worktree
                    .which("npx")
                    .unwrap_or_else(|| npx_binary(os).to_string()),
                vec!["-y".into(), ROKU_DEBUG_PACKAGE.into(), DAP_FLAG.into()],
            )
        };

    Ok(DebugAdapterBinary {
        command: Some(command),
        arguments: base_args,
        envs: Vec::new(),
        cwd: Some(root),
        connection: None,
        request_args: StartDebuggingRequestArguments {
            configuration: config.config,
            request: request_from_config(&config_json),
        },
    })
}

/// Returns whether the scenario performs a DAP `launch` or `attach`.
pub fn request_kind(
    adapter_name: String,
    config: Value,
) -> Result<StartDebuggingRequestArgumentsRequest, String> {
    let _ = adapter_name;
    let request = config
        .get("request")
        .and_then(|r| r.as_str())
        .unwrap_or("launch");
    match request {
        "launch" => Ok(StartDebuggingRequestArgumentsRequest::Launch),
        "attach" => Ok(StartDebuggingRequestArgumentsRequest::Attach),
        other => Err(format!("unknown roku-debug request type: {other}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn npx_binary_is_platform_specific() {
        assert_eq!(npx_binary(Os::Windows), "npx.cmd");
        assert_eq!(npx_binary(Os::Mac), "npx");
        assert_eq!(npx_binary(Os::Linux), "npx");
    }
}
