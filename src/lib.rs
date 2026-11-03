//! BrightScript / BrighterScript support for Zed.
//!
//! Wires up the BrighterScript language server (`bsc --lsp`) for both
//! `.brs` and `.bs` files and hosts the `/roku-*` slash commands that run
//! the bundled Roku CLI (transpile, build, package, sideload, ...).

mod cli;

use zed_extension_api::{
    self as zed, Command, LanguageServerId, Result, Worktree,
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
        cli::brighterscript_lsp_command(worktree)
    }
}

zed::register_extension!(BrightscriptExtension);
