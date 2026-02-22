import { codeToHtml } from "shiki";

/**
 * The code highlighter.
 */
export default class CodeHighlighter {
  /**
   * Highlight the code as HTML.
   *
   * @param snippet The snippet to highlight.
   * @param snippetLines The lines of the snippet
   * @param decorationLine The deocration line.
   * @returns The highlighted code HTML.
   */
  async highlightCode(
    snippet: string,
    snippetLines: string[],
    decorationLine: number,
  ): Promise<string> {
    if (!snippet || !snippetLines || snippetLines.length === 0) {
      throw new Error("Cannot highlight empty snippet");
    }

    if (
      decorationLine < 0 ||
      decorationLine >= snippetLines.length
    ) {
      throw new Error(
        `Decoration line is out of bounds: ${decorationLine} (snippet has ${snippetLines.length} lines)`,
      );
    }

    const decorations = [
      {
        start: { line: decorationLine, character: 0 },
        end: {
          line: decorationLine,
          character: snippetLines[decorationLine].length,
        },
        properties: { class: "highlighted-line" },
      },
    ];

    return await codeToHtml(snippet, {
      lang: "ts",
      theme: "rose-pine",
      decorations,
    });
  }
}
