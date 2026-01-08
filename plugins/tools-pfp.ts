import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['pfp', 'perfil', 'foto'],

    async execute(ctx: PluginContext): Promise<void> {
        const { chatId, msg, bot, sender } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            await ctx.reply(styleText('❌ Error: Conexión no disponible.'));
            return;
        }

        let targetJid = sender;
        const mentions = (msg as Error).message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentions && mentions.length > 0) {
            targetJid = mentions[0];
        } else if ((msg as Error).message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const participant = (msg as Error).message.extendedTextMessage.contextInfo.participant;
            if (participant) {
                targetJid = participant;
            }
        }

        try {
            let pfpUrl: string | undefined;
            try {
                pfpUrl = await conn.profilePictureUrl(targetJid, 'image');
            } catch (e: unknown) {
                pfpUrl = undefined;
            }

            if (!pfpUrl) {
                await ctx.reply(styleText('ꕤ El usuario no tiene foto de perfil o es privada.'));
                return;
            }

            const caption = `ꕥ *Profile Picture*\n\n` +
                `> *Usuario* » @${targetJid.split('@')[0]}\n` +
                `──────────────────\n` +
                `> _*Powered By DeltaByte*_`;

            await conn.sendMessage(chatId, {
                image: { url: pfpUrl },
                caption: styleText(caption),
                mentions: [targetJid]
            });

        } catch (error: unknown) {
            console.error('[PFP] Error:', error);
            await ctx.reply(styleText('ꕤ Error al obtener la foto de perfil.'));
        }
    }
};

export default plugin;