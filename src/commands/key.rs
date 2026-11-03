//! `/roku-key <key>` — send a remote-control keypress via ECP.

use crate::cli;
use crate::commands::single_arg;
use zed_extension_api::{Result, Worktree};

pub fn run(args: &[String], worktree: &Worktree) -> Result<String, String> {
    let key = single_arg(args, "key name (e.g. home, up, select, rev)", true)?;
    let mut cli_args = vec!["key".to_string(), key.to_string()];
    cli_args.extend(args.iter().skip(1).cloned());
    let output = cli::run(worktree, &cli_args)?;
    Ok(format!("## roku key\n\n```\n{output}\n```"))
}
