declare module 'anki-apkg-export' {
  export interface ApkgExporterOptions {
    template?: {
      css?: string;
      frontSide?: string;
      backSide?: string;
    };
  }

  export interface CardOptions {
    tags?: string[];
  }

  export class ApkgExporter {
    constructor(deckName: string, options?: ApkgExporterOptions);
    addMedia(filename: string, data: Buffer): void;
    addCard(front: string, back: string, options?: CardOptions): void;
    save(): Promise<Buffer>;
  }

  export default ApkgExporter;
} 