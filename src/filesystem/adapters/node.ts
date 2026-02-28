import { ServerError } from "@raptor/kernel";

import type { FileSystemAdapter } from "../../interfaces/file-system-adapter.ts";

export default class Node implements FileSystemAdapter {
  /**
   * Read a file synchronously using the Node runtime.
   *
   * @param path The path (or URL) to the file to read.
   * @returns The contents of a file as an array of bytes.
   */
  public readFileSync(path: string | URL): Uint8Array<ArrayBuffer> {
    try {
      const fs = require("node:fs");

      const filePath = path instanceof URL ? path.pathname : path;

      const buffer = fs.readFileSync(filePath);

      return new Uint8Array(buffer);
    } catch (error) {
      throw new ServerError(
        `Failed to read file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Read a text file using the Node runtime.
   *
   * @param path The path (or URL) to the file to read.
   * @returns A promise resolving the text string.
   */
  public async readTextFile(path: string | URL): Promise<string> {
    try {
      const { readFile } = await import("node:fs/promises");

      const filePath = path instanceof URL ? path.pathname : path;

      return await readFile(filePath, "utf-8");
    } catch (error) {
      throw new ServerError(
        `Failed to read file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
