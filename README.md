# vscode-style-ext-switcher

## Introduction

`vscode-style-ext-switcher` is a Visual Studio Code extension designed to streamline switching between companion JavaScript (or TypeScript) and CSS (or SCSS) files. This extension is particularly useful for developers working with React or other frameworks where related files frequently share the same base name but have different extensions.

## Features

- **Switch between JS/TS and CSS/SCSS files**: Quickly switch between JavaScript/TypeScript and CSS/SCSS files with matching base names.
- **Directory name fallback**: If no matching files are found using the current file name, the extension will search using the parent directory name as the base name.
- **Create companion files**: If no companion files exist, you can easily create
  a new companion file using a prompt.

## Example Directory Structure

Consider a project structure where you have a `NavigationBar` component folder containing `index.tsx` and `NavigationBar.module.scss`. This is a typical scenario where `vscode-style-ext-switcher` proves useful.

```plaintext
my-project/
├── src/
│   ├── components/
│   │   ├── NavigationBar/
│   │   │   ├── index.tsx
│   │   │   ├── NavigationBar.module.scss
```

With the appropriate keybinding set up, you can quickly switch between `index.tsx` and `NavigationBar.module.scss`:

1. **Open `index.tsx`**: Start by opening `index.tsx` in the editor.
2. **Invoke Keybinding**: Use your configured keybinding (e.g., `cmd+shift+c`) to switch to the corresponding `NavigationBar.module.scss` file.

If `NavigationBar.module.scss` does not exist, you will be prompted to create
it, ensuring a smooth workflow.

Note: As of now, the extension does not support switching back from named
CSS/SCSS files to the corresponding `index.xxx` file.

## Keybinding Setup

To use `vscode-style-ext-switcher`, you need to set up custom keybindings. This allows you to quickly switch between related files with a single keystroke.

### Example Keybindings

#### Open Companion File in Another Column

These shortcuts open a companion file in another editor column, so you can quickly view related files side by side:

```json
{
  "key": "cmd+shift+c",
  "command": "styleswitch",
  "args": {
    "jsExtension": ".js",
    "cssExtension": ".module.scss",
    "useDirName": true
  },
  "when": "editorTextFocus"
},
{
  "key": "cmd+shift+d",
  "command": "styleswitch",
  "args": {
    "jsExtension": ".tsx",
    "cssExtension": ".scss",
    "useDirName": true
  },
  "when": "editorTextFocus"
}
```

## Supported File Extensions

The `vscode-style-ext-switcher` extension supports the following file extensions:

- JavaScript: `.js`, `.jsx`, `.ts`, `.tsx`
- CSS: `.module.scss`, `.css`, `.scss`, `.sass`

## Usage

Once the extension is installed and keybindings are set up, use your configured keybinding to switch between companion files.

### Finding Companion Files

When invoked, the command will look for files in the same directory as the
current file, matching the specified extensions. If no matching files are found,
it will fall back to using the parent directory name as the base name.

### Cycle Through Companion Files

This command cycles through matching companion files within the same directory:

### Creating Companion Files

If no companion file exists, you will be prompted to create one. Enter the desired name for the new file, and it will be created and opened in a new editor column.

## Installation

1. Open the Extensions panel in Visual Studio Code.
2. Click on the three dots in the top right corner and select "Install from
   VSIX..."
3. Select the `vscode-style-ext-switcher-1.0.0.vsix` file from your file system and click "Install".

## Contributing

Please report issues and submit pull requests to the [vscode-style-ext-switcher GitHub
repository](https://github.com/levikline/vscode-file-ext-switcher).

In order to compile the extension locally during development, you will need to run `npm install`
and `npm run package` to generate a `.vsix` file.

## Acknowledgements

This extension was inspired by the original
[meshcloud/vscode-file-ext-switcher](https://github.com/meshcloud/vscode-file-ext-switcher)
but has been reimagined and rewritten to support specific use cases involving
JavaScript/TypeScript and CSS/SCSS file switching.
