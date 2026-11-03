//! Slash command implementations. Each command delegates to the `roku-zed`
//! CLI and formats its output for the assistant panel.

mod build;
mod deeplink;
mod deploy;
mod discover;
mod init;
mod key;
mod lint;
mod logs;
mod package;
mod sideload;
mod transpile;
mod types;

use zed_extension_api::{
    Range, Result, SlashCommand, SlashCommandOutput, SlashCommandOutputSection, Worktree,
};

/// Dispatches a slash command by name, returning its panel output.
pub fn run(
    command: &SlashCommand,
    args: Vec<String>,
    worktree: Option<&Worktree>,
) -> Result<SlashCommandOutput, String> {
    let worktree = worktree.ok_or_else(|| {
        format!(
            "/{} needs a project open so the CLI can run inside the worktree",
            command.name
        )
    })?;

    let text = match command.name.as_str() {
        "roku-transpile" => transpile::run(&args, worktree),
        "roku-build" => build::run(&args, worktree),
        "roku-package" => package::run(&args, worktree),
        "roku-sideload" => sideload::run(&args, worktree),
        "roku-deploy" => deploy::run(&args, worktree),
        "roku-discover" => discover::run(&args, worktree),
        "roku-logs" => logs::run(&args, worktree),
        "roku-lint" => lint::run(&args, worktree),
        "roku-types" => types::run(&args, worktree),
        "roku-init" => init::run(&args, worktree),
        "roku-key" => key::run(&args, worktree),
        "roku-deeplink" => deeplink::run(&args, worktree),
        other => return Err(format!("unknown roku slash command: /{other}")),
    }?;

    Ok(SlashCommandOutput {
        text: text.clone(),
        sections: vec![SlashCommandOutputSection {
            range: Range {
                start: 0,
                end: text.len() as u32,
            },
            label: format!("/{}", command.name),
        }],
    })
}

/// Parses a single positional argument (e.g. a device IP or URL). Returns an
/// empty string when absent and not required.
pub fn single_arg(args: &[String], what: &str, required: bool) -> Result<String, String> {
    match args.first() {
        Some(arg) if !arg.trim().is_empty() => Ok(arg.trim().to_string()),
        _ if required => Err(format!("missing required argument: {what}")),
        _ => Ok(String::new()),
    }
}
