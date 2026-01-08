import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { isBotAdmin, isAdmin, extractMentions, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['warn', 'advertir', 'unwarn', 'delwarn'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, chatId, isGroup, args, sender, command, reply, dbService, msg } = ctx;
        const conn = bot?.sock;

        if (!isGroup) {
            await reply(styleText('ꕤ Este comando solo funciona en grupos.'));
            return;
        }

        if (!await isAdmin(conn, chatId, sender)) {
            await reply(styleText('ꕤ Necesitas ser administrador para usar este comando.'));
            return;
        }

        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let targetUser = null;

        if (mentioned.length > 0) {
            targetUser = mentioned[0];
        } else if (quoted) {
            targetUser = quoted;
        }

        if (!targetUser) {
            await reply(styleText('ꕤ Por favor etiqueta o responde al usuario.'));
            return;
        }

        if (await isAdmin(conn, chatId, targetUser)) {
            await reply(styleText('ꕤ No puedo advertir a un administrador.'));
            return;
        }

        const userData = dbService.getUser(targetUser);
        if (!userData.warns) userData.warns = 0;

        const isUnwarn = ['unwarn', 'delwarn'].includes(command!);

        if (isUnwarn) {
            if (userData.warns > 0) {
                userData.warns -= 1;
                dbService.markDirty();
                await reply(styleText(`ꕥ Advertencia eliminada para @${targetUser.split('@')[0]}\nAdvertencias actuales: ${userData.warns}/3`), { mentions: [targetUser] });
            } else {
                await reply(styleText('ꕤ El usuario no tiene advertencias.'));
            }
        } else {
            userData.warns += 1;
            dbService.markDirty();
            await reply(styleText(`ꕥ Advertencia añadida a @${targetUser.split('@')[0]}\nAdvertencias actuales: ${userData.warns}/3`), { mentions: [targetUser] });
            if (userData.warns >= 3) {
                await reply(styleText(`ꕤ @${targetUser.split('@')[0]} ha alcanzado 3 advertencias.`), { mentions: [targetUser] });
            }
        }
    }
};

export default plugin;