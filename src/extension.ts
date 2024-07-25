"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface CommandArguments {
  jsExtension: string;
  cssExtension: string;
  useDirName: boolean;
}

enum FileType {
  JS,
  CSS,
  UNKNOWN,
}

const JS_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const CSS_EXTENSIONS = [".module.scss", ".css", ".scss", ".sass"];
const EXTENSIONS = [...JS_EXTENSIONS, ...CSS_EXTENSIONS];

function getFileType(extension: string): FileType {
  if (JS_EXTENSIONS.includes(extension)) {
    return FileType.JS;
  }
  if (CSS_EXTENSIONS.includes(extension)) {
    return FileType.CSS;
  }
  return FileType.UNKNOWN;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("styleswitch", (args: any) =>
      switchToFile(args)
    )
  );
}

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

function parseArgs(args: any): CommandArguments {
  const jsExtension = args.jsExtension || ".css";
  const cssExtension = args.cssExtension || ".js";
  const useDirName = args.useDirName || true;

  return {
    jsExtension,
    cssExtension,
    useDirName,
  };
}

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
  const index = candidates.indexOf(currentPath);
  const filteredCandidates = candidates.filter((_, i) => i !== index);
  if (filteredCandidates.length === 0 && args.useDirName) {
    const dirName = path.basename(path.dirname(currentPath));
    for (let e of EXTENSIONS) {
      const folderFile = path.join(path.dirname(currentPath), `${dirName}${e}`);
      if (filesMap[`${dirName}${e}`]) {
        candidates.push(folderFile);
      }
    }
  }

  const selfIndex = candidates.indexOf(currentPath);
  const nextIndex = (selfIndex + 1) % candidates.length;
  const candidate = candidates[nextIndex];

  // If a candidate is found, and it is not the current file, open it
  if (candidate && candidate !== currentPath) {
    openFile(candidate, determineColumn(true));
  } else {
    promptToCreateCompanionFile(currentPath, args, fileType);
  }
}

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
      baseName === "index" && args.useDirName
        ? `${dirName}${args.cssExtension}`
        : `${baseName}${args.cssExtension}`;
  } else if (fileType === FileType.CSS) {
    defaultName =
      baseName === "index" && args.useDirName
        ? `${dirName}${args.jsExtension}`
        : `${baseName}${args.jsExtension}`;
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
          openFile(newFilePath, determineColumn(true));
        }
      });
    });
}

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

function openFile(path: string, column: number): boolean {
  vscode.workspace
    .openTextDocument(path)
    .then((x) => vscode.window.showTextDocument(x, column));

  return true;
}

// this method is called when your extension is deactivated
export function deactivate() {}
