import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isBotAdmin, isAdmin, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['group', 'grupo', 'settings', 'config'],
    async execute(ctx: PluginContext): Promise<void> {
        const { bot, chatId, isGroup, args, sender, reply } = ctx;
        const conn = bot?.sock;
        if (!isGroup) {
            await reply(styleText('ꕤ Este comando solo funciona en grupos.'));
            return;
        }
        if (!await isAdmin(conn, chatId, sender)) {
            await reply(styleText('ꕤ Necesitas ser administrador para usar este comando.'));
            return;
        }
        if (!await isBotAdmin(conn, chatId)) {
            await reply(styleText('ꕤ Necesito ser administrador para configurar el grupo.'));
            return;
        }
        const action = args[0]?.toLowerCase();
        if (action === 'open' || action === 'abrir') {
            await conn.groupSettingUpdate(chatId, 'not_announcement');
            await reply(styleText('ꕥ *Grupo Abierto* \n\n> Ahora todos los participantes pueden enviar mensajes.'));
        } else if (action === 'close' || action === 'cerrar') {
            await conn.groupSettingUpdate(chatId, 'announcement');
            await reply(styleText('ꕥ *Grupo Cerrado* \n\n> Solo los administradores pueden enviar mensajes.'));
        } else {
            await reply(styleText('ꕤ Uso: */group* <open/close>'));
        }
    }
};

export default plugin;