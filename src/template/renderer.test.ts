/// <reference lib="deno.ns" />
// deno-lint-ignore-file

import { stub } from "@std/testing/mock";
import { ServerError } from "@raptor/kernel";
import { assertEquals, assertExists, assertRejects } from "@std/assert";

import TemplateRenderer from "./renderer.ts";

Deno.test("template renderer creates instance", () => {
  const renderer = new TemplateRenderer();

  assertExists(renderer);
});

Deno.test("template renderer throws error for empty template", async () => {
  const renderer = new TemplateRenderer();

  const tempFile = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFile, "   ");

  try {
    await assertRejects(
      async () => await renderer.render(`file://${tempFile}`, {}),
      ServerError,
      "Template file is empty",
    );
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("template renderer processes valid template", async () => {
  const renderer = new TemplateRenderer();

  const tempFile = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFile, "<h1>{{ title }}</h1>");

  try {
    const result = await renderer.render(`file://${tempFile}`, {
      title: "Test",
    });

    assertExists(result);
    assertExists(result.content);
    assertEquals(typeof result.content, "string");
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("template renderer interpolates context variables", async () => {
  const renderer = new TemplateRenderer();

  const tempFile = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFile, "<h1>{{ name }}</h1><p>{{ message }}</p>");

  try {
    const result = await renderer.render(`file://${tempFile}`, {
      name: "John",
      message: "Hello World",
    });

    assertExists(result);
    assertEquals(result.content.includes("John"), true);
    assertEquals(result.content.includes("Hello World"), true);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("template renderer handles local files", async () => {
  const renderer = new TemplateRenderer();

  const tempFile = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFile, "<div>Local Template</div>");

  try {
    const content = await renderer["loadTemplate"](`file://${tempFile}`);

    assertEquals(content, "<div>Local Template</div>");
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("template renderer handles remote templates", async () => {
  const renderer = new TemplateRenderer();

  const fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response("<div>Remote Template</div>")),
  );

  try {
    const content = await renderer["loadTemplate"](
      "https://example.com/template.vto",
    );

    assertEquals(content, "<div>Remote Template</div>");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("template renderer throws ServerError for 404", async () => {
  const renderer = new TemplateRenderer();

  const fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response("", { status: 404 })),
  );

  try {
    await assertRejects(
      async () =>
        await renderer["fetchRemoteTemplate"](
          "https://example.com/missing.vto",
        ),
      ServerError,
      "Template file not found",
    );
  } finally {
    fetchStub.restore();
  }
});

Deno.test("template renderer throws ServerError on network error", async () => {
  const renderer = new TemplateRenderer();

  const fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.reject(new Error("Network error")),
  );

  try {
    await assertRejects(
      async () =>
        await renderer["fetchRemoteTemplate"](
          "https://example.com/template.vto",
        ),
      ServerError,
      "Template file not found",
    );
  } finally {
    fetchStub.restore();
  }
});

Deno.test("template renderer determines remote vs local correctly", async () => {
  const renderer = new TemplateRenderer();

  const fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response("remote")),
  );

  try {
    const httpContent = await renderer["loadTemplate"](
      "http://example.com/template.vto",
    );
    assertEquals(httpContent, "remote");

    const httpsContent = await renderer["loadTemplate"](
      "https://example.com/template.vto",
    );
    assertEquals(httpsContent, "remote");
  } finally {
    fetchStub.restore();
  }
});

Deno.test("template renderer handles complex nested context", async () => {
  const renderer = new TemplateRenderer();

  const tempFile = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFile, "<h1>{{ user.name }}</h1>");

  try {
    const result = await renderer.render(`file://${tempFile}`, {
      user: { name: "Alice" },
    });

    assertExists(result);
    assertEquals(result.content.includes("Alice"), true);
  } finally {
    await Deno.remove(tempFile);
  }
});

Deno.test("template renderer handles empty context", async () => {
  const renderer = new TemplateRenderer();

  const tempFile = await Deno.makeTempFile();

  await Deno.writeTextFile(tempFile, "<h1>Static Content</h1>");

  try {
    const result = await renderer.render(`file://${tempFile}`, {});

    assertExists(result);
    assertEquals(result.content.includes("Static Content"), true);
  } finally {
    await Deno.remove(tempFile);
  }
});
