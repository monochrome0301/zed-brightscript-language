//! Helpers for resolving and invoking the Node-based tooling (BrighterScript
//! LSP and the `roku` CLI) from inside the extension.

use zed_extension_api::{Command, Os, Result, Worktree, current_platform};

/// The npm package that provides the BrighterScript compiler and LSP.
const BRIGHTERSCRIPT_PACKAGE: &str = "brighterscript";
/// Entry point of the BrighterScript CLI (compiler + `--lsp` mode) inside the
/// installed npm package.
const BRIGHTERSCRIPT_CLI_JS: &str = "node_modules/brighterscript/dist/cli.js";
/// Sub-command/flag that starts the BrighterScript language server.
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
pub fn brighterscript_lsp_command(worktree: &Worktree) -> Result<Command> {
    let os = current_platform().0;
    let local_cli = format!("{}/{BRIGHTERSCRIPT_CLI_JS}", worktree.root_path());

    if worktree
        .read_text_file(&format!("node_modules/{BRIGHTERSCRIPT_PACKAGE}/package.json"))
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
