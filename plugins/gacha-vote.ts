import type { Plugin, PluginContext } from '../src/types/plugin.js';

const plugin: Plugin = {
    commands: ['vote', 'votar'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Debes especificar el nombre del personaje.\nUso: #vote <personaje>'
            });
            return;
        }

        const charName = ctx.args.join(' ').toLowerCase();
        const userData = global.db.users[ctx.sender];

        if (!userData.gacha.votes) {
            userData.gacha.votes = {};
        }

        const lastVote = userData.gacha.votes[charName] || 0;
        const COOLDOWN = 24 * 60 * 60 * 1000;

        if (Date.now() - lastVote < COOLDOWN) {
            await ctx.bot.sock.sendMessage(ctx.chatId, {
                text: 'ꕤ Ya votaste por este personaje hoy. Vuelve mañana.'
            });
            return;
        }

        userData.gacha.votes[charName] = Date.now();

        if (!global.db.waifus[charName]) {
            global.db.waifus[charName] = { votes: 0 };
        }

        global.db.waifus[charName].votes = (global.db.waifus[charName].votes || 0) + 1;

        await ctx.bot.sock.sendMessage(ctx.chatId, {
            text: `ꕥ Has votado por ${ctx.args.join(' ')}\n` +
                `Votos totales: ${global.db.waifus[charName].votes}`
        });
    }
};

export default plugin;
