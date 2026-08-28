declare module "pdf-parse" {
  type PdfResult = { text: string };
  function parse(data: Uint8Array): Promise<PdfResult>;
  export default parse;
}
