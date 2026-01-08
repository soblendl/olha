import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { igdl } from 'ruhend-scraper';


const plugin: Plugin = {
    commands: ['instagram', 'ig', 'igdl'],
    
    async execute(ctx: PluginContext): Promise<void> {
        try {
            if (ctx.args.length === 0) {
                await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #instagram https://www.instagram.com/p/xxxxx\n` +
                    `✿ #ig https://www.instagram.com/reel/xxxxx`
                );
            return;
            }

            const url = ctx.args[0];
            if (!url.includes('instagram.com')) {
                await ctx.reply('《✧》 Por favor ingresa un link válido de Instagram.');
            return;
            }

            const response = await igdl(url);
            const data = response.data;

            if (!data || data.length === 0) {
                await ctx.reply(
                    '《✧》 No se encontró contenido en este enlace.\n\n' +
                    '💡 *Tip:* Verifica que el enlace sea correcto y público.'
                );
            return;
            }

            const media = data.sort((a, b) => {
                const resA = parseInt(a.resolution || '0');
                const resB = parseInt(b.resolution || '0');
                return resB - resA;
            })[0];

            if (!media || !media.url) {
                throw new Error('No se encontró un medio válido.');
            }

            await ctx.replyWithVideo(media.url, {
                caption: `《✧》 *Instagram Downloader*\n\n` +
                    `✿ *Resolución:* ${media.resolution || 'Desconocida'}\n` +
                    `✿ *Link original:* ${url}`
            });

        } catch (error: unknown) {
            console.error('Error en comando instagram:', error);
            await ctx.reply(
                `《✧》 Error al descargar contenido de Instagram.\n\n💡 *Tip:* Asegúrate de que la publicación sea pública y el enlace esté correcto.`
            );
        }
    }
};

export default plugin;
