// Keep the console window hidden in release builds on Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
use tauri::menu::Menu;

/// Writes an export to the path the user picked in the native save dialog.
///
/// The webview never gets a file handle, only the path returned by the dialog
/// plugin, and the command is the only filesystem access the app exposes.
#[tauri::command]
fn save_export(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|error| format!("could not write {path}: {error}"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // macOS needs a menu for Cmd+Q, copy/paste and the standard app items.
            #[cfg(target_os = "macos")]
            app.set_menu(Menu::default(app.handle())?)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_export])
        .run(tauri::generate_context!())
        .expect("error while running Glyphary");
}
