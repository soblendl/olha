import type { Plugin, PluginContext } from '../src/types/plugin.js';



const plugin: Plugin = {
    commands: ['stopjadibot', 'stopbot'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const { chatId, sender, prembotManager, reply } = ctx;
        const result = prembotManager.stopPrembot(sender);
        await reply(result.message);
    }
};

export default plugin;
