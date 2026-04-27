import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPackageRoot } from "../utils/package.js";
import {
  isInstallVersionBump,
  readUserInstallStamp,
  writeUserInstallStamp,
} from "./update.js";

async function getCurrentVersion(): Promise<string | null> {
  try {
    const packageJsonPath = join(getPackageRoot(), "package.json");
    const content = await readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content) as { version?: string };
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

export async function ensureInstallStamp(): Promise<void> {
  try {
    const currentVersion = await getCurrentVersion();
    if (!currentVersion) return;

    const stamp = await readUserInstallStamp();
    if (!isInstallVersionBump(currentVersion, stamp)) return;

    const stampVersion = currentVersion.trim().replace(/^v/i, "");
    await writeUserInstallStamp({
      installed_version: stampVersion,
      ...(typeof stamp?.setup_completed_version === "string"
        ? { setup_completed_version: stamp.setup_completed_version }
        : {}),
      updated_at: new Date().toISOString(),
    });
    console.log(
      `[omx] Detected oh-my-codex v${stampVersion}. Run \`omx setup\` or \`omx update\` to apply changes.`,
    );
  } catch {
    // Stamp issues must never block a CLI command.
  }
}
