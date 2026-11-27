// patch-gg/pixelfx 运行时核心与特效模块类型声明

declare module 'pixelfx' {
  export interface PixelFxFrame {
    w: number;
    h: number;
    ox: number;
    oy: number;
    color: Uint32Array;
    light: Uint32Array;
  }

  export interface PixelFxPainter {
    px(x: number, y: number, c: number): void;
    dot(x: number, y: number, c: number, a?: number): void;
    blend(x: number, y: number, c: number, a: number): void;
    light(x: number, y: number, c: number, k?: number): void;
    line(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      c: number | ((u: number) => number),
      a?: number | ((u: number) => number),
    ): void;
    beam(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      width: number,
      c: number | ((u: number, v: number) => number),
      a?: number | ((u: number, v: number) => number),
    ): void;
    circle(
      cx: number,
      cy: number,
      r: number,
      c: number | ((d: number, ang: number) => number),
      a?: number | ((d: number, ang: number) => number),
    ): void;
    ring(
      cx: number,
      cy: number,
      r: number,
      w: number,
      c: number | ((v: number, ang: number) => number),
      a?: number | ((v: number, ang: number) => number),
    ): void;
    glow(x: number, y: number, r: number, c: number, k?: number): void;
    glowLine(x0: number, y0: number, x1: number, y1: number, r: number, c: number, k?: number): void;
    glowRing(x: number, y: number, R: number, r: number, c: number, k?: number): void;
  }

  export interface PixelFxModule {
    meta?: {
      name?: string;
      desc?: string;
      tags?: string[];
      size?: [number, number];
      origin?: [number, number];
      duration?: number;
      loop?: boolean;
      fps?: number;
      bg?: string;
      actor?: number;
      options?: Record<string, unknown>;
    };
    draw?: (p: PixelFxPainter, t: number, opts: Record<string, unknown>) => void;
    drawBack?: (p: PixelFxPainter, t: number, opts: Record<string, unknown>) => void;
    create?: (opts: Record<string, unknown>) => {
      update?: (dt: number, opts: Record<string, unknown>) => void;
      draw: (p: PixelFxPainter, t: number, opts: Record<string, unknown>) => void;
      drawBack?: (p: PixelFxPainter, t: number, opts: Record<string, unknown>) => void;
    };
  }

  export interface PixelFxOptions {
    x?: number;
    y?: number;
    flip?: boolean;
    angle?: number;
    seed?: number;
    palette?: string[];
    light?: number;
    actor?: unknown;
    [key: string]: unknown;
  }

  export interface PixelFxInstance {
    meta: NonNullable<PixelFxModule['meta']>;
    options: PixelFxOptions;
    readonly t: number;
    update(dt: number): void;
    draw(frame: PixelFxFrame, layer?: 'front' | 'back'): void;
    stop(): void;
    done(): boolean;
  }

  export const TAU: number;
  export const WHITE: number;
  export function clamp(v: number, min?: number, max?: number): number;
  export function smooth(edge0: number, edge1: number, x: number): number;
  export function rand(...seeds: number[]): number;
  export function hex(color: string | number): number;
  export function mix(c0: number, c1: number, t: number): number;
  export function fit(palette: readonly (string | number)[], count: number): number[];
  export function createFrame(w: number, h: number, ox?: number, oy?: number): PixelFxFrame;
  export function clearFrame(frame: PixelFxFrame): PixelFxFrame;
  export function painterFor(frame: PixelFxFrame): PixelFxPainter;
  export function createFx(mod: PixelFxModule, opts?: PixelFxOptions): PixelFxInstance;
  export function composite(
    frame: PixelFxFrame,
    out: Uint8ClampedArray,
    bg?: number | Uint32Array | null,
    lightK?: number,
  ): Uint8ClampedArray;
}

declare module 'pixelfx/fx/*' {
  import type { PixelFxModule } from 'pixelfx';
  export const meta: PixelFxModule['meta'];
  export const draw: PixelFxModule['draw'];
  export const drawBack: PixelFxModule['drawBack'];
  export const create: PixelFxModule['create'];
}
