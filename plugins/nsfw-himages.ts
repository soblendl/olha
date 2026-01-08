import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { loadLinks, getRandomLink, downloadMedia } from '../lib/nsfw.js';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['himages'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const { chatId, isGroup, bot } = ctx;
        
        if (isGroup && !(global.db as any).groups[chatId]?.settings?.nsfw) {
            await ctx.reply(styleText('ꕤ Los comandos NSFW están desactivados en este grupo.'));
            return;
        }

        try {
            await ctx.reply(styleText('ꕤ Cargando imagen hentai...'));
            
            const links = await loadLinks('hentai');
            if (links.length === 0) {
                await ctx.reply(styleText('ꕤ Error al cargar la base de datos de imágenes.'));
                return;
            }

            const randomUrl = getRandomLink(links);
            const buffer = await downloadMedia(randomUrl);
            
            if (!buffer) {
                await ctx.reply(styleText('ꕤ Error al descargar la imagen.'));
                return;
            }

            await bot.sock.sendMessage(chatId, {
                image: buffer,
                caption: styleText('ꕥ Imagen hentai aleatoria')
            });
            
        } catch (error: unknown) {
            console.error('Error en himages:', error);
            await ctx.reply(styleText('ꕤ Ocurrió un error al procesar la solicitud.'));
        }
    }
};

export default plugin;