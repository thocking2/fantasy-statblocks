// Validates manifest.json / versions.json against Obsidian's plugin
// requirements (see https://docs.obsidian.md/Reference/Manifest).
import { readFileSync } from "node:fs";

const SEMVER = /^\d+\.\d+\.\d+$/;

function readJson(path) {
    return JSON.parse(readFileSync(path, "utf-8"));
}

const errors = [];

const manifest = readJson("manifest.json");
const pkg = readJson("package.json");
const versions = readJson("versions.json");

const requiredFields = [
    "id",
    "name",
    "version",
    "minAppVersion",
    "author",
    "description"
];
for (const field of requiredFields) {
    if (!manifest[field] || typeof manifest[field] !== "string") {
        errors.push(`manifest.json is missing required string field "${field}"`);
    }
}

if (typeof manifest.isDesktopOnly !== "boolean") {
    errors.push('manifest.json "isDesktopOnly" must be a boolean');
}

if (manifest.id && /\s/.test(manifest.id)) {
    errors.push(`manifest.json "id" must not contain whitespace: "${manifest.id}"`);
}

if (manifest.version && !SEMVER.test(manifest.version)) {
    errors.push(`manifest.json "version" is not valid semver: "${manifest.version}"`);
}

if (manifest.minAppVersion && !SEMVER.test(manifest.minAppVersion)) {
    errors.push(
        `manifest.json "minAppVersion" is not valid semver: "${manifest.minAppVersion}"`
    );
}

if (manifest.version && pkg.version && manifest.version !== pkg.version) {
    errors.push(
        `manifest.json version "${manifest.version}" does not match package.json version "${pkg.version}"`
    );
}

if (typeof versions !== "object" || versions === null || Array.isArray(versions)) {
    errors.push("versions.json must be an object mapping plugin version -> minAppVersion");
} else {
    for (const [version, minAppVersion] of Object.entries(versions)) {
        if (!SEMVER.test(version)) {
            errors.push(`versions.json has a non-semver key: "${version}"`);
        }
        if (typeof minAppVersion !== "string" || !SEMVER.test(minAppVersion)) {
            errors.push(
                `versions.json entry "${version}" has a non-semver minAppVersion: "${minAppVersion}"`
            );
        }
    }
}

if (errors.length) {
    console.error("Obsidian manifest compatibility check failed:\n");
    for (const error of errors) {
        console.error(`  - ${error}`);
    }
    process.exit(1);
}

console.log(
    `manifest.json OK (id: ${manifest.id}, version: ${manifest.version}, minAppVersion: ${manifest.minAppVersion})`
);
