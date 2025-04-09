
// Global type declarations for Zod and its internal modules
declare module "zod" {
  export * from "zod/lib/index";
  // Export the z object for namespace usage
  export const z: any;
  // Ensure ZodType is exported
  export type ZodType<T = any, Def = any, Input = T> = any;
}

declare module "zod/lib/index" {
  export * from "zod";
}

declare module "zod/lib/index.mjs" {
  export * from "zod";
}

declare module "zod/lib/ZodError.mjs" {
  const ZodError: any;
  export { ZodError };
}
