import type { Plugin, PluginContext } from '../src/types/plugin.js';

import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['hd', 'remini', 'enhance'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, bot, quoted } = ctx;
        const isImage = ctx.msg.message?.imageMessage;
        const isQuotedImage = quoted?.message?.imageMessage;
        if (!isImage && !isQuotedImage) {
        await ctx.ctx.reply(styleText('ꕤ Por favor responde a una imagen o envía una imagen con el comando.'));
        }
        try {
        await ctx.ctx.reply(styleText('ꕤ Mejorando calidad de imagen... (esto puede tardar unos segundos)'));
        const buffer = await downloadMediaMessage(
        quoted ? quoted : ctx.msg,
        'buffer',
        {},
        {
        logger: console,
        reuploadRequest: bot.ctx.bot.sock.updateMediaMessage
        }
        );
        const resultBuffer = await hdr(buffer);
        await bot.ctx.bot.sock.sendMessage(ctx.ctx.chatId, {
        image: resultBuffer,
        caption: styleText('ꕥ Imagen mejorada con éxito.')
        }, { quoted: msg });
        } catch (error: unknown) {
            console.error('[HD] Error:', error);
            await ctx.ctx.reply(styleText('ꕤ Error al mejorar la imagen.'));
        }
    }
};

export default plugin;
