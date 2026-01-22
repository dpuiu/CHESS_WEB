/**
 * Utility function to extract a meaningful error message from an unknown error object.
 * Handles:
 * - Redux Toolkit Query errors (FetchBaseQueryError | SerializedError)
 * - Standard JavaScript Error objects
 * - String errors
 * - Network errors
 */
export const getErrorMessage = (error: unknown, defaultMessage: string = 'An unknown error occurred'): string => {
    if (!error) return defaultMessage;

    // Handle String
    if (typeof error === 'string') {
        return error;
    }

    // Handle RTK Query 'FetchBaseQueryError' or similar structure
    // Error comes from `unwrap()` or `error` property of hook
    const e = error as any;

    // 1. Check for `data.message` (Our backend standard)
    if (e.data && typeof e.data === 'object' && e.data.message) {
        return e.data.message;
    }

    // 2. Check for `data.error` (Legacy backend standard or simple string in data)
    if (e.data && typeof e.data === 'object' && e.data.error) {
        return e.data.error;
    }

    // 3. Check if `data` itself is a string message
    if (e.data && typeof e.data === 'string') {
        return e.data;
    }

    // 4. Check standard JS Error `message`
    if (e.message && typeof e.message === 'string') {
        return e.message;
    }

    // 5. Check for `status` code specific messages
    if (e.status) {
        if (e.status === 'FETCH_ERROR') return 'Network error: Failed to connect to server.';
        if (e.status === 'PARSING_ERROR') return 'Data error: Failed to parse server response.';
        if (e.status === 'TIMEOUT_ERROR') return 'Network error: Request timed out.';
        if (typeof e.status === 'number') return `Request failed with status ${e.status}.`;
    }

    return defaultMessage;
};
