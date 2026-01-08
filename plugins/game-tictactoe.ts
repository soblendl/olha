import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['tictactoe', 'ttt', 'gato'],

    async execute(ctx: PluginContext): Promise<void> {
        // TODO: Migrate execute body manually
        await ctx.reply("Plugin needs manual migration");
    }
};

export default plugin;
