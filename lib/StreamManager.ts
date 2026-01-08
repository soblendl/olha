import axios, { AxiosRequestConfig } from 'axios';
import { PassThrough, Readable } from 'stream';
import { STREAM, TIMEOUTS } from './constants.js';

interface StreamInfo {
    url: string;
    startTime: number;
}

interface StreamStats {
    created: number;
    completed: number;
    failed: number;
}

interface StreamOptions extends AxiosRequestConfig {
    retries?: number;
    timeout?: number;
}

interface ExtendedStats extends StreamStats {
    active: number;
}

class StreamManager {
    private activeStreams: Map<number, StreamInfo>;
    private stats: StreamStats;

    constructor() {
        this.activeStreams = new Map();
        this.stats = { created: 0, completed: 0, failed: 0 };
    }

    async getStream(url: string, options: StreamOptions = {}): Promise<Readable> {
        const maxRetries = options.retries ?? STREAM.RETRY_ATTEMPTS;
        const timeout = options.timeout ?? TIMEOUTS.STREAM;
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const streamId = Date.now() + Math.random();
                this.stats.created++;

                const response = await axios({
                    method: 'GET',
                    url: url,
                    responseType: 'stream',
                    timeout: timeout,
                    maxContentLength: STREAM.MAX_SIZE,
                    maxBodyLength: STREAM.MAX_SIZE,
                    ...options
                });

                this.activeStreams.set(streamId, {
                    url,
                    startTime: Date.now()
                });

                const stream = response.data as Readable;

                stream.on('end', () => {
                    this.activeStreams.delete(streamId);
                    this.stats.completed++;
                });

                stream.on('error', () => {
                    this.activeStreams.delete(streamId);
                    this.stats.failed++;
                });

                return stream;
            } catch (error) {
                lastError = error as Error;
                if (attempt < maxRetries) {
                    const delay = STREAM.RETRY_DELAY * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        this.stats.failed++;
        throw lastError;
    }

    createPassThrough(sourceStream: Readable): PassThrough {
        const pass = new PassThrough();
        sourceStream.pipe(pass);
        return pass;
    }

    getActiveCount(): number {
        return this.activeStreams.size;
    }

    getStats(): ExtendedStats {
        return {
            ...this.stats,
            active: this.activeStreams.size
        };
    }
}

export default StreamManager;
