import { ContentNegotiator, ServerError } from "@raptor/kernel";

import type {
  Context,
  ErrorHandler,
  HttpError as RaptorError,
} from "@raptor/types";

import type { Config } from "./config.ts";
import CodeExtractor from "./code/extractor.ts";
import CodeHighlighter from "./code/highlighter.ts";
import TemplateRenderer from "./template/renderer.ts";
import StackProcessor, { type StackTraceItem } from "./stack/processor.ts";

/**
 * The error handler middleware.
 */
export default class Handler {
  /**
   * Optional configuration for the handler.
   */
  private config?: Config;

  /**
   * The code snippet extractor.
   */
  private codeExtractor: CodeExtractor;

  /**
   * The error template renderer.
   */
  private templateRenderer: TemplateRenderer;

  /**
   * The code syntax highlighter.
   */
  private codeHighlighter: CodeHighlighter;

  /**
   * The error stack processor.
   */
  private stackProcessor: StackProcessor;

  constructor(config?: Config) {
    this.codeExtractor = new CodeExtractor();
    this.stackProcessor = new StackProcessor();
    this.templateRenderer = new TemplateRenderer();
    this.codeHighlighter = new CodeHighlighter();
    this.config = config ?? this.initialiseDefaultConfig();
  }

  /**
   * Wrapper to pre-bind this to the error handler method.
   */
  public get handle(): ErrorHandler {
    return (context: Context) => {
      return this.handleErrors(context);
    };
  }

  /**
   * Handle the current http context and process routes.
   *
   * @param context The current http context.
   *
   * @returns An HTTP response object.
   */
  public handleErrors(context: Context): Promise<Response> {
    if (!context.error) {
      throw new ServerError("No error was available in the context");
    }

    return this.transformResponse(context);
  }

  /**
   * Transform the response based on request content type and accept headers.
   *
   * @param error The error in the request.
   * @param context The context of the request.
   * @returns A valid response object in appropriate content type.
   */
  private async transformResponse(context: Context): Promise<Response> {
    if (!context.error) {
      throw new ServerError("No error was available in the context");
    }

    const { error } = context;

    const contentType = ContentNegotiator.negotiate(context.request);

    const status = "status" in error ? error.status : 500;
    const errors = "errors" in error ? error.errors : undefined;

    let body;

    switch (contentType) {
      case "application/json":
        body = JSON.stringify({
          name: error.name,
          message: error.message,
          status,
          errors,
        });
        break;

      case "text/html":
        body = await this.prepareHtmlBody(context);
        break;

      case "text/plain":
      default:
        body = `${error.name} - ${error.message}`;
        break;
    }

    context.response.headers.set(
      "content-type",
      `${contentType}; charset=utf-8`,
    );

    return new Response(body, {
      status: "status" in error ? error.status : 500,
      headers: context.response.headers,
    });
  }

  private async prepareHtmlBody(context: Context): Promise<string> {
    if (!context.error) {
      throw new ServerError("No error was available in the context");
    }

    this.stackProcessor.addStackData(context.error.stack as string);

    const stackLines = this.stackProcessor.process();

    if (!stackLines.length) {
      throw new ServerError();
    }

    let path = null;
    let extraction = null;
    let highlightLine = 1;

    for (const stackLine of stackLines) {
      if (!stackLine.file) continue;

      path = stackLine.file;
      highlightLine = stackLine.line ?? 1;

      extraction = await this.codeExtractor.extract(path, highlightLine);

      if (extraction) {
        break;
      }
    }

    if (!extraction) {
      throw new ServerError();
    }

    const { snippet, decorationLine, snippetLines } = extraction;

    const code = await this.codeHighlighter.highlightCode(
      snippet,
      snippetLines,
      decorationLine,
    );

    const templatePath = new URL(
      `../templates/${this.config?.env}.vto`,
      import.meta.url,
    );

    const template = await this.templateRenderer.render(
      templatePath.href,
      this.prepareResponsePayload(code, context.error, context, stackLines),
    );

    return template.content;
  }

  /**
   * Prepare the payload for response.
   *
   * @param code The code where the error originated.
   * @param error The error object.
   * @param context The request context.
   * @param stackLines The stack lines for the error.
   * @returns A prepared response payload.
   */
  private prepareResponsePayload(
    code: string,
    error: RaptorError | Error,
    context: Context,
    stackLines: StackTraceItem[],
  ) {
    return {
      code,
      context: {
        request: {
          url: context.request.url,
          method: context.request.method,
          referrer: context.request.referrer,
          headers: Object.fromEntries(
            context.request.headers.entries(),
          ),
        },
        response: {
          status: "status" in error ? error.status : 500,
        },
      },
      name: error.name,
      message: error.message,
      errors: "errors" in error ? error.errors : [],
      stack: {
        raw: error.stack,
        lines: stackLines,
      },
    };
  }

  /**
   * Initialise the default kernel options.
   *
   * @param options Optional error handler options object.
   * @returns A new error handler options object with defaults.
   */
  private initialiseDefaultConfig(
    config?: Config,
  ): Config {
    return {
      env: "production",
      ...config,
    };
  }
}
