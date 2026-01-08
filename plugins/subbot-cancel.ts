import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['cancelarbot', 'stopbot'],

    async execute(ctx: PluginContext): Promise<void> {
        const { sender, prembotManager, reply } = ctx;

        // Extract clean user ID
        const userId = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;

        const result = prembotManager.stopPrembot(userId);
        await reply(styleText(result.message));
    }
};

export default plugin;
