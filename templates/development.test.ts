/// <reference lib="deno.ns" />

import { assertEquals } from "@std/assert";

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
    headers: { "accept": "text/html" },
  },
  ...more,
});

Deno.test("development page shows the error, the code and the stack", () => {
  const html = developmentPage(page());

  assertEquals(html.includes("422 -"), true);
  assertEquals(html.includes("<em>Validation Error</em>"), true);
  assertEquals(html.includes('<pre class="shiki">highlighted</pre>'), true);
  assertEquals(html.includes("Stack trace (2)"), true);
  assertEquals(
    html.includes('<div class="stack-line-method">handle</div>'),
    true,
  );
  assertEquals(html.includes("vscode://file//app/routes.ts"), true);
  assertEquals(html.includes("12:4"), true);
});

Deno.test("development page lists validation errors grouped by field", () => {
  const html = developmentPage(page({
    errors: { email: ["Invalid email"], name: ["Required", "Too short"] },
  }));

  assertEquals(html.includes("Errors 3"), true);
  assertEquals(html.includes("<li>Invalid email</li>"), true);
  assertEquals(html.includes("<li>Too short</li>"), true);
});

Deno.test("development page lists validation errors given as lists", () => {
  const html = developmentPage(page({ errors: [["Invalid email"]] }));

  assertEquals(html.includes("Errors 1"), true);
  assertEquals(html.includes("<li>Invalid email</li>"), true);
});

Deno.test("development page leaves out errors when there are none", () => {
  assertEquals(developmentPage(page()).includes("errors card"), false);
});

Deno.test("development page escapes what the request sent", () => {
  const html = developmentPage(page({
    message: "<img src=x onerror=alert(1)>",
    request: {
      url: "http://localhost/?q=<script>",
      method: "GET",
      headers: { "x-evil": '"><script>alert(1)</script>' },
    },
  }));

  assertEquals(html.includes("<img src=x"), false);
  assertEquals(html.includes("<script>"), false);
  assertEquals(html.includes("&lt;script&gt;"), true);
});

Deno.test("development page shows request headers", () => {
  const html = developmentPage(page());

  assertEquals(html.includes('<div class="key">accept</div>'), true);
  assertEquals(html.includes('<div class="value">text/html</div>'), true);
});
