import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { isOwner, extractMentions, formatNumber, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['wcoins', 'addcoins', 'setcoins'],

    async execute(ctx: PluginContext): Promise<void> {

        if (!isOwner(ctx.ctx.sender, global.botOwner)) {
        await ctx.ctx.reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        const mentioned = extractMentions(ctx);
        const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;

        let targetUser = null;

        if (mentioned.length > 0) {
        targetUser = mentioned[0];
        } else if (quoted) {
        targetUser = quoted;
        }

        if (!targetUser) {
        await ctx.ctx.reply(styleText(
        'ꕥ *WCOINS - Dar Coins (Owner)*\n\n' +
        '> Uso » *#wcoins* @usuario <cantidad>\n' +
        '> O responde a alguien + *#wcoins* <cantidad>\n\n' +
        '> Da coins ilimitadas a cualquier usuario'
        ));
        }

        const amount = parseInt(ctx.ctx.args.find(arg => !isNaN(parseInt(arg))));
        if (!amount || amount <= 0) {
        await ctx.ctx.reply(styleText('✘ Especifica una cantidad válida de coins.'));
        }
        const targetData = ctx.dbService.getUser(targetUser);
        if (!targetData.economy) {
        targetData.economy = { coins: 0 };
        }
        const newBalance = targetData.economy.coins + amount;
        ctx.dbService.updateUser(targetUser, {
        'economy.coins': newBalance
        });
        const targetNumber = targetUser.split('@')[0].split(':')[0];
        await ctx.ctx.reply(styleText(
        `ꕥ *Coins Añadidas*\n\n` +
        `> Usuario » @${targetNumber}\n` +
        `> Cantidad » +¥${formatNumber(amount)}\n` +
        `> Nuevo balance » ¥${formatNumber(newBalance)}`),
        { mentions: [targetUser] }
        );
    }
};

export default plugin;
