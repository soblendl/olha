import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';
import { styleText } from '../lib/utils.js';



const plugin: Plugin = {
    commands: ['lyrics', 'letra'],

    async execute(ctx: PluginContext): Promise<void> {

        const { chatId, args, bot, prefix, command, text } = ctx;
        const conn = bot.sock;

        if (!text || !text.trim()) {
        await ctx.reply(styleText(
        `《✧》 *Uso incorrecto del comando*\\n\\n` +
        `Ejemplo:\\n` +
        `✿ ${prefix}${command} takedown twice\\n` +
        `✿ ${prefix}${command} despacito`
        ));
        return;
        }

        try {
        await ctx.reply(styleText('ꕥ Buscando letra...'));

        const response = await axios.post("https://api-sky.ultraplus.click/tools/lyrics",
        { text: text.trim() },
        { headers: { apikey: "sk_d5a5dec0-ae72-4c87-901c-cccce885f6e6" } }
        );

        const result = response.data?.result;

        if (!result || !result.lyrics) {
        await ctx.reply(styleText(
        '《✧》 No encontré la letra de esa canción. 😿\\n\\n' +
        '💡 *Tip:* Intenta con el nombre del artista también.'
        ));
        return;
        }

        const title = result.title || text;
        const artist = result.artist || 'Desconocido';
        const image = result.image || result.thumbnail || '';
        const lyrics = result.lyrics;

        const caption = `ꕥ *Lyrics Found!*\\n\\n` +
        `> *Título* » ${title}\\n` +
        `> *Artista* » ${artist}\\n\\n` +
        `──────────────────\\n\\n` +
        `${lyrics}\\n\\n` +
        `──────────────────\\n` +
        `> _*Powered By DeltaByte*_`;

        if (image) {
        await conn.sendMessage(chatId, {
        image: { url: image },
        caption: styleText(caption)
        });
        } else {
        await ctx.reply(styleText(caption));
        }

        } catch (error: unknown) {
            console.error('[Lyrics] Error:', error);
            await ctx.reply(styleText('ꕤ Error al buscar la letra.'));
        }
    }
};

export default plugin;
