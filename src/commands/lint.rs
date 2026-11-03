//! `/roku-lint` — run bslint diagnostics when the project is configured for it.

use crate::cli;
use zed_extension_api::{Result, Worktree};

pub fn run(args: &[String], worktree: &Worktree) -> Result<String, String> {
    let mut cli_args = vec!["lint".to_string()];
    cli_args.extend(args.iter().cloned());
    let output = cli::run(worktree, &cli_args)?;
    Ok(format!("## roku lint\n\n```\n{output}\n```"))
}
