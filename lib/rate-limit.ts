
type RateLimitStore = Map<string, { count: number; resetTime: number }>;

// Global store to persist across hot reloads in dev (though in serverless it might reset per lambda instance, 
// but for Vercel Edge/Node it's often sufficient for basic protection or requires an external store like Redis for strictness.
// Given the scope, in-memory is fine for now).
const globalStore: { store?: RateLimitStore } = global as any;
const store: RateLimitStore = globalStore.store || new Map();
if (process.env.NODE_ENV !== 'production') globalStore.store = store;

interface RateLimitConfig {
    limit: number; // requests
    window: number; // milliseconds
}

export function checkRateLimit(ip: string, config: RateLimitConfig = { limit: 5, window: 60000 }) {
    const now = Date.now();
    const record = store.get(ip);

    if (!record) {
        store.set(ip, { count: 1, resetTime: now + config.window });
        return true;
    }

    if (now > record.resetTime) {
        store.set(ip, { count: 1, resetTime: now + config.window });
        return true;
    }

    if (record.count >= config.limit) {
        return false;
    }

    record.count += 1;
    return true;
}
