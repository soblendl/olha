import type { GroupMetadata } from 'baileys';

interface CacheEntry {
    data: GroupMetadata;
    timestamp: number;
}

interface BotLike {
    sock?: {
        groupMetadata(jid: string): Promise<GroupMetadata>;
    };
    groupMetadata?(jid: string): Promise<GroupMetadata>;
}

export class GroupMetadataCache {
    private cache: Map<string, CacheEntry>;
    private ttl: number;
    private pendingRequests: Map<string, Promise<GroupMetadata>>;

    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000;
        this.pendingRequests = new Map();
    }

    async get(bot: BotLike, groupId: string, retries: number = 2): Promise<GroupMetadata> {
        const cached = this.cache.get(groupId);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.ttl) {
            console.log(`[GroupMetadataCache] Using cached metadata for ${groupId}`);
            return cached.data;
        }

        if (this.pendingRequests.has(groupId)) {
            console.log(`[GroupMetadataCache] Waiting for pending request for ${groupId}`);
            return await this.pendingRequests.get(groupId)!;
        }

        const sock = bot.sock || bot;
        const requestPromise = this.fetchWithRetry(sock as { groupMetadata(jid: string): Promise<GroupMetadata> }, groupId, retries);
        this.pendingRequests.set(groupId, requestPromise);

        try {
            const metadata = await requestPromise;
            this.cache.set(groupId, {
                data: metadata,
                timestamp: now
            });
            return metadata;
        } finally {
            this.pendingRequests.delete(groupId);
        }
    }

    private async fetchWithRetry(
        sock: { groupMetadata(jid: string): Promise<GroupMetadata> },
        groupId: string,
        retries: number
    ): Promise<GroupMetadata> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`[GroupMetadataCache] Fetching metadata for ${groupId} (attempt ${attempt + 1}/${retries + 1})`);
                const metadata = await sock.groupMetadata(groupId);
                console.log(`[GroupMetadataCache] Successfully fetched metadata for ${groupId}`);
                return metadata;
            } catch (error) {
                lastError = error as Error;
                console.error(`[GroupMetadataCache] Attempt ${attempt + 1} failed for ${groupId}:`, lastError.message);
                if (attempt < retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    console.log(`[GroupMetadataCache] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`[GroupMetadataCache] All attempts failed for ${groupId}`);
        throw lastError;
    }

    invalidate(groupId: string): void {
        this.cache.delete(groupId);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const groupMetadataCache = new GroupMetadataCache();
