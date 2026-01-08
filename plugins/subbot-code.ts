import type { Plugin, PluginContext } from '../src/types/plugin.js';



const plugin: Plugin = {
    commands: ['code', 'jadibot'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const { chatId, reply } = ctx;
        await reply(`ꕤ *Sistema Prembot*\n\nPara iniciar un sub-bot, necesitas un token.\nUsa #qr <token> para iniciar la vinculación.`);
    }
};

export default plugin;
