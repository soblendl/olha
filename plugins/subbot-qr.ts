import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['qr'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const { chatId, sender, args, prembotManager, bot, reply } = ctx;

        if (!args[0]) {
            await reply('ꕤ Debes proporcionar un token.\nUso: #qr <token>');
            return;
        }

        await reply('ꕤ Iniciando sub-bot, por favor espera...');

        // Clean phone number from sender ID
        const phoneNumber = sender.split('@')[0];
        
        const result = await prembotManager.startPrembot(args[0], chatId, bot.sock, phoneNumber);
        
        if (!result.success) {
            await reply(result.message);
            return;
        }
    }
};

export default plugin;
