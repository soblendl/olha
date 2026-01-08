import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['bots', 'sockets'],
    
    async execute(ctx: PluginContext): Promise<void> {
        await ctx.reply(
            `ꕥ *Estado de Bots*\n\n` +
            `ꕥ Bots activos: 1\n` +
            `ꕥ Estado: Online\n` +
            `ꕥ Uptime: Activo`
        );
    }
};

export default plugin;
