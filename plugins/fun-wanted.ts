import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['wanted', 'sebusca'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, bot, chatId } = ctx
        try {
            let targetJid
            const mentionedJid = (msg as Error).message?.extendedTextMessage?.contextInfo?.mentionedJid
            if (mentionedJid && mentionedJid.length > 0) { targetJid = mentionedJid[0] }
            else if ((msg as Error).message?.extendedTextMessage?.contextInfo?.participant) { targetJid = (msg as Error).message.extendedTextMessage.contextInfo.participant }
            else { targetJid = ctx.sender }
            let profilePicUrl
            try {
                profilePicUrl = await bot.sock.profilePictureUrl(targetJid, 'image')
            } catch {
                profilePicUrl = 'https://i.ibb.co/3Fh9V6p/avatar-contact.png'
            }

            const wantedUrl = `https://api.popcat.xyz/wanted?image=${encodeURIComponent(profilePicUrl)}`
            await bot.sock.sendMessage(chatId, {
                image: { url: wantedUrl },
                caption: styleText(`🚨 *SE BUSCA* 🚨\n\n⚠️ Usuario: @${targetJid.split('@')[0]}\n💰 Recompensa: 1,000,000 coins`),
                mentions: [targetJid]
            }, { quoted: msg })
        } catch (error: unknown) {
            console.error('[Wanted] Error:', error);
            await ctx.reply(styleText('ꕤ Error al generar la imagen.'));
        }
    }
};

export default plugin;
