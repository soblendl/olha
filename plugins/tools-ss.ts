import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['ss', 'screenshot'],

    async execute(ctx: PluginContext): Promise<void> {
        const { text, bot, chatId } = ctx;

        if (!text || !text.trim()) {
            await ctx.reply(styleText('ꕤ Ingresa una URL para tomar la captura.'));
            return;
        }

        const url = text.trim();

        // Validar URL
        try {
            new URL(url);
        } catch {
            await ctx.reply(styleText('ꕤ URL inválida.'));
            return;
        }

        try {
            await ctx.reply(styleText('ꕤ Tomando captura...'));

            const screenshotUrl = `https://image.thum.io/get/width/1920/crop/768/maxAge/1/noanimate/${url}`;

            await bot.sock.sendMessage(chatId, {
                image: { url: screenshotUrl },
                caption: styleText(`> *Screenshot de* » ${url}`)
            });

        } catch (error: unknown) {
            console.error('[SS] Error:', error);
            await ctx.reply(styleText('ꕤ Error al capturar la página.'));
        }
    }
};

export default plugin;