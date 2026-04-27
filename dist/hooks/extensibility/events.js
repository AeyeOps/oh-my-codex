const DERIVED_EVENTS = new Set(['needs-input', 'pre-tool-use', 'post-tool-use']);
function clampConfidence(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return undefined;
    if (value < 0)
        return 0;
    if (value > 1)
        return 1;
    return value;
}
export function isDerivedEventName(event) {
    return DERIVED_EVENTS.has(event);
}
export function buildHookEvent(event, options = {}) {
    const source = options.source || (isDerivedEventName(event) ? 'derived' : 'native');
    const confidence = clampConfidence(options.confidence);
    const envelope = {
        schema_version: '1',
        event,
        timestamp: options.timestamp || new Date().toISOString(),
        source,
        context: options.context && typeof options.context === 'object' ? options.context : {},
    };
    if (options.session_id)
        envelope.session_id = options.session_id;
    if (options.thread_id)
        envelope.thread_id = options.thread_id;
    if (options.turn_id)
        envelope.turn_id = options.turn_id;
    if (options.mode)
        envelope.mode = options.mode;
    if (source === 'derived') {
        envelope.confidence = confidence ?? 0.5;
        if (options.parser_reason)
            envelope.parser_reason = options.parser_reason;
    }
    return envelope;
}
export function buildNativeHookEvent(event, context = {}, options = {}) {
    return buildHookEvent(event, {
        ...options,
        source: 'native',
        context,
    });
}
export function buildDerivedHookEvent(event, context = {}, options = {}) {
    return buildHookEvent(event, {
        ...options,
        source: 'derived',
        context,
    });
}
//# sourceMappingURL=events.js.map