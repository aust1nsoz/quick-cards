declare module 'anki-apkg-export' {
  interface ApkgExporterOptions {
    template?: {
      css?: string;
      frontSide?: string;
      backSide?: string;
    };
  }

  interface CardOptions {
    tags?: string[];
  }

  class AnkiExport {
    constructor(deckName: string, options?: ApkgExporterOptions);
    addMedia(filename: string, data: Buffer): void;
    addCard(front: string, back: string, options?: CardOptions): void;
    save(): Promise<Buffer>;
  }

  export = AnkiExport;
} 