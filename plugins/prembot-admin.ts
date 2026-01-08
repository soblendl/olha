import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { OWNER_JID } from '../lib/constants.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['prembotadmin', 'padmin'],

    async execute(ctx: PluginContext): Promise<void> {

        const { args, sender, reply, tokenService, prembotManager, msg, bot } = ctx;

        const ownerJid = OWNER_JID || '573115434166@s.whatsapp.net';
        if (sender !== ownerJid) {
            await reply(styleText('ꕤ Este comando es solo para el owner.'));
            return;
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || subCommand === 'help') {
            await reply(styleText(
                `ꕥ *PREMBOT ADMIN*\n\n` +
                `*Comandos:*\n\n` +
                `> *#padmin list*\n` +
                `>   Ver todos los prembots\n\n` +
                `> *#padmin gentoken @user 30d*\n` +
                `>   Generar token (7d, 30d, 365d)\n\n` +
                `> *#padmin ban @user*\n` +
                `>   Banear prembot\n\n` +
                `> *#padmin unban @user*\n` +
                `>   Desbanear prembot\n\n` +
                `> *#padmin stop @user*\n` +
                `>   Forzar desconexión\n\n` +
                `> *#padmin stats*\n` +
                `>   Ver estadísticas globales`
            ));
            return;
        }

        if (subCommand === 'list') {
            const prembots = tokenService?.getAllPrembots() || [];

            if (prembots.length === 0) {
                await reply(styleText('ꕤ No hay prembots registrados.'));
                return;
            }

            let message = `ꕥ *PREMBOTS ACTIVOS*\n\n`;

            for (const p of prembots) {
                const status = p.banned ? '⛔' : (p.daysRemaining > 0 ? '🟢' : '🔴');
                const user = p.userId.split('@')[0];
                message += `${status} ${user}\n`;
                message += `   └ ${p.daysRemaining}d | ${p.stats.commands} cmds\n`;
            }

            message += `\n> *Total* » ${prembots.length}`;
            await reply(styleText(message));
            return;
        }

        if (subCommand === 'gentoken') {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const duration = args[2] || '30d';
            if (!mentioned) {
                await reply(styleText('ꕤ Debes mencionar al usuario.\n> Ej: *#padmin gentoken* <@mention> 30d'));
                return;
            }
            const token = tokenService?.createToken(mentioned, duration);
            if (token) {
                await reply(styleText(
                    `ꕥ *Token Generado*\n\n` +
                    `> Usuario » @${mentioned.split('@')[0]}\n` +
                    `> Duración » ${duration}\n` +
                    `> Token »\n\`${token.id}\`\n\n` +
                    `> Envíale este token al usuario.`),
                    { mentions: [mentioned] }
                );

                try {
                    await bot.sock.sendMessage(mentioned, {
                        text: styleText(`ꕥ *PREMBOT TOKEN*\n\n` +
                            `Tu token premium:\n` +
                            `\`${token.id}\`\n\n` +
                            `*Para activar:*\n` +
                            `#prembot ${token.id}\n\n` +
                            `> Válido por: ${duration}`)
                    });
                } catch (e: unknown) {
                    console.log('Could not send token to user directly');
                }
            } else {
                await reply(styleText('ꕤ Error generando token.'));
            }
            return;
        }

        if (subCommand === 'ban') {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const reason = args.slice(2).join(' ') || 'Comportamiento inapropiado';
            if (!mentioned) {
                await reply(styleText('ꕤ Debes mencionar al usuario.\n> Ej: *#padmin ban* <@mention> razón'));
                return;
            }
            const result = tokenService?.banPrembot(mentioned, reason);
            prembotManager?.stopPrembot(mentioned);
            if (result) {
                await reply(styleText(
                    `ꕥ *Prembot Baneado*\n\n` +
                    `> @${mentioned.split('@')[0]}\n` +
                    `> Razón » ${reason}`),
                    { mentions: [mentioned] }
                );
            } else {
                await reply(styleText('ꕤ Usuario no encontrado.'));
            }
            return;
        }

        if (subCommand === 'unban') {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!mentioned) {
                await reply(styleText('ꕤ Debes mencionar al usuario.'));
                return;
            }

            const result = tokenService?.unbanPrembot(mentioned);

            if (result) {
                await reply(styleText(
                    `ꕥ *Prembot Desbaneado*\n\n` +
                    `> @${mentioned.split('@')[0]}`),
                    { mentions: [mentioned] }
                );
            } else {
                await reply(styleText('ꕤ Usuario no encontrado.'));
            }
            return;
        }

        if (subCommand === 'stop') {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!mentioned) {
                await reply(styleText('ꕤ Debes mencionar al usuario.'));
                return;
            }
            const result = prembotManager?.stopPrembot(mentioned);
            if (result?.success) {
                await reply(styleText(
                    `ꕥ *Prembot Detenido*\n\n` +
                    `> @${mentioned.split('@')[0]}`),
                    { mentions: [mentioned] }
                );
            } else {
                await reply(styleText(result?.message || 'ꕤ Error al detener'));
            }
            return;
        }

        if (subCommand === 'stats') {
            const prembots = tokenService?.getAllPrembots() || [];
            const activePrembots = prembots.filter(p => !p.banned && p.daysRemaining > 0);
            const totalCommands = prembots.reduce((sum, p) => sum + (p.stats?.commands || 0), 0);
            const totalMessages = prembots.reduce((sum, p) => sum + (p.stats?.messages || 0), 0);
            const payments = tokenService?.data?.payments || [];
            const completedPayments = payments.filter(p => p.status === 'COMPLETED');
            const revenue = completedPayments.length * 2;

            await reply(styleText(
                `ꕥ *PREMBOT STATS*\n\n` +
                `*Prembots:*\n` +
                `> • Total » ${prembots.length}\n` +
                `> • Activos » ${activePrembots.length}\n` +
                `> • Baneados » ${prembots.filter(p => p.banned).length}\n\n` +
                `*Uso:*\n` +
                `> • Comandos » ${totalCommands.toLocaleString()}\n` +
                `> • Mensajes » ${totalMessages.toLocaleString()}\n\n` +
                `*Ingresos:*\n` +
                `> • Pagos » ${completedPayments.length}\n` +
                `> • Revenue » $${revenue} USD`
            ));
            return;
        }

        await reply(styleText('ꕤ Comando no reconocido.\n> Usa *#padmin help*'));
    }
};

export default plugin;
