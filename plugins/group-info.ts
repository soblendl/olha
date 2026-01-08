import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['gp', 'gpinfo', 'grupoinfo', 'groupinfo'],

    async execute(ctx: PluginContext): Promise<void> {

        const { chatId, isGroup, reply, dbService, bot } = ctx;

        if (!isGroup) {
            await reply(styleText('ꕤ Este comando solo funciona en grupos.'));
            return;
        }

        try {
            // Obtener metadata del grupo
            const groupMetadata = await bot.groupMetadata(chatId);
            const groupData = dbService.getGroup(chatId);
            const settings = groupData?.settings || {};

            // Iconos de estado
            const statusIcon = (enabled: unknown) => !!enabled ? '✅' : '❌';

            // Contar admins y miembros
            const participants = groupMetadata.participants || [];
            const admins = participants.filter(p => p.admin).length;
            const members = participants.length;

            // Formatear fecha de creación
            const createdAt = groupMetadata.creation
                ? new Date(groupMetadata.creation * 1000).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : 'Desconocida';

            const message = styleText(
                `ꕤ *Informacion Del Grupo*\n\n` +
                `> ┌───────────\n` +
                `> │ ❀ *Nombre »* ${groupMetadata.subject || 'Sin nombre'}\n` +
                `> │ ❀ *ID »* ${chatId.split('@')[0]}\n` +
                `> │ ❀ *Miembros »* ${members}\n` +
                `> │ ❀ *Admins »* ${admins}\n` +
                `> │ ❀ *Creado »* ${createdAt}\n` +
                `> ├───────────\n` +
                `> │ ❀ *SISTEMAS DEL BOT*\n` +
                `> ├───────────\n` +
                `> │ ❀ *Welcome »* ${statusIcon(settings.welcome)}\n` +
                `> │ ❀ *Goodbye »* ${statusIcon(settings.goodbye)}\n` +
                `> │ ❀ *Antilink »* ${statusIcon(settings.antilink)}\n` +
                `> │ ❀ *Economy »* ${statusIcon(settings.economy)}\n` +
                `> │ ❀ *NSFW »* ${statusIcon(settings.nsfw)}\n` +
                `> │ ❀ *Alerts »* ${statusIcon(settings.alerts)}\n` +
                `> └─────────\n\n` +
                `> *Descripción:*\n` +
                `${groupMetadata.desc || '_Sin descripción_'}`
            );

            // Intentar obtener foto del grupo
            try {
                const ppUrl = await bot.sock.profilePictureUrl(chatId, 'image');
                if (ppUrl) {
                    await bot.sock.sendMessage(chatId, {
                        image: { url: ppUrl },
                        caption: message
                    });
                    return;
                }
            } catch (e: unknown) {
                // Sin foto de perfil
            }

            await reply(message);
            return;

        } catch (error: unknown) {
            console.error('[GroupInfo] Error:', error);
            await reply(styleText('ꕤ Error al obtener información del grupo.'));
        }
    }
};

export default plugin;
