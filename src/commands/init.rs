//! `/roku-init` — generate `.zed/tasks.json`, `.zed/debug.json` and
//! `.zed/settings.json` (plus a minimal `bsconfig.json` when missing).
//! The files are written by the `roku-zed` CLI because the extension API
//! cannot write into the worktree itself.

use crate::cli;
use zed_extension_api::{Result, Worktree};

pub fn run(args: &[String], worktree: &Worktree) -> Result<String, String> {
    let mut cli_args = vec!["init".to_string()];
    cli_args.extend(args.iter().cloned());
    let output = cli::run(worktree, &cli_args)?;
    Ok(format!("## roku init\n\n```\n{output}\n```"))
}
