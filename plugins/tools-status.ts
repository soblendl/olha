import type { Plugin, PluginContext } from '../src/types/plugin.js';
import os from 'os';
import { styleText, formatTime } from '../lib/utils.js';

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

const plugin: Plugin = {
    commands: ['status', 'estado', 'ping'],

    async execute(ctx: PluginContext): Promise<void> {
        const uptime = formatUptime(process.uptime());
        const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
        const platform = os.platform();

        const message = `🤖 *Estado del Bot*\n\n` +
            `⏱️ *Uptime:* ${uptime}\n` +
            `💾 *Memoria:* ${memUsage} MB / ${totalRam} MB\n` +
            `🖥️ *Plataforma:* ${platform}\n` +
            `📊 *Node.js:* ${process.version}`;

        await ctx.reply(styleText(message));
    }
};

export default plugin;