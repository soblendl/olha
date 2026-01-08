import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';
import { scSearch, sendSoundCloud, SESSION_TIMEOUT } from '../lib/scrapers.js';

const plugin: Plugin = {
    commands: ['soundcloud', 'scsearch'],

    async execute(ctx: PluginContext): Promise<void> {

        const { text, prefix, command, sender } = ctx
        try {
        if (!global.scsearch) {
        global.scsearch = {};
        }

        if (!text) {
        await ctx.reply(styleText(
        `📻 *Ejemplo:* ${prefix}${command} ncs\n\nPara buscar canciones en SoundCloud.`
        ));
        return;
        }

        const result = await scSearch(text)
        if (!result || result.length === 0) {
            await ctx.reply(styleText('❌ No se encontraron resultados.'));
            return;
        }
        if (result.length === 1) {
        const song = result[0];
        await sendSoundCloud(ctx, song.link);
        return;
        }

        const list = result
        .map((v: any, i: number) => {
        const title = v.title || 'Sin título';
        const artist = v.artist || 'Artista desconocido';
        const link = v.link || '';
        return `*${i + 1}.* 🎵 ${title}\n👤 ${artist}\n🔗 ${link}`;
        })
        .join('\n\n');

        await ctx.reply(styleText(
        `🎧 *Resultados de SoundCloud:*\n\n${list}\n\n` +
        `Escribe el número *1 - ${result.length}* para descargar.`
        ));

        global.scsearch[sender] = result
        setTimeout(() => {
        if (global.scsearch[sender]) {
        delete global.scsearch[sender]
        }
        }, SESSION_TIMEOUT)
        } catch (err: unknown) {
        console.error('Error en execute:', err);
        await ctx.reply(styleText('⚠️ Ocurrió un error al buscar: ' + (err as Error).message));
        }
        },

        async before(ctx: PluginContext): Promise<boolean> {
        try {
        const { text, sender } = ctx
        if (!text || !global.scsearch?.[sender]) { return false }
        const results = global.scsearch[sender];
        const num = parseInt(text.trim());
        if (isNaN(num) || num < 1 || num > results.length) { return false }
        const song = results[num - 1];
        delete global.scsearch[sender];
        try {
        await sendSoundCloud(ctx, song.link);
        } catch (err: unknown) {
        console.error('Error enviando audio:', err);
        await ctx.reply(styleText('❌ Error al enviar el archivo de audio.'));
        }

        return true
        } catch (err: unknown) {
            console.error('[SoundCloud Before] Error:', err);
            return false;
        }
    }
};

export default plugin;
