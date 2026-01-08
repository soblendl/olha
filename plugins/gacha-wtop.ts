import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['wtop', 'topwaifus'],
    
    async execute(ctx: PluginContext): Promise<void> {
        const waifus = Object.entries(global.db.waifus || {})
            .map(([name, data]) => ({ name, votes: data.votes || 0 }))
            .filter(w => w.votes > 0)
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 10);

        if (waifus.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ No hay votos registrados aún.'
            });
            return;
        }

        let message = 'ꕥ *Top 10 Waifus*\n\n';
        
        waifus.forEach((waifu: any, i: number) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            message += `${medal} ${waifu.name.charAt(0).toUpperCase() + waifu.name.slice(1)}: ❤️ ${waifu.votes} votos\n`;
        });

        await ctx.bot.sock.sendMessage(ctx.chatId, { text: message });
            return;
    }
};

export default plugin;
