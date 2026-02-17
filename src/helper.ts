// deno-lint-ignore-file no-explicit-any

import type { ErrorHandler } from "@raptor/framework";

import Service from "./error-handler.ts";

const instance = new Service();

/**
 * Prepare a new object which provides a great developer experience when
 * registering the error handler middleware.
 */
const errorHandler = new Proxy(instance.handle, {
  get(target, prop, receiver) {
    if (prop in instance) {
      const value = (instance as any)[prop];

      return typeof value === "function" ? value.bind(instance) : value;
    }

    return Reflect.get(target, prop, receiver);
  },

  set(_target, prop, value) {
    (instance as any)[prop] = value;

    return true;
  },
}) as ErrorHandler & Service;

export default errorHandler;
