import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { extractMentions, getRandom, styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['dare', 'reto', 'truth', 'verdad', 'tod'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, sender, from, chatId, command } = ctx;
        const mentioned = extractMentions(ctx);
        const quoted = (msg as Error).message?.extendedTextMessage?.contextInfo?.participant;
        let target = null
        if (mentioned.length > 0) {
        target = mentioned[0];
        } else if (quoted) {
        target = quoted;
        } else {
        target = sender;
        }
        const getNumber = (jid) => jid.split('@')[0].split(':')[0];
        const getName = async (jid) => {
        try {
        if (chatId.endsWith('@g.us')) {
        const groupMetadata = await ctx.bot.groupMetadata(chatId);
        const number = getNumber(jid);
        const participant = groupMetadata.participants.find(p =>
        getNumber(p.id) === number
        );
        return participant?.notify || participant?.name || number;
        }
        } catch (e: unknown) { }
        return getNumber(jid);
        };
        const targetName = await getName(target);
        const senderName = await getName(sender);
        const isTruth = ['truth', 'verdad'].includes(command);
        const isDare = ['dare', 'reto'].includes(command);
        const isRandom = command === 'tod';
        let choice;
        if (isRandom) {
        choice = Math.random() > 0.5 ? 'truth' : 'dare';
        } else {
        choice = isTruth ? 'truth' : 'dare';
        }
        const text = choice === 'truth'
        ? getRandom(TRUTHS)
        : getRandom(DARES);

        const emoji = choice === 'truth' ? '❓' : '🔥';
        const title = choice === 'truth' ? 'VERDAD' : 'RETO';

        const response = `
        ${emoji} *${title}* ${emoji}

        👤 *Para:* ${targetName}
        🎯 *De:* ${senderName}

        ━━━━━━━━━━━━━
        ${text}
        ━━━━━━━━━━━━━

        > ¡No puedes negarte!
        `.trim();

        await ctx.bot.sendMessage(chatId, {
        text: styleText(response),
        mentions: [target]
        }, { quoted: msg });
    }
};

export default plugin;
