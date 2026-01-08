import type { Plugin, PluginContext } from '../src/types/plugin.js';
import { styleText } from '../lib/utils.js';

const mathGames = new Map<string, { answer: number; timer: NodeJS.Timeout }>();

const plugin: Plugin = {
    commands: ['math', 'mates'],

    async execute(ctx: PluginContext): Promise<void> {

        const { chatId, reply } = ctx;
        
        if (mathGames.has(chatId)) {
            await reply(styleText('ꕤ Ya hay un juego de matemáticas en curso.'));
            return;
        }

        const operations = ['+', '-', '*', '/'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        let a = 0, b = 0, answer = 0;
        
        if (op === '+') {
            a = Math.floor(Math.random() * 50);
            b = Math.floor(Math.random() * 50);
            answer = a + b;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 50) + 20;
            b = Math.floor(Math.random() * 20);
            answer = a - b;
        } else if (op === '*') {
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            answer = a * b;
        } else if (op === '/') {
            b = Math.floor(Math.random() * 10) + 1;
            answer = Math.floor(Math.random() * 10) + 1;
            a = answer * b;
        }

        const timer = setTimeout(() => {
            if (mathGames.has(chatId)) {
                reply(styleText(`ꕤ *Tiempo agotado* La respuesta era: ${answer}`));
                mathGames.delete(chatId);
            }
        }, 30000);

        mathGames.set(chatId, {
            answer,
            timer
        });

        await reply(styleText(`ꕤ *Math Game*\n\n> Resuelve: *${a} ${op} ${b}*`));
    }
};

export default plugin;