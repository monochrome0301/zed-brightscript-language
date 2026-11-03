//! BrightScript / BrighterScript support for Zed.
//!
//! Wires up the BrighterScript language server (`bsc --lsp`) for both
//! `.brs` and `.bs` files and hosts the `/roku-*` slash commands that run
//! the bundled Roku CLI (transpile, build, package, sideload, ...).

mod cli;
mod commands;
mod language_servers;

use zed_extension_api::{
    self as zed, Command, LanguageServerId, Result, SlashCommand, SlashCommandOutput, Worktree,
};

struct BrightscriptExtension;

impl zed::Extension for BrightscriptExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<Command> {
        language_servers::brighterscript::command(worktree)
    }

    fn language_server_workspace_configuration(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> Result<Option<zed_extension_api::serde_json::Value>> {
        language_servers::brighterscript::workspace_configuration(worktree)
    }

    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        worktree: Option<&Worktree>,
    ) -> Result<SlashCommandOutput, String> {
        commands::run(&command, args, worktree)
    }
}

zed::register_extension!(BrightscriptExtension);
