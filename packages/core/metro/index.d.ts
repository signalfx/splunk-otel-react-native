export interface SplunkRumMetroOptions {
  /** Stable logical name included as a runtime registration hint. */
  bundleName?: string;
}

export function withSplunkRumConfig<T>(
  config: T,
  options?: SplunkRumMetroOptions
): T;
