"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface CommandArguments {
  jsCompanionExtension: string; // default: ".css"
  cssCompanionExtension: string; // default: ".js"
  useDirectoryName: boolean; // default: true
  useOtherColumn: boolean; // default: false
}

enum FileType {
  JS,
  CSS,
  UNKNOWN,
}

const JS_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const CSS_EXTENSIONS = [".module.scss", ".css", ".scss", ".sass"];
const EXTENSIONS = [...JS_EXTENSIONS, ...CSS_EXTENSIONS];

/**
 * Determines the file type based on the extension.
 * @param extension The file extension.
 * @returns The file type.
 */
function getFileType(extension: string): FileType {
  if (JS_EXTENSIONS.includes(extension)) {
    return FileType.JS;
  }
  if (CSS_EXTENSIONS.includes(extension)) {
    return FileType.CSS;
  }
  return FileType.UNKNOWN;
}

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("styleswitch", (args: any) =>
      switchToFile(args)
    )
  );
}

/**
 * Switches to a companion file based on the current file.
 * @param args Command arguments.
 */
function switchToFile(args: any) {
  const current = vscode.window.activeTextEditor?.document.fileName;

  if (!current) {
    return;
  }

  const validArgs = parseArgs(args);

  const dir = path.dirname(current);
  fs.readdir(dir, (err, files) => {
    if (err) {
      vscode.window.showErrorMessage("styleswitch encountered error: " + err);
      return;
    }
    tryOpenCompanionFile(current, validArgs, files);
  });
}

/**
 * Parses the command arguments.
 * @param args Command arguments.
 * @returns Parsed command arguments.
 */
function parseArgs(args: any): CommandArguments {
  const jsCompanionExtension = args.jsCompanionExtension || ".css";
  const cssCompanionExtension = args.cssCompanionExtension || ".js";
  const useDirectoryName = args.useDirectoryName !== false; // default to true if undefined
  const useOtherColumn = args.useOtherColumn === true; // default to false if undefined

  return {
    jsCompanionExtension,
    cssCompanionExtension,
    useDirectoryName,
    useOtherColumn,
  };
}

/**
 * Attempts to open a companion file.
 * @param currentPath The path of the current file.
 * @param args Parsed command arguments.
 * @param files List of files in the current directory.
 */
function tryOpenCompanionFile(
  currentPath: string,
  args: CommandArguments,
  files: string[]
) {
  const currentFile = path.basename(currentPath);
  const fileType = getFileType(path.extname(currentFile));

  if (fileType === FileType.UNKNOWN) {
    vscode.window.showErrorMessage(
      "styleswitch: File must be a JS or CSS file"
    );
    return;
  }

  const filesMap: { [key: string]: string } = {};
  files.forEach((x) => (filesMap[x] = x));

  const name = currentFile.split(".")[0];
  const matches = files.filter((x) => x.startsWith(name));
  const candidates = matches.map((x) =>
    path.join(path.dirname(currentPath), x)
  );

  // If no file is found, try finding a file with the folder name (if enabled)
  // We intentionally exclude the current file from the list of candidates
  const index = candidates.indexOf(currentPath);
  const filteredCandidates = candidates.filter((_, i) => i !== index);
  if (filteredCandidates.length === 0 && args.useDirectoryName) {
    const dirName = path.basename(path.dirname(currentPath));
    for (let ext of EXTENSIONS) {
      const folderFile = path.join(
        path.dirname(currentPath),
        `${dirName}${ext}`
      );
      if (filesMap[`${dirName}${ext}`]) {
        candidates.push(folderFile);
      }
    }
  }

  // Find the next candidate to open (for cycling through files)
  const selfIndex = candidates.indexOf(currentPath);
  const nextIndex = (selfIndex + 1) % candidates.length;
  const candidate = candidates[nextIndex];

  // If a candidate is found, and it is not the current file, open it
  if (candidate && candidate !== currentPath) {
    openFile(candidate, determineColumn(args.useOtherColumn));
  } else {
    promptToCreateCompanionFile(currentPath, args, fileType);
  }
}

/**
 * Prompts the user to create a companion file if one does not exist.
 * @param currentPath The path of the current file.
 * @param args Parsed command arguments.
 * @param fileType The type of the current file.
 */
function promptToCreateCompanionFile(
  currentPath: string,
  args: CommandArguments,
  fileType: FileType
) {
  const dir = path.dirname(currentPath);
  const dirName = path.basename(dir);
  const baseName = path.basename(currentPath, path.extname(currentPath));
  let defaultName = "";

  if (fileType === FileType.JS) {
    defaultName =
      baseName === "index" && args.useDirectoryName
        ? `${dirName}${args.cssCompanionExtension}`
        : `${baseName}${args.cssCompanionExtension}`;
  } else if (fileType === FileType.CSS) {
    defaultName =
      baseName === "index" && args.useDirectoryName
        ? `${dirName}${args.jsCompanionExtension}`
        : `${baseName}${args.jsCompanionExtension}`;
  }

  vscode.window
    .showInputBox({
      prompt: "Enter the name of the new companion file",
      value: defaultName,
    })
    .then((input) => {
      if (!input) {
        return;
      }
      const newFilePath = path.join(dir, input);
      fs.writeFile(newFilePath, "", (err) => {
        if (err) {
          vscode.window.showErrorMessage(
            "styleswitch: Could not create file: " + err
          );
        } else {
          openFile(newFilePath, determineColumn(args.useOtherColumn));
        }
      });
    });
}

/**
 * Determines the column to use for opening a file.
 * @param useOtherColumn Whether to use the other column.
 * @returns The column number.
 */
function determineColumn(useOtherColumn: boolean): number {
  const active = vscode.window.activeTextEditor?.viewColumn;

  if (active === undefined) {
    return 1;
  }

  if (!useOtherColumn) {
    return active;
  }

  return active === 1 ? 2 : 1;
}

/**
 * Opens a file in the specified column.
 * @param filePath The path of the file to open.
 * @param column The column to open the file in.
 */
function openFile(filePath: string, column: number): void {
  vscode.workspace
    .openTextDocument(filePath)
    .then((doc) => vscode.window.showTextDocument(doc, column));
}

// this method is called when your extension is deactivated
export function deactivate() {}
