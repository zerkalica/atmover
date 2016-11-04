// @flow

export default function debugName(func: any): string {
    if (
        func === null
        || (typeof func !== 'object' && typeof func !== 'function')
    ) {
        return String(func)
    }

    return func.displayName || func.name || String(func)
}
