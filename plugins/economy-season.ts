import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['season', 'temporada'],
    category: 'economy',
    description: 'Ver información de la temporada actual',
    usage: '#season [top]',

    async execute(ctx: PluginContext): Promise<void> {
        const [action] = ctx.args;

        if (action === 'top' || action === 'leaderboard') {
            const leaderboard = await ctx.economySeason.getSeasonLeaderboard(10);
            
            if (leaderboard.length === 0) {
                await ctx.reply('📊 Aún no hay datos en la temporada actual.');
            return;
            }

            let message = '🏆 *TOP 10 TEMPORADA*\n\n';
            
            const medals = ['🥇', '🥈', '🥉'];
            leaderboard.forEach((user: any, index: number) => {
                const medal = index < 3 ? medals[index] : `${index + 1}.`;
                const userId = user.id.split('@')[0];
                message += `${medal} @${userId}\n   💰 ${user.coins.toLocaleString()} monedas\n\n`;
            });

            const userRank = await ctx.economySeason.getUserRank(ctx.sender);
            if (userRank.rank) {
                message += `\n📍 Tu posición: #${userRank.rank} (Top ${userRank.percentile}%)`;
            }

            await ctx.reply(message);
            return;
        }

        const stats = await ctx.economySeason.getSeasonStats();
        
        if (!stats) {
            await ctx.reply('⚠️ No hay temporada activa.');
            return;
        }

        const timeRemaining = stats.timeRemaining;
        let timeMsg = '';
        
        if (timeRemaining.expired) {
            timeMsg = 'La temporada ha finalizado';
        } else {
            timeMsg = `${timeRemaining.days}d ${timeRemaining.hours}h restantes`;
        }

        const userRank = await ctx.economySeason.getUserRank(ctx.sender);

        let message = `📅 *${stats.name}*\n\n`;
        message += `⏰ ${timeMsg}\n`;
        message += `👥 ${stats.participants} participantes\n`;
        message += `💰 ${stats.totalCoins.toLocaleString()} monedas totales\n`;
        message += `📊 Promedio: ${stats.averageCoins.toLocaleString()}\n`;
        
        if (userRank.rank) {
            message += `\n🎯 Tu posición: #${userRank.rank}`;
            message += `\n📈 Top ${userRank.percentile}%`;
        }

        message += `\n\nUsa #season top para ver el ranking`;

        await ctx.reply(message);
    }
};

export default plugin;
