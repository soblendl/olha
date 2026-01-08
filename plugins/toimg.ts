import type { Plugin, PluginContext } from '../src/types/plugin.js';
import sharp from 'sharp';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['toimg', 'img'],

    async execute(ctx: PluginContext): Promise<void> {
        const { msg, bot, chatId } = ctx;

        const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedContent) {
            await ctx.reply(styleText('ꕤ Debes responder a un sticker.'));
            return;
        }

        const isSticker = quotedContent.stickerMessage;

        if (!isSticker) {
            await ctx.reply(styleText('ꕤ Debes responder a un sticker.'));
            return;
        }

        try {
            await ctx.reply(styleText('⏳ Convirtiendo sticker a imagen...'));

            const quotedMessage = {
                key: msg.key,
                message: quotedContent
            };

            const buffer = await ctx.download(quotedMessage);

            const imgBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            await bot.sock.sendMessage(chatId, {
                image: imgBuffer,
                caption: styleText('ꕥ Aquí tienes tu imagen')
            }, { quoted: msg });

        } catch (error: unknown) {
            console.error('[ToImg] Error:', error);
            await ctx.reply(styleText('ꕤ Error al convertir el sticker.'));
        }
    }
};

export default plugin;