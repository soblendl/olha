import type { Plugin, PluginContext } from '../src/types/plugin.js';


import axios from 'axios';


const plugin: Plugin = {
    commands: ['ytmp3'],
    
    async execute(ctx: PluginContext): Promise<void> {
        try {
            if (ctx.args.length === 0) {
                await ctx.reply('ꕤ Proporciona un enlace de YouTube.');
            return;
            }

            const url = ctx.args[0];
            const apiUrl = `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data || !response.data.download) {
                await ctx.reply('ꕤ No se pudo obtener el audio.');
            return;
            }

            await ctx.replyWithAudio(response.data.download, {
                fileName: `${response.data.title || 'audio'}.mp3`,
                caption: `ꕥ *YouTube MP3*\n\n✿ *Título:* ${response.data.title || 'Desconocido'}`
            });

        } catch (error: unknown) {
            console.error('Error en comando ytmp3:', error);
            await ctx.reply(
                `ꕤ Error al descargar el audio.`
            );
        }
    }
};

export default plugin;
