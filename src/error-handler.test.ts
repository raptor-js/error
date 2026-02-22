/// <reference lib="deno.ns" />
// deno-lint-ignore-file

import { assertEquals, assertRejects } from "@std/assert";
import { type Context, ServerError } from "@raptor/framework";

import ErrorHandler from "./error-handler.ts";

Deno.test("error handler constructor initializes with default options", () => {
  const handler = new ErrorHandler();

  assertEquals(typeof handler, "object");
});

Deno.test("error handler constructor accepts custom options", () => {
  const handler = new ErrorHandler({ env: "development" });

  assertEquals(typeof handler, "object");
});

Deno.test("error handler throws when no error in context", async () => {
  const handler = new ErrorHandler();

  const context = {
    error: null,
    request: {},
    response: { headers: new Headers() },
  } as unknown as Context;

  await assertRejects(
    async () => await handler.handle(context),
    ServerError,
    "No error was available in the context",
  );
});

Deno.test("error handler returns JSON for application/json", async () => {
  const handler = new ErrorHandler();

  const error = new Error("Test error");

  const context = {
    error,
    request: {
      url: "http://localhost/test",
      method: "GET",
      headers: new Headers({ "accept": "application/json" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);

  const body = await response.json();

  assertEquals(response.status, 500);
  assertEquals(body.name, "Error");
  assertEquals(body.message, "Test error");
  assertEquals(body.status, 500);
});

Deno.test("error handler returns plain text for text/plain", async () => {
  const handler = new ErrorHandler();
  const error = new Error("Test error");
  const context = {
    error,
    request: {
      url: "http://localhost/test",
      method: "GET",
      headers: new Headers(),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);
  const body = await response.text();

  assertEquals(response.status, 500);
  assertEquals(body, "Error - Test error");
});

Deno.test("error handler handles custom status codes", async () => {
  const handler = new ErrorHandler();

  const error = {
    name: "NotFoundError",
    message: "Resource not found",
    status: 404,
    stack: "Error stack",
  };

  const context = {
    error,
    request: {
      url: "http://localhost/test",
      method: "GET",
      headers: new Headers({ "accept": "application/json" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);

  const body = await response.json();

  assertEquals(response.status, 404);
  assertEquals(body.status, 404);
});

Deno.test("error handler includes validation errors", async () => {
  const handler = new ErrorHandler();

  const error = {
    name: "ValidationError",
    message: "Validation failed",
    status: 422,
    errors: [{ field: "email", message: "Invalid email" }],
    stack: "Error stack",
  };

  const context = {
    error,
    request: {
      url: "http://localhost/test",
      method: "POST",
      headers: new Headers({ "accept": "application/json" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);

  const body = await response.json();

  assertEquals(body.errors.length, 1);
  assertEquals(body.errors[0].field, "email");
});

Deno.test("error handler creates correct structure", () => {
  const handler = new ErrorHandler();

  const code = "<div>highlighted code</div>";

  const error = new Error("Test error");

  error.stack = "Error: Test error\n    at test.ts:1:1";

  const context = {
    request: {
      url: "http://localhost/test",
      method: "GET",
      referrer: "",
      headers: new Headers({ "accept": "application/json" }),
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const stackLines = [
    {
      method: "test",
      file: "/test.ts",
      line: 1,
      col: 1,
    },
  ];

  const payload = handler["prepareResponsePayload"](
    code,
    error,
    context,
    stackLines,
  );

  assertEquals(payload.code, code);
  assertEquals(payload.name, "Error");
  assertEquals(payload.message, "Test error");
  assertEquals(payload.context.request.method, "GET");
  assertEquals(payload.context.response.status, 500);
  assertEquals(payload.stack.lines.length, 1);
});

Deno.test("error handler sets production env", () => {
  const handler = new ErrorHandler();

  const options = handler["initialiseDefaultConfig"]();

  assertEquals(options.env, "production");
});

Deno.test("error handler merges custom options", () => {
  const handler = new ErrorHandler();
  const options = handler["initialiseDefaultConfig"]({ env: "development" });

  assertEquals(options.env, "development");
});
