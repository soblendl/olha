import { isAdmin, isBotAdmin, extractMentions, styleText } from '../lib/utils.js';
import type { Plugin, PluginContext, GroupParticipant } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['kick'],

    async execute(ctx: PluginContext): Promise<void> {
        console.log(`[AdminKick] ========== INICIANDO COMANDO KICK ==========`);
        console.log(`[AdminKick] Sender: ${ctx.ctx.sender}`);
        console.log(`[AdminKick] SenderLid: ${ctx.senderLid}`);
        console.log(`[AdminKick] ChatId: ${ctx.ctx.chatId}`);
        console.log(`[AdminKick] isGroup: ${ctx.ctx.isGroup}`);

        if (!ctx.ctx.isGroup) {
            await ctx.ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.')) as undefined;
        }

        // Use senderLid for admin verification (group participants use LID)
        const userIdForAdmin = ctx.senderLid || ctx.ctx.sender;
        console.log(`[AdminKick] Verificando si el usuario es admin con ID: ${userIdForAdmin}`);
        const admin = await isAdmin(ctx.bot, ctx.ctx.chatId, userIdForAdmin);
        console.log(`[AdminKick] ¿Usuario es admin?: ${admin}`);

        if (!admin) {
            await ctx.ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.')) as undefined;
        }

        // Verify if bot is admin
        console.log(`[AdminKick] Verificando si el bot es admin...`);
        const botAdmin = await isBotAdmin(ctx.bot, ctx.ctx.chatId);
        console.log(`[AdminKick] ¿Bot es admin?: ${botAdmin}`);

        if (!botAdmin) {
            await ctx.ctx.reply(styleText('ꕤ Necesito ser administrador para expulsar usuarios.')) as undefined;
        }

        const mentions = extractMentions(ctx);
        console.log(`[AdminKick] Menciones encontradas:`, mentions);

        if (mentions.length === 0) {
            await ctx.ctx.reply(styleText('ꕤ Debes mencionar al usuario a expulsar.\n\n> _Uso: #kick @usuario_')) as undefined;
        }

        try {
            const groupMetadata = await ctx.bot.groupMetadata(ctx.ctx.chatId);
            console.log(`[AdminKick] Participantes en grupo: ${groupMetadata.participants.length}`);

            for (const mentionedUser of mentions) {
                try {
                    const phoneNumber = mentionedUser.split('@')[0].split(':')[0];
                    console.log(`[AdminKick] Buscando usuario con número: ${phoneNumber}`);

                    const participant = groupMetadata.participants.find((p: GroupParticipant) => {
                        const participantNumber = p.id.split('@')[0].split(':')[0];
                        return participantNumber === phoneNumber;
                    });

                    if (!participant) {
                        console.log(`[AdminKick] Usuario no encontrado en el grupo`);
                        await ctx.ctx.reply(styleText(`ꕤ No se encontró al usuario @${phoneNumber} en el grupo.`), {
                            mentions: [mentionedUser]
                        });
                        continue;
                    }

                    console.log(`[AdminKick] Usuario encontrado: ${participant.id}, admin: ${participant.admin}`);

                    // Don't allow kicking admins
                    if (participant.admin === 'admin' || participant.admin === 'superadmin') {
                        await ctx.ctx.reply(styleText(`ꕤ No puedo expulsar a @${phoneNumber} porque es administrador.`), {
                            mentions: [participant.id]
                        });
                        continue;
                    }

                    await ctx.bot.groupParticipantsUpdate(ctx.ctx.chatId, [participant.id], 'remove');
                    console.log(`[AdminKick] Usuario expulsado exitosamente`);

                    await ctx.ctx.reply(styleText(`ꕥ @${phoneNumber} ha sido expulsado del grupo.`), {
                        mentions: [participant.id]
                    });
                } catch (error: unknown) {
                    console.error('[AdminKick] Error expulsando usuario:', error);
                    await ctx.ctx.reply(styleText('ꕤ Error al expulsar al usuario: ' + (error as Error).message));
                }
            }
        } catch (error: unknown) {
            console.error('[AdminKick] Error obteniendo metadata:', error);
            await ctx.ctx.reply(styleText('ꕤ Error al obtener información del grupo: ' + (error as Error).message));
        }

        console.log(`[AdminKick] ========== FIN COMANDO KICK ==========`);
    }
};

export default plugin;
