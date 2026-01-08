import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['listjadibot', 'listbots'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const { bot, chatId, prembotManager } = ctx;
        const sock = bot.sock;
        const subbots = prembotManager.getAllPrembots();
        
        if (subbots.length === 0) {
            await sock.sendMessage(chatId, {
                text: 'ꕤ No hay sub-bots activos actualmente.'
            });
            return;
        }

        let message = `ꕤ *Sub-Bots Activos* (${subbots.length})\n\n`;
        subbots.forEach((sb: { userId: string }, i: number) => {
            message += `${i + 1}. @${sb.userId.split('@')[0]}\n`;
        });

        await sock.sendMessage(chatId, {
            text: message,
            mentions: subbots.map(b => b.userId)
        });
    }
};

export default plugin;
