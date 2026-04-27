export const DEFAULT_NOTEPAD_PRUNE_DAYS_OLD = 7;
export function parseNotepadPruneDaysOld(value, defaultDays = DEFAULT_NOTEPAD_PRUNE_DAYS_OLD) {
    if (value === undefined || value === null) {
        return { ok: true, days: defaultDays };
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
        return { ok: false, error: 'daysOld must be a non-negative integer' };
    }
    return { ok: true, days: value };
}
//# sourceMappingURL=memory-validation.js.map