import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['obtenerinfo', 'getinfo', 'userinfo'],

    async execute(ctx: PluginContext): Promise<void> {
        const { msg, chatId, isGroup } = ctx;

        if (!isGroup) {
            await ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
            return;
        }

        const mentionedJid = (msg as Error).message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (!mentionedJid || mentionedJid.length === 0) {
            await ctx.reply(styleText('ꕤ Debes etiquetar a un usuario.\nEjemplo: #obtenerinfo @usuario'));
            return;
        }

        const targetUser = mentionedJid[0];

        try {
            const metadata = await ctx.bot.groupMetadata(chatId);
            const participants = metadata.participants;

            const phoneNumber = targetUser.split('@')[0].split(':')[0];

            const participant = participants.find(p => {
                const participantNumber = p.id.split('@')[0].split(':')[0];
                return participantNumber === phoneNumber;
            });

            let message = `📱 *Información del Usuario*\n\n`;
            message += `👤 *Mencionado como:* @${targetUser.split('@')[0]}\n\n`;
            message += `📞 *Número base:* ${phoneNumber}\n\n`;
            message += `🔗 *Formatos de JID:*\n`;
            message += `• PN (Phone Number): \`${phoneNumber}@s.whatsapp.net\`\n`;

            if (participant) {
                message += `• LID (Linked ID): \`${participant.id}\`\n`;
            } else {
                message += `• LID: _No encontrado en el grupo_\n`;
            }

            await ctx.reply(styleText(message), { mentions: [targetUser] });

        } catch (error: unknown) {
            console.error('[ObtenerInfo] Error:', error);
            await ctx.reply(styleText('ꕤ Error al obtener información del usuario.'));
        }
    }
};

export default plugin;