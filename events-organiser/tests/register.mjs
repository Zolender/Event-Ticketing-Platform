// Lets `node --test` import the app's code the way the app does: `@/` paths and extensionless
// relative imports resolve to the TypeScript files, which Node then runs as they are.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";

const src = new URL("../src/", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = specifier.startsWith("@/")
      ? new URL(specifier.slice(2), src)
      : specifier.startsWith(".")
        ? new URL(specifier, context.parentURL)
        : null;
    if (local && !/\.[cm]?[jt]sx?$/.test(local.pathname)) {
      for (const ending of [".ts", ".tsx", "/index.ts"]) {
        const candidate = new URL(local.href + ending);
        if (existsSync(candidate)) return nextResolve(candidate.href, context);
      }
    }
    return nextResolve(local?.href ?? specifier, context);
  },
});
