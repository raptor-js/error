import assert from "node:assert/strict";
import { test } from "node:test";

import developmentPage, { type DevelopmentPage } from "./development.ts";

const page = (more: Partial<DevelopmentPage> = {}): DevelopmentPage => ({
  status: 422,
  name: "Validation Error",
  message: "The request was not valid",
  code: '<pre class="shiki">highlighted</pre>',
  stack: [
    { method: "handle", file: "/app/routes.ts", line: 12, col: 4 },
    { method: null, file: "/app/main.ts", line: 3, col: 1 },
  ],
  request: {
    url: "http://localhost/users",
    method: "POST",
    headers: { accept: "text/html" },
  },
  ...more,
});

test("development page shows the error, the code and the stack", () => {
  const html = developmentPage(page());

  assert.deepStrictEqual(html.includes("422 -"), true);
  assert.deepStrictEqual(html.includes("<em>Validation Error</em>"), true);
  assert.deepStrictEqual(
    html.includes('<pre class="shiki">highlighted</pre>'),
    true,
  );
  assert.deepStrictEqual(html.includes("Stack trace (2)"), true);
  assert.deepStrictEqual(
    html.includes('<div class="stack-line-method">handle</div>'),
    true,
  );
  assert.deepStrictEqual(html.includes("vscode://file//app/routes.ts"), true);
  assert.deepStrictEqual(html.includes("12:4"), true);
});

test("development page lists validation errors grouped by field", () => {
  const html = developmentPage(
    page({
      errors: { email: ["Invalid email"], name: ["Required", "Too short"] },
    }),
  );

  assert.deepStrictEqual(html.includes("Errors 3"), true);
  assert.deepStrictEqual(html.includes("<li>Invalid email</li>"), true);
  assert.deepStrictEqual(html.includes("<li>Too short</li>"), true);
});

test("development page lists validation errors given as lists", () => {
  const html = developmentPage(page({ errors: [["Invalid email"]] }));

  assert.deepStrictEqual(html.includes("Errors 1"), true);
  assert.deepStrictEqual(html.includes("<li>Invalid email</li>"), true);
});

test("development page leaves out errors when there are none", () => {
  assert.deepStrictEqual(
    developmentPage(page()).includes("errors card"),
    false,
  );
});

test("development page escapes what the request sent", () => {
  const html = developmentPage(
    page({
      message: "<img src=x onerror=alert(1)>",
      request: {
        url: "http://localhost/?q=<script>",
        method: "GET",
        headers: { "x-evil": '"><script>alert(1)</script>' },
      },
    }),
  );

  assert.deepStrictEqual(html.includes("<img src=x"), false);
  assert.deepStrictEqual(html.includes("<script>"), false);
  assert.deepStrictEqual(html.includes("&lt;script&gt;"), true);
});

test("development page shows request headers", () => {
  const html = developmentPage(page());

  assert.deepStrictEqual(html.includes('<div class="key">accept</div>'), true);
  assert.deepStrictEqual(
    html.includes('<div class="value">text/html</div>'),
    true,
  );
});
