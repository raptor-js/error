import { ServerError } from "@raptor-js/kernel";
import type { Context } from "@raptor-js/types";
import assert from "node:assert/strict";
import { test } from "node:test";

import ErrorHandler from "./error-handler.ts";

test("error handler constructor initializes with default options", () => {
  const handler = new ErrorHandler();

  assert.deepStrictEqual(typeof handler, "object");
});

test("error handler constructor accepts custom options", () => {
  const handler = new ErrorHandler({ env: "development" });

  assert.deepStrictEqual(typeof handler, "object");
});

test("error handler throws when no error in context", async () => {
  const handler = new ErrorHandler();

  const context = {
    error: null,
    request: {},
    response: { headers: new Headers() },
  } as unknown as Context;

  await assert.rejects(
    async () => await handler.handle(context),
    (error) =>
      error instanceof ServerError &&
      error.message.includes("No error was available in the context"),
  );
});

test("error handler returns JSON for application/json", async () => {
  const handler = new ErrorHandler();

  const error = new Error("Test error");

  const context = {
    error,
    request: {
      url: "http://localhost/test",
      method: "GET",
      headers: new Headers({ accept: "application/json" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);

  const body = await response.json();

  assert.deepStrictEqual(response.status, 500);
  assert.deepStrictEqual(body.name, "Error");
  assert.deepStrictEqual(body.message, "Test error");
  assert.deepStrictEqual(body.status, 500);
});

test("error handler returns plain text for text/plain", async () => {
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

  assert.deepStrictEqual(response.status, 500);
  assert.deepStrictEqual(body, "Error - Test error");
});

test("error handler handles custom status codes", async () => {
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
      headers: new Headers({ accept: "application/json" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);

  const body = await response.json();

  assert.deepStrictEqual(response.status, 404);
  assert.deepStrictEqual(body.status, 404);
});

test("error handler includes validation errors", async () => {
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
      headers: new Headers({ accept: "application/json" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  } as unknown as Context;

  const response = await handler["transformResponse"](context);

  const body = await response.json();

  assert.deepStrictEqual(body.errors.length, 1);
  assert.deepStrictEqual(body.errors[0].field, "email");
});

test("error handler creates correct structure", () => {
  const handler = new ErrorHandler();

  const code = "<div>highlighted code</div>";

  const error = new Error("Test error");

  error.stack = "Error: Test error\n    at test.ts:1:1";

  const context = {
    request: {
      url: "http://localhost/test",
      method: "GET",
      referrer: "",
      headers: new Headers({ accept: "application/json" }),
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

  assert.deepStrictEqual(payload.code, code);
  assert.deepStrictEqual(payload.name, "Error");
  assert.deepStrictEqual(payload.message, "Test error");
  assert.deepStrictEqual(payload.request.method, "GET");
  assert.deepStrictEqual(payload.status, 500);
  assert.deepStrictEqual(payload.stack.length, 1);
});

test("error handler sets production env", () => {
  const handler = new ErrorHandler();

  const options = handler["initialiseDefaultConfig"]();

  assert.deepStrictEqual(options.env, "production");
});

test("error handler merges custom options", () => {
  const handler = new ErrorHandler();
  const options = handler["initialiseDefaultConfig"]({ env: "development" });

  assert.deepStrictEqual(options.env, "development");
});

const asBrowser = (error: Error) =>
  ({
    error,
    request: {
      url: "http://localhost/test",
      method: "GET",
      headers: new Headers({ accept: "text/html" }),
      referrer: "",
    },
    response: { headers: new Headers() },
  }) as unknown as Context;

const notFound = (message: string) => {
  const error = Object.assign(new Error(message), {
    name: "Not Found",
    status: 404,
  });

  error.stack = undefined;

  return error;
};

test("error handler renders the production page without a stack or disk", async () => {
  const handler = new ErrorHandler({ env: "production" });

  const response = await handler["transformResponse"](
    asBrowser(notFound("The resource requested could not be found")),
  );

  const body = await response.text();

  assert.deepStrictEqual(response.status, 404);
  assert.deepStrictEqual(
    response.headers.get("content-type"),
    "text/html; charset=utf-8",
  );
  assert.deepStrictEqual(
    body.includes("<h1>404 - <em>Not Found</em></h1>"),
    true,
  );
  assert.deepStrictEqual(
    body.includes("<title>404 Not Found - The resource requested"),
    true,
  );
});

test("error handler escapes the production page", async () => {
  const handler = new ErrorHandler({ env: "production" });

  const response = await handler["transformResponse"](
    asBrowser(notFound("<script>alert(1)</script>")),
  );

  const body = await response.text();

  assert.deepStrictEqual(body.includes("<script>alert(1)</script>"), false);
  assert.deepStrictEqual(
    body.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
    true,
  );
});

test("error handler treats a missing env as production", async () => {
  const handler = new ErrorHandler({});

  const response = await handler["transformResponse"](
    asBrowser(notFound("Gone")),
  );

  assert.deepStrictEqual(response.status, 404);
  assert.deepStrictEqual(
    (await response.text()).includes("<em>Not Found</em>"),
    true,
  );
});
