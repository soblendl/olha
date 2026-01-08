import type { Plugin, PluginContext } from '../src/types/plugin.js';

import { styleText } from '../lib/utils.js';

const plugin: Plugin = {
    commands: ['ppt', 'piedra', 'papel', 'tijera'],

    async execute(ctx: PluginContext): Promise<void> {

        let userChoice = ctx.ctx.args[0]?.toLowerCase();
        if (!userChoice && ctx.command !== 'ppt') {
        userChoice = ctx.command;
        }

        if (!userChoice || !['piedra', 'papel', 'tijera'].includes(userChoice)) {
        await ctx.ctx.reply(styleText('ꕤ Debes elegir: *piedra*, *papel* o *tijera*.\n> Ejemplo: *#ppt* piedra'));
        }

        const choices = ['piedra', 'papel', 'tijera'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        const emojis = {
        piedra: '🪨',
        papel: '📄',
        tijera: '✂️'
        };

        let result = '';
        if (userChoice === botChoice) {
        result = 'ꕤ Empate, nadie gano.';
        } else if (
        (userChoice === 'piedra' && botChoice === 'tijera') ||
        (userChoice === 'papel' && botChoice === 'piedra') ||
        (userChoice === 'tijera' && botChoice === 'papel')
        ) {
        result = 'ꕥ Ganaste, felicidades.';
        } else {
        result = 'ꕤ Perdiste (gana el bot).';
        }

        const text = `
        ❐ *Piedra, Papel o Tijera* 

        ⛱ Tú: ${userChoice} ${emojis[userChoice]}
        ✰ Bot: ${botChoice} ${emojis[botChoice]}

        > RESULTADO: ${result}
        `.trim();

        await ctx.ctx.reply(styleText(text));
    }
};

export default plugin;
