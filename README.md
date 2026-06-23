# Seti Folder Icons

An icon theme for VS Code that uses the icons from [`seti-ui`](https://github.com/jesseweed/seti-ui) and adds folder icons.

## Usage

1. Open the command list (Press **F1** or **Ctrl + Shift + P**)
2. Select `Preferences: File Icon Theme`
3. Select **Seti Folder Icons**

## Settings

This extension contributes the following settings under the `setiFolder` namespace:

### `setiFolder.useOnAllFolders`

- **Type:** `boolean`
- **Default:** `true`

When enabled (default), the Seti Folder Icons theme is applied to **all folders** in the explorer.
When disabled, only folders that match entries in `folderAssociations` will receive custom icons — all other folders will use VS Code's default folder icon.

### `setiFolder.folderAssociations`

- **Type:** `object`
- **Default:** `{}`

Map specific folder **names** to Seti icon definitions. Useful for giving distinct icons to folders like `src`, `node_modules`, `test`, `components`, etc.

**Example `settings.json`:**
```json
{
  "setiFolder.useOnAllFolders": true,
  "setiFolder.folderAssociations": {
    "src": "_folder_dark",
    "node_modules": "_npm",
    "test": "_javascript_1",
    "docs": "_info",
    "components": "_react",
    "hooks": "_react_1",
    "utils": "_config",
    "styles": "_css"
  }
}
```

> **Tip:** Use the **Seti Folder Icons: Show Available Icons** command to browse all available icon IDs and copy them to your clipboard.

> **Note:** After changing settings, you may need to reload the window (**Ctrl + Shift + P → Developer: Reload Window**) for the changes to take full effect.

## Commands

### `Seti Folder Icons: Show Available Icons`

Opens an icon browser panel that displays all available Seti icon definitions:

- **Hover** over any icon card to see its name in a tooltip
- **Click** any icon card to copy its ID (e.g. `_python`, `_npm`) directly to your clipboard
- Use the **search bar** to filter icons by name
- A notification confirms the copy and reminds you to use the ID in `setiFolder.folderAssociations`

You can invoke this command from the Command Palette (**Ctrl + Shift + P**) by typing *"Show Available Icons"*.

## Preview

![Screenshot (dark)](https://github.com/L-IGH-T/Seti-folder/raw/main/preview/preview-dark.png)

![Screenshot (light)](https://github.com/L-IGH-T/Seti-folder/raw/main/preview/preview-light.png)

### Original Seti screenshot

![Screenshot](https://github.com/jesseweed/seti-ui/raw/master/screenshot-icons.png)

## License

[MIT](LICENSE)