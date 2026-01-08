import type Bull from 'bull';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Job<T = unknown> {
    id: number;
    data: T;
    options: JobOptions;
    timestamp: number;
}

interface JobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    [key: string]: unknown;
}

type JobProcessor<T> = (job: Job<T>) => Promise<void>;

interface QueueLike {
    add(data: unknown, options?: JobOptions): Promise<Job>;
    process(concurrency: number, processor: JobProcessor<unknown>): void;
    isReady?(): Promise<void>;
    close?(): Promise<void>;
}

// ============================================================
// IN-MEMORY QUEUE (Fallback when Redis unavailable)
// ============================================================

class InMemoryQueue implements QueueLike {
    private name: string;
    private jobs: Job[];
    private processor: JobProcessor<unknown> | null;
    private processing: boolean;

    constructor(name: string) {
        this.name = name;
        this.jobs = [];
        this.processor = null;
        this.processing = false;
    }

    async add<T>(data: T, options: JobOptions = {}): Promise<Job<T>> {
        const job: Job<T> = {
            id: Date.now() + Math.random(),
            data,
            options,
            timestamp: Date.now()
        };
        this.jobs.push(job as Job);
        this.processNext();
        return job;
    }

    process(concurrency: number, processor: JobProcessor<unknown>): void {
        this.processor = processor;
        this.processNext();
    }

    private async processNext(): Promise<void> {
        if (this.processing || !this.processor || this.jobs.length === 0) return;

        this.processing = true;
        while (this.jobs.length > 0) {
            const job = this.jobs.shift()!;
            try {
                await this.processor(job);
            } catch (err) {
                console.error(`InMemoryQueue ${this.name} job error:`, err);
            }
        }
        this.processing = false;
    }
}

// ============================================================
// QUEUE MANAGER CLASS
// ============================================================

class QueueManager {
    private queues: Map<string, QueueLike>;
    private useRedis: boolean;
    private Bull: typeof Bull | null;

    constructor() {
        this.queues = new Map();
        this.useRedis = false;
        this.Bull = null;
    }

    async init(): Promise<void> {
        try {
            const BullModule = await import('bull');
            this.Bull = BullModule.default;

            const testQueue = new this.Bull('test-connection', {
                redis: { port: 6379, host: '127.0.0.1' }
            });
            await testQueue.isReady();
            await testQueue.close();

            this.useRedis = true;
            console.log('📌 QueueManager: Redis disponible');
        } catch {
            this.useRedis = false;
            console.log('⚠️ QueueManager: Redis no disponible, usando cola en memoria');
        }
    }

    getQueue(name: string, options: Record<string, unknown> = {}): QueueLike {
        if (!this.queues.has(name)) {
            let queue: QueueLike;

            if (this.useRedis && this.Bull) {
                queue = new this.Bull(name, {
                    redis: { port: 6379, host: '127.0.0.1' },
                    ...options
                }) as unknown as QueueLike;
            } else {
                queue = new InMemoryQueue(name);
            }

            this.queues.set(name, queue);
        }
        return this.queues.get(name)!;
    }

    async addJob<T>(queueName: string, data: T, options: JobOptions = {}): Promise<Job<T>> {
        const queue = this.getQueue(queueName);
        return await queue.add(data, options) as Job<T>;
    }

    process<T>(queueName: string, processor: JobProcessor<T>, concurrency: number = 1): void {
        const queue = this.getQueue(queueName);
        queue.process(concurrency, processor as JobProcessor<unknown>);
    }

    isUsingRedis(): boolean {
        return this.useRedis;
    }
}

export default QueueManager;
