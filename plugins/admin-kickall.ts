import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText, isAdmin, isBotAdmin } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['kickall', 'eliminaratodos'],

    async execute(ctx: PluginContext): Promise<void> {

        if (!ctx.ctx.isGroup) {
            await ctx.ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        const senderIsAdmin = await isAdmin(ctx.bot, ctx.ctx.chatId, ctx.senderLid || ctx.ctx.sender);
        if (!senderIsAdmin) {
            await ctx.ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }

        const botIsAdmin = await isBotAdmin(ctx.bot, ctx.ctx.chatId);
        if (!botIsAdmin) {
            await ctx.ctx.reply(styleText('ꕤ Necesito ser administrador para eliminar miembros.'));
        }

        try {
            const metadata = await ctx.bot.groupMetadata(ctx.ctx.chatId);
            const participants = metadata.participants;

            // Obtener IDs del bot para excluirlo
            const botLid = ctx.bot.ctx.bot.sock.user?.lid?.split(':')[0]?.split('@')[0];
            const botNumber = ctx.bot.ctx.bot.sock.user?.id?.split(':')[0]?.split('@')[0];

            const toKick = participants.filter(p => {
                if (p.admin === 'admin' || p.admin === 'superadmin') return false;
                const participantId = p.id.split(':')[0].split('@')[0];
                if (participantId === botLid || participantId === botNumber) return false;
                return true;
            });

            if (toKick.length === 0) {
                await ctx.ctx.reply(styleText('ꕤ No hay miembros para eliminar (solo hay administradores).'));
            }

            await ctx.ctx.reply(styleText(`⚠️ *Iniciando eliminación masiva*\n📊 Eliminando ${toKick.length} miembros...`));
            const batchSize = 5;
            let kicked = 0;
            let failed = 0;

            for (let i = 0; i < toKick.length; i += batchSize) {
                const batch = toKick.slice(i, i + batchSize);
                const jids = batch.map(p => p.id);

                try {
                    await ctx.bot.groupParticipantsUpdate(ctx.ctx.chatId, jids, 'remove');
                    kicked += jids.length;
                    if (i + batchSize < toKick.length) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error: unknown) {
                    console.error('[AdminKickall] Error eliminando batch:', error);
                    failed += jids.length;
                }
            }

            await ctx.ctx.reply(styleText(`✅ *Eliminación completada*\n• Eliminados: ${kicked}\n• Fallidos: ${failed}`));

        } catch (error: unknown) {
            console.error('[AdminKickall] Error:', error);
            await ctx.ctx.reply(styleText('ꕤ Error al ejecutar el comando.'));
        }
    }
};

export default plugin;
