import type { ErrorHandler } from "@raptor/kernel";

import Handler from "./error-handler.ts";
import type { Config } from "./config.ts";

export default function errorHandler(config?: Config): ErrorHandler {
  const instance = new Handler(config);

  return instance.handle;
}
