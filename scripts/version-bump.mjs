// Run via `npm version <major|minor|patch>`, which sets npm_package_version
// and invokes this as the "version" lifecycle script before npm commits.
// Keeps manifest.json and versions.json in sync with package.json, so the
// tag workflow has a single source of truth for the release version.
import { readFileSync, writeFileSync } from "node:fs";

const targetVersion = process.env.npm_package_version;
if (!targetVersion) {
    throw new Error(
        "npm_package_version is not set; run this via `npm version <bump>`"
    );
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, 4) + "\n");

const versions = JSON.parse(readFileSync("versions.json", "utf-8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, 4) + "\n");
