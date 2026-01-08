import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { isBotAdmin, isAdmin, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['del', 'delete', 'eliminar', 'dd'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, chatId, isGroup, msg, reply, sender } = ctx;
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
            await reply(styleText('ꕤ Necesito ser administrador para eliminar mensajes.'));
            return;
        }

        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            await reply(styleText('ꕤ Por favor responde al mensaje que quieres eliminar.'));
            return;
        }

        const quoted = (msg as any).message.extendedTextMessage.contextInfo;
        const participant = quoted.participant || quoted.remoteJid;

        const deleteKey = {
            remoteJid: chatId,
            fromMe: participant === conn.user.id.split(':')[0] + '@s.whatsapp.net',
            id: quoted.stanzaId,
            participant: participant
        };

        try {
            await conn.sendMessage(chatId, { delete: deleteKey });
        } catch (e: unknown) {
            console.error('Error al eliminar mensaje:', e);
            await reply(styleText('❌ Error al intentar eliminar el mensaje.'));
        }
    }
};

export default plugin;