import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { isInstallVersionBump, readUserInstallStamp, writeUserInstallStamp, } from "../cli/update.js";
import { getPackageRoot } from "../utils/package.js";
function stripLeadingV(version) {
    return version.trim().replace(/^v/i, "");
}
function isTruthyEnv(value) {
    return value === "1" || value === "true";
}
export function isGlobalInstallLifecycle(env = process.env) {
    return isTruthyEnv(env.npm_config_global) || env.npm_config_location === "global";
}
async function getCurrentVersion() {
    try {
        const packageJsonPath = join(getPackageRoot(), "package.json");
        const content = await readFile(packageJsonPath, "utf-8");
        const parsed = JSON.parse(content);
        return typeof parsed.version === "string" ? parsed.version : null;
    }
    catch {
        return null;
    }
}
const defaultDependencies = {
    env: process.env,
    getCurrentVersion,
    log: (message) => console.log(message),
    readStamp: () => readUserInstallStamp(),
    writeStamp: (stamp) => writeUserInstallStamp(stamp),
};
export async function runPostinstall(dependencies = {}) {
    const resolved = { ...defaultDependencies, ...dependencies };
    const { env } = resolved;
    if (!isGlobalInstallLifecycle(env)) {
        return { status: "noop-local", version: null };
    }
    const currentVersion = await resolved.getCurrentVersion();
    if (!currentVersion) {
        return { status: "noop-missing-version", version: null };
    }
    const currentStampVersion = stripLeadingV(currentVersion);
    const existingStamp = await resolved.readStamp();
    if (!isInstallVersionBump(currentVersion, existingStamp)) {
        return { status: "noop-same-version", version: currentStampVersion };
    }
    await resolved.writeStamp({
        installed_version: currentStampVersion,
        ...(typeof existingStamp?.setup_completed_version === "string"
            ? { setup_completed_version: existingStamp.setup_completed_version }
            : {}),
        updated_at: new Date().toISOString(),
    });
    resolved.log(`[omx] Installed oh-my-codex v${currentStampVersion}. OMX setup is explicit opt-in; run \`omx setup\` or \`omx update\` when you're ready.`);
    return { status: "hinted", version: currentStampVersion };
}
export async function main() {
    await runPostinstall();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.warn(`[omx] Postinstall setup skipped after a non-fatal error: ${error instanceof Error ? error.message : String(error)}`);
    });
}
//# sourceMappingURL=postinstall.js.map