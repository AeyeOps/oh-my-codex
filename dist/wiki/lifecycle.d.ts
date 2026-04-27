/**
 * Wiki lifecycle integration.
 */
export declare function onSessionStart(data: {
    cwd?: string;
}): {
    additionalContext?: string;
};
export declare function onSessionEnd(data: {
    cwd?: string;
    session_id?: string;
}): {
    continue: boolean;
};
export declare function onPreCompact(data: {
    cwd?: string;
}): {
    additionalContext?: string;
};
//# sourceMappingURL=lifecycle.d.ts.map