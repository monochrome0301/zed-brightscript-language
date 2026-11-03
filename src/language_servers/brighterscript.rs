//! BrighterScript language server wiring (`bsc --lsp`).
//!
//! One server instance covers both `brightscript` (`.brs`) and
//! `brighter-script` (`.bs`, `.d.bs`) files. The LSP reads `bsconfig.json`
//! directly from disk, so most behavior is controlled by the project's
//! own configuration.

use zed_extension_api::serde_json::json;
use zed_extension_api::{current_platform, Command, Os, Result, Worktree};

/// The npm package that provides the BrighterScript compiler and LSP.
pub const BRIGHTERSCRIPT_PACKAGE: &str = "brighterscript";
/// Entry point of the BrighterScript CLI (compiler + `--lsp` mode) inside the
/// installed npm package.
const BRIGHTERSCRIPT_CLI_JS: &str = "node_modules/brighterscript/dist/cli.js";
/// Flag that starts the BrighterScript language server.
const LSP_FLAG: &str = "--lsp";

/// Returns `npx.cmd` on Windows and `npx` elsewhere.
fn npx_binary(os: Os) -> &'static str {
    match os {
        Os::Windows => "npx.cmd",
        Os::Linux | Os::Mac => "npx",
    }
}

/// Builds the command that starts the BrighterScript language server.
///
/// Resolution order:
/// 1. `node <worktree>/node_modules/brighterscript/dist/cli.js --lsp`
///    (project-local install, preferred so the server version matches the
///    project's `bsconfig.json` expectations),
/// 2. `npx brighterscript --lsp` as a fallback.
pub fn command(worktree: &Worktree) -> Result<Command> {
    let os = current_platform().0;
    let local_cli = format!("{}/{BRIGHTERSCRIPT_CLI_JS}", worktree.root_path());

    if worktree
        .read_text_file(&format!(
            "node_modules/{BRIGHTERSCRIPT_PACKAGE}/package.json"
        ))
        .is_ok()
    {
        return match worktree.which("node") {
            Some(node) => Ok(Command::new(node).arg(local_cli).arg(LSP_FLAG)),
            None => Err(format!(
                "found a local `{BRIGHTERSCRIPT_PACKAGE}` install but no `node` binary on $PATH; \
                 install Node.js and restart Zed"
            )),
        };
    }

    let npx = worktree
        .which("npx")
        .unwrap_or_else(|| npx_binary(os).to_string());
    Ok(Command::new(npx).args(["-y", BRIGHTERSCRIPT_PACKAGE, LSP_FLAG]))
}

/// Workspace configuration served to the BrighterScript LSP.
///
/// The LSP queries the `brightscript`, `files` and `search` configuration
/// sections (see `LanguageServer.ts` in rokucommunity/brighterscript); Zed
/// looks each requested section up as a top-level key of the returned
/// object. The LSP applies its own defaults when values are missing, and
/// per-project behavior is driven by `bsconfig.json` which it reads from
/// disk directly.
pub fn workspace_configuration(
    _worktree: &Worktree,
) -> Result<Option<zed_extension_api::serde_json::Value>> {
    Ok(Some(json!({
        "brightscript": {},
        "files": {},
        "search": {},
    })))
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
