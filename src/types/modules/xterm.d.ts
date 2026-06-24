declare module '@xterm/xterm' {
  export class Terminal {
    constructor(options?: any);
    open(element: HTMLElement): void;
    write(data: string): void;
    onData(callback: (data: string) => void): void;
    onResize(callback: (event: { cols: number; rows: number }) => void): void;
    loadAddon(addon: any): void;
    dispose(): void;
  }
}
declare module '@xterm/addon-fit' {
  export class FitAddon {
    fit(): void;
  }
}
declare module '@xterm/addon-web-links' {
  export class WebLinksAddon {}
}
declare module '@xterm/addon-search' {
  export class SearchAddon {
    findNext(query: string, options?: any): void;
    findPrevious(query: string): void;
  }
}
