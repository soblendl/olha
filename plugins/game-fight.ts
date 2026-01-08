import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { extractMentions, getRandom, styleText } from '../lib/utils.js';

const MISS_MESSAGES = ['falló el ataque!', 'se tropezó!', 'no dio en el blanco!'];
const ATTACKS = [
    { name: 'Puñetazo', emoji: '👊', damage: [10, 20] },
    { name: 'Patada', emoji: '🦵', damage: [15, 25] },
    { name: 'Cabezazo', emoji: '🗿', damage: [20, 30] },
];

const plugin: Plugin = {
    commands: ['fight', 'pelea', 'pelear', 'batalla', 'vs'],

    async execute(ctx: PluginContext): Promise<void> {

        const { msg, sender, from, chatId, bot, reply, mentionedJid } = ctx;
        
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let opponent = null;
        
        if (mentioned.length > 0) {
            opponent = mentioned[0];
        } else if (quoted) {
            opponent = quoted;
        }
        
        if (!opponent || opponent === sender) {
            await reply(styleText(
                'ꕥ *PELEA - Batalla Virtual*\n\n' +
                'Menciona o responde a alguien:\n' +
                '> • #fight @persona\n' +
                '> • Responder + #fight\n\n' +
                '> ¡No puedes pelear solo!'
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

        const player1 = { jid: sender, name: await getName(sender), hp: 100 };
        const player2 = { jid: opponent, name: await getName(opponent), hp: 100 };

        let battleLog: string[] = [];
        let turn = 0;

        while (player1.hp > 0 && player2.hp > 0 && turn < 10) {
            const attacker = turn % 2 === 0 ? player1 : player2;
            const defender = turn % 2 === 0 ? player2 : player1;

            const hitChance = Math.random();

            if (hitChance < 0.15) {
                battleLog.push(`▸ ${attacker.name} ${getRandom(MISS_MESSAGES)}`);
            } else {
                const attack = getRandom(ATTACKS);
                const damage = Math.floor(Math.random() * (attack.damage[1] - attack.damage[0])) + attack.damage[0];
                defender.hp = Math.max(0, defender.hp - damage);
                battleLog.push(`▸ ${attacker.name} usó *${attack.name}* ${attack.emoji} (-${damage}hp)`);
            }

            turn++;
        }

        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = player1.hp > player2.hp ? player2 : player1;

        const hpBar = (hp: number) => {
            const filled = Math.floor(hp / 10);
            const empty = 10 - filled;
            return '🟢'.repeat(filled) + '⚫'.repeat(empty);
        };

        const text = `
⚔️ *BATALLA ÉPICA*

👤 ${player1.name}
${hpBar(player1.hp)} ${player1.hp}hp

⚡ VS ⚡

👤 ${player2.name}
${hpBar(player2.hp)} ${player2.hp}hp

━━━━━━━━━━━━━
${battleLog.join('\n')}
━━━━━━━━━━━━━

🏆 *GANADOR: ${winner.name}*
💀 Perdedor: ${loser.name}
        `.trim();

        await bot.sendMessage(chatId, {
            text: styleText(text),
            mentions: [sender, opponent]
        }, { quoted: msg });
    }
};

export default plugin;