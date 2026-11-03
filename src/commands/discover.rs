//! `/roku-discover` — list Roku devices found on the network (SSDP/ECP).

use crate::cli;
use zed_extension_api::{Result, Worktree};

pub fn run(args: &[String], worktree: &Worktree) -> Result<String, String> {
    let mut cli_args = vec!["discover".to_string()];
    cli_args.extend(args.iter().cloned());
    let output = cli::run(worktree, &cli_args)?;
    Ok(format!("## roku devices\n\n```\n{output}\n```"))
}
