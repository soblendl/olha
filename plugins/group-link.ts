import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText, isAdmin, isBotAdmin } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['link', 'enlace'],

    async execute(ctx: PluginContext): Promise<void> {
        const { reply, chatId, isGroup, bot, sender } = ctx;
        const conn = bot?.sock;

        if (!isGroup) {
            await reply(styleText('ꕤ Este comando solo funciona en grupos.'));
            return;
        }

        const userIdForAdmin = sender;
        const isAdminUser = await isAdmin(bot, chatId, userIdForAdmin);

        if (!isAdminUser) {
            await reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
            return;
        }

        if (!conn) {
            await reply(styleText('❌ Error: Conexión no disponible.'));
            return;
        }

        try {
            const botIsAdmin = await isBotAdmin(conn, chatId);
            if (!botIsAdmin) {
                await reply(styleText('ꕤ Necesito ser administrador para obtener el enlace del grupo.'));
                return;
            }

            const link = await conn.groupInviteCode(chatId);
            await reply(styleText(`ꕥ *Enlace del Grupo* \n\nhttps://chat.whatsapp.com/${link}`));

        } catch (error: unknown) {
            console.error('[GroupLink] Error:', error);
            await reply(styleText('ꕤ Error al obtener el enlace del grupo.'));
        }
    }
};

export default plugin;