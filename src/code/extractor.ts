import FileSystem from "../filesystem/manager.ts";

interface Snippet {
  snippet: string;
  decorationLine: number;
  snippetLines: string[];
}

/**
 * Extract originating code from the error.
 */
export default class CodeExtractor {
  /**
   * The code line offset.
   */
  private codeLineOffset: number;

  /**
   * The filesystem manager.
   */
  private fileSystem: FileSystem;

  /**
   * Construct a new code extractor.
   *
   * @param codeLineOffset The code line offset.
   */
  constructor(codeLineOffset: number = 10) {
    this.codeLineOffset = codeLineOffset;
    this.fileSystem = new FileSystem();
  }

  /**
   * @param filePath The path to the file.
   * @param highlightLine The line number to highlight.
   * @returns
   */
  async extract(
    filePath: string,
    highlightLine: number,
  ): Promise<null | Snippet> {
    const fileCode = await this.loadFileContent(filePath);

    if (!fileCode) return null;

    const codeLines = fileCode.split("\n");

    if (!this.isValidHighlightLine(highlightLine, codeLines.length)) {
      return null;
    }

    return this.createSnippet(codeLines, highlightLine);
  }

  /**
   * Load the contents of the file.
   *
   * @param filePath The path to the file.
   * @returns The contents of the file.
   */
  private loadFileContent(
    filePath: string,
  ): string | null | Promise<string | null> {
    const isRemote =
      filePath.startsWith("http://") || filePath.startsWith("https://");

    if (isRemote) {
      return this.fetchRemoteFile(filePath);
    }

    return this.readLocalFile(filePath);
  }

  /**
   * Fetch the remote file contents.
   *
   * @param url The URL to the remote file.
   * @returns The contents of the remote file.
   */
  private async fetchRemoteFile(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);

      if (!response.ok) return null;

      return await response.text();
    } catch {
      return null;
    }
  }

  /**
   * Read the local file contents.
   *
   * @param filePath The path to the file.
   * @returns The local file contents.
   */
  private readLocalFile(filePath: string): string | null {
    try {
      const data = this.fileSystem.readFileSync(filePath);

      return new TextDecoder().decode(data).trim();
    } catch {
      return null;
    }
  }

  /**
   * Check if the line is valid for highlighting.
   *
   * @param line The line number to highlight.
   * @param totalLines The total number of lines.
   * @returns Boolean indicating whether the highlighted line is valid.
   */
  private isValidHighlightLine(line: number, totalLines: number): boolean {
    return (
      typeof line === "number" && !isNaN(line) && line > 0 && line <= totalLines
    );
  }

  /**
   * Create a snippet.
   *
   * @param codeLines The lines of code.
   * @param highlightLine The highlighted line.
   * @returns A snippet for the code extractor.
   */
  private createSnippet(
    codeLines: string[],
    highlightLine: number,
  ): Snippet | null {
    const zeroBasedHighlight = highlightLine - 1;

    const start = Math.max(0, zeroBasedHighlight - this.codeLineOffset);

    const end = Math.min(
      codeLines.length,
      zeroBasedHighlight + this.codeLineOffset + 1,
    );

    const snippetLines = codeLines.slice(start, end);

    if (!snippetLines.length) return null;

    return {
      snippet: snippetLines.join("\n"),
      decorationLine: zeroBasedHighlight - start,
      snippetLines,
    };
  }
}
