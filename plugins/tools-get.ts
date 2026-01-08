import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['get', 'fetch'],

    async execute(ctx: PluginContext): Promise<void> {
        const { text } = ctx;

        if (!text || !text.trim()) {
            await ctx.reply(styleText('ꕤ Ingresa una URL para obtener.'));
            return;
        }

        const url = text.trim();

        try {
            new URL(url);
        } catch {
            await ctx.reply(styleText('ꕤ URL inválida.'));
            return;
        }

        try {
            await ctx.reply(styleText('ꕤ Obteniendo recurso...'));

            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || '';

            if (contentType.startsWith('image/')) {
                await ctx.replyWithImage(buffer, { caption: styleText(`ꕥ Recurso obtenido de:\n${url}`) });
            } else if (contentType.startsWith('video/')) {
                await ctx.replyWithVideo(buffer, { caption: styleText(`ꕥ Recurso obtenido de:\n${url}`) });
            } else {
                const ext = url.split('.').pop() || 'bin';
                await ctx.bot.sock.sendMessage(ctx.chatId, {
                    document: buffer,
                    mimetype: contentType || 'application/octet-stream',
                    fileName: `file.${ext}`
                });
            }

        } catch (error: unknown) {
            console.error('[Get] Error:', error);
            await ctx.reply(styleText('ꕤ Error al obtener el recurso.'));
        }
    }
};

export default plugin;