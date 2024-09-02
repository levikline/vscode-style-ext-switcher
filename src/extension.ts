"use strict";
// The module 'vscode' contains the VS Code extensibility API Import the module
// and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface CommandArguments {
  cssExtension: string; // default: ".css"
  useDirectoryName: boolean; // default: true
  useOtherColumn: boolean; // default: false
}

enum FileType {
  JS,
  CSS,
  UNKNOWN,
}

const INDEX = "index";
const JS_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const CSS_EXTENSIONS = [".module.scss", ".css", ".scss", ".sass", ".less"];

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
 * This method is called when your extension is activated. Your extension is
 * activated the very first time the command is executed.
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
  const cssExtension = args.cssExtension || ".css";
  const useDirectoryName = args.useDirectoryName !== false; // default to true if undefined
  const useOtherColumn = args.useOtherColumn === true; // default to false if undefined

  return {
    cssExtension,
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

  // Find matching files based on the current file name.
  const name = currentFile.split(".")[0];
  const fileMatches = files.filter(
    (x) =>
      x.split(".")[0] === name &&
      x !== currentFile &&
      fileType !== getFileType(path.extname(x))
  );
  const candidatePaths = fileMatches.map((x) =>
    path.join(path.dirname(currentPath), x)
  );

  // If no file is found and we are working with an "index" JS file, try finding
  // a CSS file with the folder name (if enabled)
  if (
    fileType === FileType.JS &&
    candidatePaths.length === 0 &&
    name === INDEX &&
    args.useDirectoryName
  ) {
    const dirName = path.basename(path.dirname(currentPath));
    for (let ext of CSS_EXTENSIONS) {
      const folderFile = path.join(
        path.dirname(currentPath),
        `${dirName}${ext}`
      );
      if (filesMap[`${dirName}${ext}`]) {
        candidatePaths.push(folderFile);
      }
    }
  }

  // If no file is found and we are working with a CSS file, try finding a JS
  // file with an "index" name (if enabled)
  if (
    fileType === FileType.CSS &&
    candidatePaths.length === 0 &&
    args.useDirectoryName
  ) {
    for (let ext of JS_EXTENSIONS) {
      const indexFile = path.join(path.dirname(currentPath), `${INDEX}${ext}`);
      if (filesMap[`${INDEX}${ext}`]) {
        candidatePaths.push(indexFile);
      }
    }
  }

  // Find the next candidate to open (for cycling through files)
  const currentFileIndex = files.indexOf(currentFile);
  let candidate = candidatePaths.find(
    (x) => files.indexOf(path.basename(x)) > currentFileIndex
  );

  // If no candidate is found after the current file, use the first one
  if (!candidate && candidatePaths.length > 0) {
    candidate = candidatePaths[0];
  }

  if (candidate) {
    // The file exists, so open it
    openFile(candidate, determineColumn(args.useOtherColumn));
  } else if (fileType === FileType.JS) {
    // The file does not exist, so prompt to create a companion
    promptToCreateCompanionFile(currentPath, args, fileType);
  } else {
    // The file does not exist, so show an error
    vscode.window.showErrorMessage(
      "styleswitch: No companion file found for " + currentFile
    );
  }
}

/**
 * Prompts the user to create a companion CSS file if one does not exist.
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
  const defaultName =
    baseName === INDEX && args.useDirectoryName
      ? `${dirName}${args.cssExtension}`
      : `${baseName}${args.cssExtension}`;

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
