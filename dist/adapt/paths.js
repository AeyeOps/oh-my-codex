import { join } from "node:path";
import { omxAdaptersDir } from "../utils/paths.js";
export function resolveAdaptPaths(cwd, target) {
    const adapterRoot = join(omxAdaptersDir(cwd), target);
    const reportsDir = join(adapterRoot, "reports");
    return {
        adapterRoot,
        configPath: join(adapterRoot, "adapter.json"),
        envelopePath: join(adapterRoot, "envelope.json"),
        reportsDir,
        probeReportPath: join(reportsDir, "probe.json"),
        statusReportPath: join(reportsDir, "status.json"),
    };
}
//# sourceMappingURL=paths.js.map