"use strict";

import { Range, TextEditor, window } from "vscode";
import { insertContentToEditor, setCursorPosition, isMarkdownFileCheck, noActiveEditorMessage } from "../helper/common";
import { isCursorInsideYamlHeader } from "../helper/yaml-metadata";
import { sendTelemetryData } from "../helper/telemetry";

const telemetryCommand: string = "insertMoniker";
let sign: string = "";

export function insertMonikerCommand() {
    const commands = [
        { command: insertMoniker.name, callback: insertMoniker },
    ];
    return commands;
}

export function insertMoniker() {
    const editor = window.activeTextEditor;
    if (!editor) {
        noActiveEditorMessage();
        return;
    }

    if (!isMarkdownFileCheck(editor, false)) {
        return;
    }

    const moniker_options = [
        "range equals",
        "range greater than or equal",
        "range less than or equal",
    ];

    window.showQuickPick(moniker_options).then((qpSelection) => {
        if (!qpSelection) {
            return;
        }
        if (qpSelection == moniker_options[0]) {
            sign = "";

        }
        if (qpSelection == moniker_options[1]) {
            sign = ">=";
        }
        if (qpSelection == moniker_options[2]) {
            sign = "<=";
        }

        // is this a markdown file
        if (!isMarkdownFileCheck(editor, false)) {
            return;
        }

        //is cursor on a new line 
        if (isContentOnCurrentLine(editor)) {
            window.showErrorMessage("Moniker must be inserted on a new line.");
            return;
        }

        // if markdown, is the user's cursor in the yaml header?
        if (isCursorInsideYamlHeader(editor)) {
            insertYamlMoniker(editor, sign);
        } else {
            insertMarkdownMoniker(editor, sign);
        }



    });
}


// cursor is in the YAML metadata block
function insertYamlMoniker(editor: TextEditor, sign: string) {

    const insertText = `monikerRange: '${sign}'`;
    const cursorIndex = insertText.indexOf("'") + sign.length + 1;
    insertContentToEditor(editor, insertYamlMoniker.name, insertText, false);
    setCursorPosition(editor, editor.selection.active.line, cursorIndex);

    const cursorPosition = "yaml-header";
    sendTelemetryData(telemetryCommand, cursorPosition);
}


//cursor is in the Markdown body of the file
export function insertMarkdownMoniker(editor: TextEditor, sign: string) {

    const insertText = `::: moniker range="${sign}"\n\n::: moniker-end`;
    insertContentToEditor(editor, insertMarkdownMoniker.name, insertText, false);
    const cursorIndex = insertText.indexOf(`"`) + sign.length + 1;
    setCursorPosition(editor, editor.selection.active.line, cursorIndex);
    const cursorPosition = "markdown-body";
    sendTelemetryData(telemetryCommand, cursorPosition);

}

export function isContentOnCurrentLine(editor: TextEditor): boolean {
    const range = new Range(editor.selection.active.line, 0, editor.selection.active.line, 1000);
    const lineText = editor.document.getText(range);
    if (lineText === "") { return false; }
    return !(/^\s+$/.test(lineText));
}
