import type { Plugin, PluginContext } from '../src/types/plugin.js';

import axios from 'axios';
import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['play', 'play2'],

    async execute(ctx: PluginContext): Promise<void> {
        // TODO: Migrate execute body manually
        await ctx.reply("Plugin needs manual migration");
    }
};

export default plugin;
