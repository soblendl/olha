import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText, extractMentions } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['kiss', 'skiss', 'kis', 'besos', 'beso', 'besar', 'besando'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, sender, from, chatId } = ctx;

        let who;
        const mentioned = extractMentions(ctx);
        const quoted = (msg as Error).message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        } else {
            who = sender;
        }

        const senderName = from.name || sender.split('@')[0];

        let targetName;
        if (who === sender) {
            targetName = 'alguien';
        } else {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await ctx.bot.groupMetadata(chatId);
                    const whoNumber = who.split('@')[0].split(':')[0];

                    const participant = groupMetadata.participants.find(p => {
                        const participantNumber = p.id.split('@')[0].split(':')[0];
                        return participantNumber === whoNumber;
                    });

                    targetName = participant?.notify || participant?.name || whoNumber;
                } else {
                    targetName = who.split('@')[0].split(':')[0];
                }
            } catch (e: unknown) {
                targetName = who.split('@')[0].split(':')[0];
            }
        }

        try {
            const res = await fetch('https://nekos.life/api/kiss');
            const json = await res.json();
            const { url } = json;

            const str = styleText(`\`${senderName}\` está besando a \`${targetName}\``);

            await ctx.bot.sendMessage(chatId, {
                image: { url: url },
                caption: str,
                mentions: [who]
            }, { quoted: msg });

        } catch (e: unknown) {
            console.error('[Kiss] Error:', e);
            await ctx.reply(styleText('ꕤ Error al obtener el GIF.'));
        }
    }
};

export default plugin;
