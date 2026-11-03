//! BrightScript / BrighterScript support for Zed.
//!
//! Wires up the BrighterScript language server (`bsc --lsp`) for both
//! `.brs` and `.bs` files and hosts the `/roku-*` slash commands that run
//! the bundled Roku CLI (transpile, build, package, sideload, ...).

mod cli;
mod commands;
mod debug_adapters;
mod language_servers;

use zed_extension_api::{
    self as zed, Command, DebugAdapterBinary, DebugConfig, DebugScenario, DebugTaskDefinition,
    LanguageServerId, Result, SlashCommand, SlashCommandOutput,
    StartDebuggingRequestArgumentsRequest, Worktree,
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

    fn get_dap_binary(
        &mut self,
        adapter_name: String,
        config: DebugTaskDefinition,
        user_provided_debug_adapter_path: Option<String>,
        worktree: &Worktree,
    ) -> Result<DebugAdapterBinary, String> {
        debug_adapters::roku_debug::binary(
            adapter_name,
            config,
            user_provided_debug_adapter_path,
            worktree,
        )
    }

    fn dap_request_kind(
        &mut self,
        adapter_name: String,
        config: zed_extension_api::serde_json::Value,
    ) -> Result<StartDebuggingRequestArgumentsRequest, String> {
        debug_adapters::roku_debug::request_kind(adapter_name, config)
    }

    fn dap_config_to_scenario(
        &mut self,
        config: DebugConfig,
    ) -> Result<DebugScenario, String> {
        let request = match config.request {
            zed::DebugRequest::Launch(_) => "launch",
            zed::DebugRequest::Attach(_) => "attach",
        };
        Ok(DebugScenario {
            label: config.label,
            adapter: config.adapter,
            build: None,
            config: zed::serde_json::json!({
                "request": request,
            })
            .to_string(),
            tcp_connection: None,
        })
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
