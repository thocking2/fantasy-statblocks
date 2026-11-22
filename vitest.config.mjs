import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
    resolve: {
        // The codebase imports from the project root ("src/util/util",
        // "index"); mirror the tsconfig.json paths mapping.
        alias: [
            { find: /^src\//, replacement: fromRoot("./src/") },
            { find: /^index$/, replacement: fromRoot("./index.ts") }
        ]
    },
    test: {
        // describe/test/expect/vi as globals, matching the Jest-era test files.
        globals: true,
        environment: "node",
        include: ["src/**/*.test.ts"]
    }
});
