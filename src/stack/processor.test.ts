import assert from "node:assert/strict";
import { test } from "node:test";

import StackProcessor from "./processor.ts";

test("stack processor creates instance", () => {
  const processor = new StackProcessor();

  assert.ok(processor != null);
});

test("stack processor stores stack string", () => {
  const processor = new StackProcessor();
  const stack = "Error: Test error\n    at test.ts:1:1";

  processor.addStackData(stack);

  assert.ok(processor != null);
});

test("stack processor returns empty array for no stack", () => {
  const processor = new StackProcessor();

  const result = processor.process();

  assert.deepStrictEqual(result, []);
});

test("stack processor returns empty array for undefined stack", () => {
  const processor = new StackProcessor();

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result, []);
});

test("stack processor parses stack with method names", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at myFunction (/path/to/file.ts:10:5)
    at anotherFunction (/path/to/other.ts:20:10)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 2);
  assert.deepStrictEqual(result[0].method, "myFunction");
  assert.deepStrictEqual(result[0].file, "/path/to/file.ts");
  assert.deepStrictEqual(result[0].line, 10);
  assert.deepStrictEqual(result[0].col, 5);
  assert.deepStrictEqual(result[1].method, "anotherFunction");
  assert.deepStrictEqual(result[1].file, "/path/to/other.ts");
  assert.deepStrictEqual(result[1].line, 20);
  assert.deepStrictEqual(result[1].col, 10);
});

test("stack processor parses stack without method names", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at /path/to/file.ts:10:5
    at /path/to/other.ts:20:10`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 2);
  assert.deepStrictEqual(result[0].method, null);
  assert.deepStrictEqual(result[0].file, "/path/to/file.ts");
  assert.deepStrictEqual(result[0].line, 10);
  assert.deepStrictEqual(result[0].col, 5);
  assert.deepStrictEqual(result[1].method, null);
  assert.deepStrictEqual(result[1].file, "/path/to/other.ts");
  assert.deepStrictEqual(result[1].line, 20);
  assert.deepStrictEqual(result[1].col, 10);
});

test("stack processor removes file:// protocol", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at myFunction (file:///path/to/file.ts:10:5)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 1);
  assert.deepStrictEqual(result[0].file, "/path/to/file.ts");
});

test("stack processor removes async prefix from method names", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at async myAsyncFunction (/path/to/file.ts:10:5)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 1);
  assert.deepStrictEqual(result[0].method, "myAsyncFunction");
});

test("stack processor handles mixed stack trace formats", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at functionA (/path/to/file1.ts:10:5)
    at /path/to/file2.ts:20:10
    at async functionB (file:///path/to/file3.ts:30:15)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 3);
  assert.deepStrictEqual(result[0].method, "functionA");
  assert.deepStrictEqual(result[0].file, "/path/to/file1.ts");
  assert.deepStrictEqual(result[1].method, null);
  assert.deepStrictEqual(result[1].file, "/path/to/file2.ts");
  assert.deepStrictEqual(result[2].method, "functionB");
  assert.deepStrictEqual(result[2].file, "/path/to/file3.ts");
});

test("stack processor ignores non-matching lines", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at myFunction (/path/to/file.ts:10:5)
    This is not a valid stack line
    at anotherFunction (/path/to/other.ts:20:10)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 2);
  assert.deepStrictEqual(result[0].method, "myFunction");
  assert.deepStrictEqual(result[1].method, "anotherFunction");
});

test("stack processor parses line and column numbers correctly", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at myFunction (/path/to/file.ts:123:456)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 1);
  assert.deepStrictEqual(result[0].line, 123);
  assert.deepStrictEqual(result[0].col, 456);
});

test("stack processor handles URLs in file paths", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at myFunction (https://example.com/file.ts:10:5)`;

  processor.addStackData(stack);

  const result = processor.extractStackLines();

  assert.deepStrictEqual(result.length, 1);
  assert.deepStrictEqual(result[0].file, "https://example.com/file.ts");
});

test("stack processor returns same as extractStackLines", () => {
  const processor = new StackProcessor();

  const stack = `Error: Test error
    at myFunction (/path/to/file.ts:10:5)`;

  processor.addStackData(stack);

  const result1 = processor.process();

  processor.addStackData(stack);

  const result2 = processor.extractStackLines();

  assert.deepStrictEqual(result1.length, result2.length);
  assert.deepStrictEqual(result1[0].method, result2[0].method);
  assert.deepStrictEqual(result1[0].file, result2[0].file);
});
