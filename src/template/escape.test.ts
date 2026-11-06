import assert from "node:assert/strict";
import { test } from "node:test";

import escape from "./escape.ts";

test("escape writes out every character HTML gives meaning to", () => {
  assert.deepStrictEqual(
    escape(`<a href="x" title='y'>&</a>`),
    "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
  );
});

test("escape leaves plain text alone", () => {
  assert.deepStrictEqual(escape("Not Found"), "Not Found");
});

test("escape turns nothing into an empty string", () => {
  assert.deepStrictEqual(escape(undefined), "");
  assert.deepStrictEqual(escape(null), "");
});

test("escape writes numbers as text", () => {
  assert.deepStrictEqual(escape(404), "404");
});
