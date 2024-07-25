# vscode-file-ext-switcher

Based on
[meshcloud/vscode-file-ext-switcher](https://github.com/meshcloud/vscode-file-ext-switcher):

1. Add support for locating companion files using the name of the parent
   directory when no matching files are found using the name of the current
   file. This is particularly useful for finding `.scss` files when the parent
   directory name serves as the base name, and the corresponding `.tsx` file
   is named `index.tsx`.
2. Add support for preventing the extension from opening the current file in the
   other editor column when the current file is the only file that matches the
   base name. Instead, a message is displayed in the status bar indicating that
   no matching files were found.
3. Use the latest packages for VSCode extension development according to [the docs](https://code.visualstudio.com/api/get-started/your-first-extension)

For my specific use case, I use the following keybinding:

```json
{
  "key": "cmd+shift+c",
  "command": "fileextswitch",
  "args": { "extensions": [".module.scss", ".tsx"], "useOtherColumn": true },
  "when": "editorTextFocus"
}
```

---

# From [meshcloud/vscode-file-ext-switcher](https://github.com/meshcloud/vscode-file-ext-switcher)

Once **[set up](#setup)** _file-ext-switcher_ allows you to quickly switch via keyboard shortcuts between files which share same name but differ by extension (AKA companion files, e.g. from `file.html` to `file.js`).
This is very useful for Angular (and even AngularJs) component development where you need to quickly switch between code, template, style and test files.

> This extension provides key-bindable VS code commands for every supported file type that you specify.
> **Please note that you must set up bindings first, see [Setup](#setup)**.

## Features

Switch to/between **any companion file(s)** in the same directory that shares at least one file-name component. Examples of usage:

- Switch to styles `.css` or `.scss`
- Open `.html` template in another editor column in split mode
- Switch between `.ts` and generated `.js` files
- Switch from `.ts` to `.spec.ts` and back

## Setup

Bind your custom keybindings to the `fileextswitch` commands for super-fast switching.

1. In VSCode open Command Palette
2. Type in and select `Preferences: Open Keyboard Shortcuts File`
3. Add one or more custom _file-ext-switcher_ keybinding into the file

A sample keybinding looks like this:

```javascript
{
    "key": "ctrl+shift+j",
    "command": "fileextswitch",
    "args": {
        "extensions": [".html", ".ts",], // extensions to switch to (in the exact order)
        "useOtherColumn": true // open companion file in other editor column (default false)
    },
    "when": "editorTextFocus"
},
```

## Example Keybindings

### Open companion file in other column

These shortcuts open a companion file in the other editor column (note the `useOtherColumn: true`), so you can quickly open your `component.ts` definition next to your `component.html`:

```json
{
    "key": "ctrl+shift+j",
    "command": "fileextswitch",
    "args": { "extensions": [".html"], "useOtherColumn": true },
    "when": "editorTextFocus"
},
{
    "key": "ctrl+shift+k",
    "command": "fileextswitch",
    "args": { "extensions": [".js", ".ts"], "useOtherColumn": true },
    "when": "editorTextFocus"
},
{
    "key": "ctrl+shift+l",
    "command": "fileextswitch",
    "args": { "extensions": [".css", ".scss"], "useOtherColumn": true },
    "when": "editorTextFocus"
},
{
    "key": "ctrl+shift+;",
    "command": "fileextswitch",
    "args": { "extensions": [".spec.ts"], "useOtherColumn": true },
    "when": "editorTextFocus"
}
```

### Cycle through companion files

When invoked, the command will look for files in the same directory of the current file, which share at least one base component (e.g. "app" for a file named "app.module.ts"). Matching follows the order of specified extensions, locating the current file's extension in the list and then cycling through to the next file extension. This allows e.g. to generate a keyboard shortcut for cyclic switching between file extensions:

```json
{
  "key": "ctrl+shift+i",
  "command": "fileextswitch",
  "args": {
    "extensions": [".ts", ".html", ".scss"]
  },
  "when": "editorTextFocus"
}
```

## Contributing

Please report issues and submit pull-requests to https://github.com/JohannesRudolph/vscode-file-ext-switcher

## Acknowledgements

If you prefer a graphical companion file switcher and can live without keybindings, check out the excellent [companion-file-switcher](https://marketplace.visualstudio.com/items?itemName=ClementVidal.companion-file-switcher) extension.
