import { parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Task {
    type: string;
    data: SaveData;
    id: number;
}

interface SaveData {
    dbPath: string;
    collections: Record<string, unknown[]>;
}

interface TaskResult {
    id: number;
    success: boolean;
    error?: string;
}

// ============================================================
// WORKER MESSAGE HANDLER
// ============================================================

if (parentPort) {
    parentPort.on('message', async (task: Task) => {
        const { type, data, id } = task;

        try {
            if (type === 'save') {
                const { dbPath, collections } = data;

                // Ensure directory exists
                if (!fs.existsSync(dbPath)) {
                    fs.mkdirSync(dbPath, { recursive: true });
                }

                // Write each collection to file
                for (const [name, items] of Object.entries(collections)) {
                    const filePath = path.join(dbPath, `${name}.json`);

                    // Handle circular references
                    const getCircularReplacer = () => {
                        const seen = new WeakSet();
                        return (_key: string, value: unknown) => {
                            if (typeof value === "object" && value !== null) {
                                if (seen.has(value)) {
                                    return;
                                }
                                seen.add(value);
                            }
                            return value;
                        };
                    };

                    fs.writeFileSync(filePath, JSON.stringify(items, getCircularReplacer(), 2));
                }

                const result: TaskResult = { id, success: true };
                parentPort!.postMessage(result);
            }
        } catch (error) {
            console.error('DB Worker Error:', error);
            const result: TaskResult = { id, success: false, error: (error as Error).message };
            parentPort!.postMessage(result);
        }
    });
}
