// harfbuzzjs 0.x ships without type definitions.
declare module "harfbuzzjs/hb.js" {
  const createHarfBuzz: (opts?: { wasmBinary?: ArrayBuffer }) => Promise<unknown>;
  export default createHarfBuzz;
}
declare module "harfbuzzjs/hbjs.js" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hbjs: (module: unknown) => any;
  export default hbjs;
}
