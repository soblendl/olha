import type { Plugin, PluginContext } from '../src/types/plugin.js';
import axios from 'axios';


const plugin: Plugin = {
    commands: ['ytmp4'],
    
    async execute(ctx: PluginContext): Promise<void> {
        try {
            if (ctx.args.length === 0) {
                await ctx.reply('ꕤ Proporciona un enlace de YouTube.');
            return;
            }

            const url = ctx.args[0];
            const apiUrl = `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data || !response.data.download) {
                await ctx.reply('ꕤ No se pudo obtener el video.');
            return;
            }

            await ctx.replyWithVideo(response.data.download, {
                fileName: `${response.data.title || 'video'}.mp4`,
                caption: `ꕥ *YouTube MP4*\n\n✿ *Título:* ${response.data.title || 'Desconocido'}`
            });

        } catch (error: unknown) {
            console.error('Error en comando ytmp4:', error);
            await ctx.reply(
                `ꕤ Error al descargar el video.`
            );
        }
    }
};

export default plugin;
