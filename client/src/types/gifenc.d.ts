declare module "gifenc" {
  export type GifEncoder = { writeFrame: (index: Uint8Array, width: number, height: number, options?: { palette?: number[][]; delay?: number; repeat?: number }) => void; finish: () => void; bytes: () => Uint8Array };
  export function GIFEncoder(options?: object): GifEncoder;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: { format?: string }): number[][];
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: number[][], format?: string): Uint8Array;
}
