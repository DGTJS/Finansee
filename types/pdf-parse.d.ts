declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfResult = { text: string };
  function parse(data: Uint8Array): Promise<PdfResult>;
  export default parse;
}
