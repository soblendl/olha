import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['join', 'invite', 'unirse'],

    async execute(ctx: PluginContext): Promise<void> {

        const link = ctx.args[0];

        if (!link) {
            return ctx.reply(styleText(
                `ꕤ *Uso del Comando*\n\n` +
                `> /join <link del grupo>\n` +
                `> /invite <link del grupo>\n\n` +
                `*Ejemplo:*\n` +
                `> /join https://chat.whatsapp.com/ABC123xyz`
            ));
        }

        // Extraer el código de invitación del link
        let inviteCode = link;

        // Si es un link completo, extraer el código
        if (link.includes('chat.whatsapp.com/')) {
            inviteCode = link.split('chat.whatsapp.com/')[1];
        } else if (link.includes('whatsapp.com/')) {
            inviteCode = link.split('whatsapp.com/')[1];
        }

        // Limpiar el código (quitar parámetros extras)
        inviteCode = inviteCode?.split('?')[0]?.split('#')[0]?.trim();

        if (!inviteCode) {
            return ctx.reply(styleText(
                `❌ *Error*\n\n` +
                `> El link proporcionado no es válido.\n` +
                `> Asegúrate de enviar un link de invitación de WhatsApp.`
            ));
        }

        try {
            await ctx.reply(styleText(
                `ꕤ *Procesando...*\n\n` +
                `> Intentando unirse al grupo...`
            ));

            // Unirse al grupo usando el código de invitación
            const result = await ctx.bot.sock.groupAcceptInvite(inviteCode);

            if (result) {
                await ctx.reply(styleText(
                    `ꕥ *¡Éxito!*\n\n` +
                    `> Me he unido al grupo correctamente.\n` +
                    `> ID del grupo: ${result}`
                ));
            } else {
                await ctx.reply(styleText(
                    `ꕥ *¡Listo!*\n\n` +
                    `> Solicitud enviada correctamente.`
                ));
            }

        } catch (error: unknown) {
            console.error('[Join] Error:', error);
            await ctx.reply(styleText(
                `❌ *Error al unirse*\n\n` +
                `> No se pudo unir al grupo.\n` +
                `> Verifica que el link sea válido o no haya expirado.`
            ));
        }
    }
};

export default plugin;
