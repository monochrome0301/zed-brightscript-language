//! `/roku-deploy` — build + sideload the project.

use crate::cli;
use zed_extension_api::{Result, Worktree};

pub fn run(args: &[String], worktree: &Worktree) -> Result<String, String> {
    let mut cli_args = vec!["deploy".to_string()];
    cli_args.extend(args.iter().cloned());
    let output = cli::run(worktree, &cli_args)?;
    Ok(format!("## roku deploy\n\n```\n{output}\n```"))
}
