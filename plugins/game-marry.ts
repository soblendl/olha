import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { extractMentions, getRandom, styleText } from '../lib/utils.js';

const CEREMONIES = ['En la playa al atardecer', 'En un castillo medieval', 'En Las Vegas', 'En una capilla del bosque'];
const GIFTS = ['Un anillo de diamantes', 'Una casa en la playa', 'Un viaje alrededor del mundo', 'Un auto deportivo'];
const FUTURES = ['Vivirán felices para siempre', 'Tendrán 3 hijos', 'Viajarán por el mundo', 'Serán millonarios'];

const plugin: Plugin = {
    commands: ['marry', 'casar', 'matrimonio', 'boda', 'casarse'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, sender, from, chatId, bot, reply } = ctx;

        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        let partner = null;

        if (mentioned.length > 0) {
            partner = mentioned[0];
        } else if (quoted) {
            partner = quoted;
        }

        if (!partner || partner === sender) {
            await reply(styleText(
                '💒 *MATRIMONIO VIRTUAL*\n\n' +
                'Menciona o responde a alguien:\n' +
                '• #marry @persona\n' +
                '• Responder + #marry\n\n' +
                '> ¡No puedes casarte solo!'
            ));
            return;
        }

        const getNumber = (jid: string) => jid.split('@')[0].split(':')[0];

        const getName = async (jid: string) => {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await bot.groupMetadata(chatId);
                    const number = getNumber(jid);
                    const participant = groupMetadata.participants.find((p: any) =>
                        getNumber(p.id) === number
                    );
                    return participant?.notify || participant?.name || number;
                }
            } catch (e: unknown) { }
            return getNumber(jid);
        };

        const name1 = await getName(sender);
        const name2 = await getName(partner);

        const ceremony = getRandom(CEREMONIES);
        const gift = getRandom(GIFTS);
        const future = getRandom(FUTURES);
        const loveScore = Math.floor(Math.random() * 51) + 50;

        const rings = '💍'.repeat(Math.floor(loveScore / 20));

        const text = `
ꕥ *¡BODA VIRTUAL!* 

👰 ${name1}
❤️ + 💕 + ❤️    
🤵 ${name2}

━━━━━━━━━━━━━
> *Lugar* » ${ceremony}
> *Regalo* » ${gift}
> *Futuro* » ${future}
${rings} *Amor* » ${loveScore}%
━━━━━━━━━━━━━

✨ Los declaro oficialmente
casados virtuales ✨

> Que vivan felices por siempre~
        `.trim();

        await bot.sendMessage(chatId, {
            text: styleText(text),
            mentions: [sender, partner]
        }, { quoted: msg });
    }
};

export default plugin;