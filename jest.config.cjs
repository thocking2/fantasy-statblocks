/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    modulePaths: ["<rootDir>"],
    testMatch: ["<rootDir>/src/**/*.test.ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: {
                    baseUrl: ".",
                    module: "commonjs",
                    target: "es2020",
                    moduleResolution: "node",
                    esModuleInterop: true,
                    experimentalDecorators: true,
                    isolatedModules: true,
                    types: ["node", "jest"]
                }
            }
        ]
    }
};
