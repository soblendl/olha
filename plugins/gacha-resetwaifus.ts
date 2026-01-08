import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { isOwner } from '../lib/utils.js';


const plugin: Plugin = {
    commands: ['resetwaifus', 'reiniciarwaifus'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (!isOwner(ctx.sender, global.botOwner)) {
            await ctx.reply('✘ Solo el owner puede usar este comando.');
            return;
        }

        try {
            const gachaService = ctx.gachaService;
            const characters = gachaService.getAll();

            if (characters.length === 0) {
                await ctx.reply('✘ No hay waifus registradas.');
            return;
            }

            gachaService.resetAllCharacters();

            const users = ctx.db.users || {};
            for (const userId in users) {
                if (users[userId].gacha && users[userId].gacha.characters) {
                    users[userId].gacha.characters = [];
                }
            }
            ctx.dbService.markDirty();

            await ctx.reply('✅ Todas las waifus han sido reiniciadas. Ahora nadie las posee.');
        } catch (error: unknown) {
            await ctx.reply(`✘ Error: ${(error as Error).message}`);
        }
    }
};

export default plugin;
