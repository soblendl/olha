import { styleText } from '../lib/utils.js';
import type { Plugin, PluginContext } from '../src/types/plugin.js';

interface SentMessage {
    key: {
        id: string;
        remoteJid: string;
        fromMe: boolean;
    };
}

const plugin: Plugin = {
    commands: ['ping', 'p'],

    async execute(ctx: PluginContext): Promise<void> {
        const start = Date.now();
        const sent = await ctx.reply(styleText(
            `ꕥ *Velocidad del Bot*\n\n` +
            `> Latencia » Calculando...`
        )) as SentMessage;

        const latency = Date.now() - start;

        await ctx.bot.sendMessage(ctx.chatId, {
            text: styleText(
                `ꕥ *Velocidad del Bot*\n\n` +
                `> Latencia » ${latency}ms\n` +
                `> Estado » Online`
            ),
            edit: sent.key
        });
    }
};

export default plugin;
