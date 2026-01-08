import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { loadLinks, getRandomLink, downloadMedia } from '../lib/nsfw.js';


const plugin: Plugin = {
    commands: ['pornvideo', 'pv'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.isGroup && !(global.db as any).groups[ctx.chatId]?.settings?.porn) {
            await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Los comandos NSFW están desactivados en este grupo.' });
            return;
        }

        try {
            await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Cargando video, esto puede tardar...' });
            return;
            
            const links = await loadLinks('porno');
            if (links.length === 0) {
                await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Error al cargar la base de datos de videos.' });
            return;
            }

            const randomUrl = getRandomLink(links);
            const buffer = await downloadMedia(randomUrl);
            
            if (!buffer) {
                await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Error al descargar el video.' });
            return;
            }

            await ctx.bot.sock.sendMessage(ctx.chatId, {
                video: buffer,
                caption: 'ꕥ Video aleatorio'
            });
            return;
        } catch (error: unknown) {
            console.error('Error en pornvideo:', error);
            await ctx.bot.sock.sendMessage(ctx.chatId, { text: 'ꕤ Ocurrió un error al procesar la solicitud.' });
            return;
        }
    }
};

export default plugin;
