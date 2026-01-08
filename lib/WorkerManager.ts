import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerManager {
    private workers: Map<string, Worker>;

    constructor() {
        this.workers = new Map();
    }

    getWorker(name: string, scriptPath: string): Worker {
        if (!this.workers.has(name)) {
            const absolutePath = path.join(__dirname, '..', scriptPath);
            const worker = new Worker(absolutePath);

            worker.on('error', (err: Error) => {
                console.error(`❌ Worker ${name} error:`, err);
            });

            worker.on('exit', (code: number) => {
                if (code !== 0) {
                    console.error(`❌ Worker ${name} stopped with exit code ${code}`);
                    this.workers.delete(name);
                }
            });

            this.workers.set(name, worker);
            console.log(`🔧 Worker ${name} started`);
        }
        return this.workers.get(name)!;
    }

    async terminate(name: string): Promise<void> {
        const worker = this.workers.get(name);
        if (worker) {
            await worker.terminate();
            this.workers.delete(name);
            console.log(`🔧 Worker ${name} terminated`);
        }
    }

    async terminateAll(): Promise<void> {
        for (const name of this.workers.keys()) {
            await this.terminate(name);
        }
    }
}

export default WorkerManager;
