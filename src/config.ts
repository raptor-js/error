type Environment = "development" | "production";

export interface Config {
  /**
   * Whether the system should render in development or production.
   */
  env?: Environment;
}
