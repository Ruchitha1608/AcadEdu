declare module 'plotly.js-dist-min' {
  export function newPlot(
    root: HTMLElement | string,
    data: object[],
    layout?: object,
    config?: object
  ): Promise<void>;
  export function purge(root: HTMLElement | string): void;
}
