import assert from "node:assert/strict";
import { test } from "node:test";

import CodeHighlighter from "./highlighter.ts";

test("code highlighter creates instance", () => {
  const highlighter = new CodeHighlighter();

  assert.ok(highlighter != null);
});

test("code highlighter throws error for empty snippet", async () => {
  const highlighter = new CodeHighlighter();

  await assert.rejects(
    async () => await highlighter.highlightCode("", [], 0),
    (error) =>
      error instanceof Error &&
      error.message.includes("Cannot highlight empty snippet"),
  );
});

test("code highlighter throws error for empty snippetLines", async () => {
  const highlighter = new CodeHighlighter();

  await assert.rejects(
    async () => await highlighter.highlightCode("some code", [], 0),
    (error) =>
      error instanceof Error &&
      error.message.includes("Cannot highlight empty snippet"),
  );
});

test("code highlighter throws error for negative decoration line", async () => {
  const highlighter = new CodeHighlighter();

  const snippetLines = ["line 1", "line 2", "line 3"];

  await assert.rejects(
    async () =>
      await highlighter.highlightCode(
        "line 1\nline 2\nline 3",
        snippetLines,
        -1,
      ),
    (error) =>
      error instanceof Error &&
      error.message.includes("Decoration line is out of bounds"),
  );
});

test("code highlighter throws error for out of bounds decoration line", async () => {
  const highlighter = new CodeHighlighter();

  const snippetLines = ["line 1", "line 2", "line 3"];

  await assert.rejects(
    async () =>
      await highlighter.highlightCode(
        "line 1\nline 2\nline 3",
        snippetLines,
        10,
      ),
    (error) =>
      error instanceof Error &&
      error.message.includes(
        "Decoration line is out of bounds: 10 (snippet has 3 lines)",
      ),
  );
});

test("code highlighter throws error when decoration line equals length", async () => {
  const highlighter = new CodeHighlighter();

  const snippetLines = ["line 1", "line 2", "line 3"];

  await assert.rejects(
    async () =>
      await highlighter.highlightCode(
        "line 1\nline 2\nline 3",
        snippetLines,
        3,
      ),
    (error) =>
      error instanceof Error &&
      error.message.includes("Decoration line is out of bounds"),
  );
});

test("code highlighter returns HTML string for valid input", async () => {
  const highlighter = new CodeHighlighter();

  const snippet = "const x = 1;\nconst y = 2;\nconst z = 3;";

  const snippetLines = ["const x = 1;", "const y = 2;", "const z = 3;"];

  const result = await highlighter.highlightCode(snippet, snippetLines, 1);

  assert.ok(result != null);
  assert.deepStrictEqual(typeof result, "string");
  assert.deepStrictEqual(result.includes("<"), true);
  assert.deepStrictEqual(result.includes(">"), true);
});

test("code highlighter handles first line decoration", async () => {
  const highlighter = new CodeHighlighter();

  const snippet = "line 1\nline 2\nline 3";

  const snippetLines = ["line 1", "line 2", "line 3"];

  const result = await highlighter.highlightCode(snippet, snippetLines, 0);

  assert.ok(result != null);
  assert.deepStrictEqual(typeof result, "string");
});

test("code highlighter handles last line decoration", async () => {
  const highlighter = new CodeHighlighter();

  const snippet = "line 1\nline 2\nline 3";

  const snippetLines = ["line 1", "line 2", "line 3"];

  const result = await highlighter.highlightCode(snippet, snippetLines, 2);

  assert.ok(result != null);
  assert.deepStrictEqual(typeof result, "string");
});

test("code highlighter applies highlighted-line class", async () => {
  const highlighter = new CodeHighlighter();

  const snippet = "const x = 1;\nconst y = 2;";

  const snippetLines = ["const x = 1;", "const y = 2;"];

  const result = await highlighter.highlightCode(snippet, snippetLines, 0);

  assert.ok(result != null);
  assert.deepStrictEqual(result.includes("highlighted-line"), true);
});
