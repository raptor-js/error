import { ServerError } from "@raptor-js/kernel";

import type { FileSystemAdapter } from "../../interfaces/file-system-adapter.ts";

export default class Deno implements FileSystemAdapter {
  /**
   * Read a file synchronously using the Deno runtime.
   *
   * @param path The path (or URL) to the file to read.
   * @returns The contents of a file as an array of bytes.
   */
  public readFileSync(path: string | URL): Uint8Array<ArrayBuffer> {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: the runtime global has no types here
      const Deno = (globalThis as any).Deno;

      if (Deno === "undefined") {
        throw new ServerError();
      }

      return Deno.readFileSync(path);
    } catch (error) {
      throw new ServerError(
        `Failed to read file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Read a text file using the Deno runtime.
   *
   * @param path The path (or URL) to the file to read.
   * @returns A promise resolving the text string.
   */
  public readTextFile(path: string | URL): string | Promise<string> {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: the runtime global has no types here
      const Deno = (globalThis as any).Deno;

      if (Deno === "undefined") {
        throw new ServerError();
      }

      return Deno.readTextFile(path);
    } catch (error) {
      throw new ServerError(
        `Failed to read file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
