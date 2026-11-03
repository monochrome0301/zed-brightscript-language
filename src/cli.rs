//! Resolution and invocation of the `roku-zed` CLI (see `cli/` in this
//! repository) from the extension's slash commands.

use zed_extension_api::{Command, Os, Result, Worktree, current_platform};

/// Name of the npm package that ships the `roku-zed` CLI.
pub const CLI_PACKAGE: &str = "roku-zed-cli";
/// Binary name exposed by the CLI package.
pub const CLI_BIN: &str = "roku-zed";

/// Returns `npx.cmd` on Windows and `npx` elsewhere.
fn npx_binary(os: Os) -> &'static str {
    match os {
        Os::Windows => "npx.cmd",
        Os::Linux | Os::Mac => "npx",
    }
}

/// Builds the base command that runs the `roku-zed` CLI with the given
/// arguments, pinned to the worktree root.
///
/// Resolution order:
/// 1. `roku-zed` on the worktree's `$PATH` (`worktree.which`),
/// 2. `roku` on the worktree's `$PATH` (projects may vendor the CLI under a
///    different package with the same binary contract),
/// 3. the project-local `node_modules/.bin/roku-zed` shim,
/// 4. `npx -y roku-zed-cli` (downloads on demand).
///
/// Every invocation receives `--cwd <worktree root>` so the CLI operates on
/// the project regardless of where Zed itself was started.
pub fn command(worktree: &Worktree, args: &[String]) -> Result<Command> {
    let os = current_platform().0;
    let root = worktree.root_path();
    let mut argv: Vec<String> = Vec::with_capacity(args.len() + 4);
    argv.push("--cwd".into());
    argv.push(root.clone());
    argv.extend(args.iter().cloned());

    if let Some(bin) = worktree.which(CLI_BIN).or_else(|| worktree.which("roku")) {
        return Ok(Command::new(bin).args(argv));
    }

    if worktree
        .read_text_file(&format!("node_modules/{CLI_PACKAGE}/package.json"))
        .is_ok()
    {
        return match worktree.which("node") {
            Some(node) => {
                let cli_js = format!("{root}/node_modules/{CLI_PACKAGE}/dist/index.js");
                Ok(Command::new(node).arg(cli_js).args(argv))
            }
            None => Err(format!(
                "found a local `{CLI_PACKAGE}` install but no `node` binary on $PATH; \
                 install Node.js and restart Zed"
            )),
        };
    }

    let npx = worktree
        .which("npx")
        .unwrap_or_else(|| npx_binary(os).to_string());
    Ok(Command::new(npx).args(["-y", CLI_PACKAGE]).args(argv))
}

/// The message shown when the CLI is missing entirely.
pub fn install_hint() -> String {
    format!(
        "The `roku-zed` CLI was not found.\n\n\
         Install it in the project (`npm install --save-dev {CLI_PACKAGE}`) \
         or globally (`npm install -g {CLI_PACKAGE}`), then retry."
    )
}

/// Runs the CLI and returns combined, actionable output.
pub fn run(worktree: &Worktree, args: &[String]) -> Result<String> {
    let mut cmd = command(worktree, args)
        .map_err(|e| format!("{}\n\nfailed to build the command: {e}", install_hint()))?;
    let output = cmd
        .output()
        .map_err(|e| format!("{}\n\nfailed to spawn the CLI: {e}", install_hint()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let mut text = String::new();
    if !stdout.trim().is_empty() {
        text.push_str(&stdout);
    }
    if !stderr.trim().is_empty() {
        if !text.is_empty() {
            text.push('\n');
        }
        text.push_str(&stderr);
    }
    let exit_code = output.status.unwrap_or(-1);
    if exit_code != 0 && text.trim().is_empty() {
        text.push_str(&format!("{CLI_BIN} exited with status {exit_code}"));
    }
    Ok(text)
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
