import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';
import { styleText } from '../lib/utils.js';
import { ttstalk } from '../lib/scrapers.js';

const plugin: Plugin = {
    commands: ['ttuser', 'tiktokuser', 'ttinfo', 'ttstalk'],

    async execute(ctx: PluginContext): Promise<void> {

        const { bot, chatId, args, reply } = ctx;
        const conn = bot?.sock || bot; // Adapting to possible bot structure

        const username = args[0]?.replace('@', '').replace('https://www.tiktok.com/@', '').replace('https://tiktok.com/@', '');

        if (!username) {
        await reply(styleText(
        `ꕤ *Uso del Comando*\n\n` +
        `> */ttuser* <username>\n\n` +
        `*Ejemplo:*\n` +
        `> */ttuser* khaby.lame`
        ));
        return;
        }

        try {
        await reply(styleText(`ꕤ *Buscando información de @${username}...*`));

        const user = await ttstalk(username);

        if (user.status === 'error' || !user.username) {
        await reply(styleText(
        `ꕤ *Error*\n\n` +
        `> No se encontró el usuario @${username}\n` +
        `> Verifica que el nombre de usuario sea correcto.`
        ));
        return;
        }

        // Formatear números grandes
        const formatNumber = (num: any) => {
        if (!num) return '0';
        num = parseInt(num);
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
        };

        const caption = styleText(
        `ꕤ *Perfil de TikTok*\n\n` +
        `> ┌───────────────\n` +
        `> │ ❀ *Usuario »* @${user.username}\n` +
        `> │ ❀ *Nombre »* ${user.name || 'N/A'}\n` +
        `> ├───────────────\n` +
        `> │ ❀ *Seguidores »* ${formatNumber(user.followers)}\n` +
        `> │ ❀ *Siguiendo »* ${formatNumber(user.following)}\n` +
        `> │ ❀ *Likes »* ${formatNumber(user.likes)}\n` +
        `> │ ❀ *Videos »* ${formatNumber(user.videoCount)}\n` +
        `> ├───────────────\n` +
        `> │ ❀ *Bio:*\n` +
        `> │ ${user.bio || '_Sin biografía_'}\n` +
        `> └───────────────\n\n` +
        `> ❀ tiktok.com/@${user.username}`
        );

        // Enviar con foto de perfil si está disponible
        if (user.avatar) {
        try {
        await conn.sendMessage(chatId, {
        image: { url: user.avatar },
        caption: caption
        });
        return;
        } catch (imgError: unknown) {
        console.log('[TTUser] Failed to send image, sending text only');
        }
        }

        await reply(caption);

        } catch (error: unknown) {
            console.error('[TTUser] Error:', error);
            await reply(styleText('ꕤ Error al obtener información del usuario.'));
        }
    }
};

export default plugin;
