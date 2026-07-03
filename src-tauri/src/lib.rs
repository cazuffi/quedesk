use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    ActivationPolicy, Manager, RunEvent, WebviewWindow,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_sql::{Migration, MigrationKind};

const DB_URL: &str = "sqlite:quedesk.db";
const TODAY_WIDGET_LABEL: &str = "today-widget";
const QUICK_CAPTURE_LABEL: &str = "quick-capture";

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_schema",
        sql: "
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                queue TEXT NOT NULL DEFAULT 'inbox',
                parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
                surface_of_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                due_date TEXT,
                tags TEXT NOT NULL DEFAULT '[]',
                source_link TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL,
                completed_at TEXT,
                cleared_at TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_tasks_queue ON tasks(queue);
            CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_surface ON tasks(surface_of_id);

            CREATE TABLE IF NOT EXISTS custom_queues (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0
            );
        ",
        kind: MigrationKind::Up,
    }]
}

fn any_window_visible(app: &tauri::AppHandle) -> bool {
    app.webview_windows()
        .values()
        .any(|window| window.is_visible().unwrap_or(false))
}

fn ensure_app_visible(app: &tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let _ = app.set_activation_policy(ActivationPolicy::Regular);
        let _ = app.set_dock_visibility(true);
        let _ = app.show();
    }
}

fn sync_macos_presence(app: &tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        if any_window_visible(app) {
            ensure_app_visible(app);
        } else {
            let _ = app.set_activation_policy(ActivationPolicy::Accessory);
            let _ = app.set_dock_visibility(false);
        }
    }
}

fn position_today_widget(window: &WebviewWindow) {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let screen = monitor.size();
        let scale = monitor.scale_factor();
        let width = window.outer_size().map(|size| size.width).unwrap_or(360);
        let height = window.outer_size().map(|size| size.height).unwrap_or(480);
        let margin = (16.0 * scale) as i32;
        let x = screen.width as i32 - width as i32 - margin;
        let y = screen.height as i32 - height as i32 - margin;
        let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
    }
}

fn show_window(app: &tauri::AppHandle, label: &str) {
    ensure_app_visible(app);

    if let Some(window) = app.get_webview_window(label) {
        if label == TODAY_WIDGET_LABEL {
            position_today_widget(&window);
        }
        if label == QUICK_CAPTURE_LABEL {
            let _ = window.center();
        }
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn hide_window(app: &tauri::AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.hide();
    }
    sync_macos_presence(app);
}

fn toggle_window(app: &tauri::AppHandle, label: &str) {
    if let Some(window) = app.get_webview_window(label) {
        if window.is_visible().unwrap_or(false) {
            hide_window(app, label);
        } else {
            show_window(app, label);
        }
    }
}

fn open_main_window(app: &tauri::AppHandle) {
    ensure_app_visible(app);

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.center();
        let _ = window.set_focus();
    }
}

fn hide_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    sync_macos_presence(app);
}

fn toggle_quick_capture(app: &tauri::AppHandle) {
    toggle_window(app, QUICK_CAPTURE_LABEL);
}

fn toggle_today_widget(app: &tauri::AppHandle) {
    toggle_window(app, TODAY_WIDGET_LABEL);
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    open_main_window(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let capture_shortcut =
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    let mut app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler({
                    let capture_shortcut = capture_shortcut.clone();
                    move |app, shortcut, event| {
                        if shortcut == &capture_shortcut
                            && event.state() == ShortcutState::Pressed
                        {
                            toggle_quick_capture(app);
                        }
                    }
                })
                .build(),
        )
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![show_main_window])
        .setup(move |app| {
            let show_item =
                MenuItem::with_id(app, "show", "Show QueDesk", true, None::<&str>)?;
            let today_item = MenuItem::with_id(
                app,
                "today_widget",
                "Today Widget",
                true,
                None::<&str>,
            )?;
            let capture_item = MenuItem::with_id(
                app,
                "quick_capture",
                "Quick Capture",
                true,
                None::<&str>,
            )?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit QueDesk", true, None::<&str>)?;
            let tray_menu = Menu::with_items(
                app,
                &[
                    &show_item,
                    &separator,
                    &today_item,
                    &capture_item,
                    &separator,
                    &quit_item,
                ],
            )?;

            let icon = app
                .default_window_icon()
                .expect("missing default window icon")
                .clone();

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("QueDesk")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => open_main_window(app),
                    "today_widget" => toggle_today_widget(app),
                    "quick_capture" => toggle_quick_capture(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        open_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            app.global_shortcut().register(capture_shortcut)?;

            hide_main_window(app.handle());

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                match window.label() {
                    "main" => {
                        hide_main_window(&app);
                        api.prevent_close();
                    }
                    TODAY_WIDGET_LABEL | QUICK_CAPTURE_LABEL => {
                        hide_window(&app, window.label());
                        api.prevent_close();
                    }
                    _ => {}
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    #[cfg(target_os = "macos")]
    {
        let _ = app.set_activation_policy(ActivationPolicy::Accessory);
    }

    app.run(|app_handle, event| {
        if let RunEvent::Reopen { has_visible_windows, .. } = event {
            if !has_visible_windows {
                open_main_window(app_handle);
            }
        }
    });
}
