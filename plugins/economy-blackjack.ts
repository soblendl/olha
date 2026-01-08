import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['blackjack', 'bj', '21'],

    async execute(ctx: PluginContext): Promise<void> {
        // TODO: Migrate execute body manually
        await ctx.reply("Plugin needs manual migration");
    }
};

export default plugin;
