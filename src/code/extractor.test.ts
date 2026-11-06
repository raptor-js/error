import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { mock, test } from "node:test";

import CodeExtractor from "./extractor.ts";

test("code extractor sets default offset", () => {
  const extractor = new CodeExtractor();

  assert.ok(extractor != null);
});

test("code extractor accepts custom offset", () => {
  const extractor = new CodeExtractor(5);

  assert.ok(extractor != null);
});

test("code extractor returns null for non-existent local file", async () => {
  const extractor = new CodeExtractor();

  const result = await extractor.extract("/non/existent/file.ts", 1);

  assert.deepStrictEqual(result, null);
});

test("code extractor returns null for invalid highlight line", async () => {
  const extractor = new CodeExtractor();

  const tempFile = join(tmpdir(), `extractor-${randomUUID()}`);

  await writeFile(tempFile, "line 1\nline 2\nline 3");

  try {
    const result = await extractor.extract(tempFile, 100);

    assert.deepStrictEqual(result, null);
  } finally {
    await rm(tempFile);
  }
});

test("code extractor returns null for line 0", async () => {
  const extractor = new CodeExtractor();

  const tempFile = join(tmpdir(), `extractor-${randomUUID()}`);

  await writeFile(tempFile, "line 1\nline 2\nline 3");

  try {
    const result = await extractor.extract(tempFile, 0);

    assert.deepStrictEqual(result, null);
  } finally {
    await rm(tempFile);
  }
});

test("code extractor returns null for NaN line", async () => {
  const extractor = new CodeExtractor();

  const tempFile = join(tmpdir(), `extractor-${randomUUID()}`);

  await writeFile(tempFile, "line 1\nline 2\nline 3");

  try {
    const result = await extractor.extract(tempFile, NaN);

    assert.deepStrictEqual(result, null);
  } finally {
    await rm(tempFile);
  }
});

test("code extractor creates valid snippet from local file", async () => {
  const extractor = new CodeExtractor(2);

  const tempFile = join(tmpdir(), `extractor-${randomUUID()}`);

  const content = "line 1\nline 2\nline 3\nline 4\nline 5";

  await writeFile(tempFile, content);

  try {
    const result = await extractor.extract(tempFile, 3);

    assert.ok(result != null);
    assert.deepStrictEqual(result.snippetLines.length, 5);
    assert.deepStrictEqual(result.decorationLine, 2);
    assert.deepStrictEqual(result.snippet.includes("line 3"), true);
  } finally {
    await rm(tempFile);
  }
});

test("code extractor handles first line", async () => {
  const extractor = new CodeExtractor(2);

  const tempFile = join(tmpdir(), `extractor-${randomUUID()}`);

  await writeFile(tempFile, "line 1\nline 2\nline 3");

  try {
    const result = await extractor.extract(tempFile, 1);

    assert.ok(result != null);
    assert.deepStrictEqual(result.decorationLine, 0);
    assert.deepStrictEqual(result.snippetLines[0], "line 1");
  } finally {
    await rm(tempFile);
  }
});

test("code extractor handles last line", async () => {
  const extractor = new CodeExtractor(2);

  const tempFile = join(tmpdir(), `extractor-${randomUUID()}`);

  await writeFile(tempFile, "line 1\nline 2\nline 3");

  try {
    const result = await extractor.extract(tempFile, 3);

    assert.ok(result != null);
    assert.deepStrictEqual(
      result.snippetLines[result.snippetLines.length - 1],
      "line 3",
    );
  } finally {
    await rm(tempFile);
  }
});

test("code extractor handles remote file with fetch", async () => {
  const extractor = new CodeExtractor(2);

  const fetchStub = mock.method(globalThis, "fetch", () =>
    Promise.resolve(new Response("line 1\nline 2\nline 3\nline 4\nline 5")),
  );

  try {
    const result = await extractor.extract("https://example.com/file.ts", 3);

    assert.ok(result != null);
    assert.deepStrictEqual(result.snippetLines.length, 5);
    assert.deepStrictEqual(result.decorationLine, 2);
  } finally {
    fetchStub.mock.restore();
  }
});

test("code extractor returns null for failed remote fetch", async () => {
  const extractor = new CodeExtractor(2);

  const fetchStub = mock.method(globalThis, "fetch", () =>
    Promise.resolve(new Response("", { status: 404 })),
  );

  try {
    const result = await extractor.extract("https://example.com/file.ts", 1);

    assert.deepStrictEqual(result, null);
  } finally {
    fetchStub.mock.restore();
  }
});

test("code extractor returns null when fetch throws", async () => {
  const extractor = new CodeExtractor(2);

  const fetchStub = mock.method(globalThis, "fetch", () =>
    Promise.reject(new Error("Network error")),
  );

  try {
    const result = await extractor.extract("https://example.com/file.ts", 1);

    assert.deepStrictEqual(result, null);
  } finally {
    fetchStub.mock.restore();
  }
});

test("code extractor validates correctly", () => {
  const extractor = new CodeExtractor();

  assert.deepStrictEqual(extractor["isValidHighlightLine"](1, 10), true);
  assert.deepStrictEqual(extractor["isValidHighlightLine"](10, 10), true);
  assert.deepStrictEqual(extractor["isValidHighlightLine"](0, 10), false);
  assert.deepStrictEqual(extractor["isValidHighlightLine"](11, 10), false);
  assert.deepStrictEqual(extractor["isValidHighlightLine"](NaN, 10), false);
});

test("code extractor with small offset", () => {
  const extractor = new CodeExtractor(1);

  const codeLines = ["line 1", "line 2", "line 3", "line 4", "line 5"];

  const result = extractor["createSnippet"](codeLines, 3);

  assert.ok(result != null);
  assert.deepStrictEqual(result.snippetLines.length, 3);
  assert.deepStrictEqual(result.snippetLines[0], "line 2");
  assert.deepStrictEqual(result.snippetLines[1], "line 3");
  assert.deepStrictEqual(result.snippetLines[2], "line 4");
  assert.deepStrictEqual(result.decorationLine, 1);
});

test("code extractor at file boundaries", () => {
  const extractor = new CodeExtractor(10);

  const codeLines = ["line 1", "line 2", "line 3"];

  const result = extractor["createSnippet"](codeLines, 2);

  assert.ok(result != null);
  assert.deepStrictEqual(result.snippetLines.length, 3);
  assert.deepStrictEqual(result.snippet, "line 1\nline 2\nline 3");
});
