import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { extractMentions } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['desbloquear', 'unlock'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const mentions = extractMentions(ctx);
        const userData = ctx.userData;

        if (mentions.length === 0) {
            await ctx.ctx.reply('✘ Debes mencionar a alguien.\n\nEjemplo:\n*#desbloquear @usuario*');
            return;
        }

        const target = mentions[0];
        const targetData = ctx.dbService.getUser(target);

        const costo = 100000;
        const duracion = 3 * 60 * 1000;

        if ((userData.monedas || 0) < costo) {
            await ctx.ctx.reply(
                `✘ No tienes suficientes monedas.\n` +
                `Necesitas *${costo.toLocaleString()}* monedas para desbloquear la base de @${target.split('@')[0]}.`,
                { mentions: [target] }
            );
        }

        userData.monedas = (userData.monedas || 0) - costo;
        targetData.desbloqueo = Date.now() + duracion;
        targetData.antirobo = 0;
        ctx.dbService.markDirty();

        await ctx.ctx.reply(
            `⚠️ *Base desbloqueada*.\n` +
            `🔓 @${target.split('@')[0]} ahora está vulnerable por 3 minutos.\n` +
            `⏳ Podrás robar sus waifus hasta: *${new Date(targetData.desbloqueo).toLocaleString()}*`,
            { mentions: [target] }
        );
    }
};

export default plugin;
