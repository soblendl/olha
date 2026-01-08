import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['sticker', 's'],
    
    async execute(ctx: PluginContext): Promise<void> {
        try {
            const { msg, bot, chatId, args } = ctx;
            const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quoted = quotedContent ? { message: quotedContent } : null;
            const isImage = msg.message?.imageMessage || quoted?.message?.imageMessage;
            const isVideo = msg.message?.videoMessage || quoted?.message?.videoMessage;
            
            if (!isImage && !isVideo) {
                await ctx.reply(styleText('ꕤ Debes enviar una imagen o video, o responder a uno.'));
                return;
            }

            await ctx.reply(styleText('⏳ Creando sticker...'));
            
            // Obtener el nombre del usuario
            const pushName = msg.pushName || 'Usuario';
            
            // Obtener la descripción si existe (todo después del comando)
            const description = args && args.length > 0 ? args.join(' ') : null;
            
            // Construir el pack name (autor)
            const packName = `${pushName} • ༘⋆✿ Mai Sakurajima\n     ⤷ ゛Soblend | soblend.vercel.appˎˊ˗`;
            
            // Construir el author (descripción) solo si existe
            const authorName = description 
                ? `> ⊹Description ࣪ ˖  »\n${description}`
                : '';
            
            const messageToDownload = quoted || msg;
            const buffer = await downloadMediaMessage(
                messageToDownload,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: bot.sock.updateMediaMessage
                }
            );
            
            const sticker = new Sticker(buffer, {
                pack: packName,
                author: authorName,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: 'transparent'
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            await bot.sock.sendMessage(chatId, {
                sticker: stickerBuffer
            }, { quoted: msg });
            
        } catch (error: unknown) {
            console.error('Error creando sticker:', error);
            await ctx.reply(styleText(`ꕤ Error al crear el sticker: ${(error as Error).message}`));
        }
    }
};

export default plugin;