/// <reference lib="deno.ns" />

import { assertEquals } from "@std/assert";

import escape from "./escape.ts";

Deno.test("escape writes out every character HTML gives meaning to", () => {
  assertEquals(
    escape(`<a href="x" title='y'>&</a>`),
    "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
  );
});

Deno.test("escape leaves plain text alone", () => {
  assertEquals(escape("Not Found"), "Not Found");
});

Deno.test("escape turns nothing into an empty string", () => {
  assertEquals(escape(undefined), "");
  assertEquals(escape(null), "");
});

Deno.test("escape writes numbers as text", () => {
  assertEquals(escape(404), "404");
});
