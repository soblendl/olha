import type { Plugin, PluginContext } from '../src/types/plugin.js';
﻿import { formatNumber, getCooldown, formatTime, getRandom } from '../lib/utils.js';

const JOBS = [
    'trabajaste en una panaderia',
    'repariste pizza',
    'hiciste un pastel',
    'vendiste carbón',
    'le serviste un café a un cliente',
    'diseñaste un logo para una empresa',
    'escribiste un documental de animales',
    'tocaste musica con una guitarra',
    'cortaste el cesped del jardin de tu vecina',
    'reparaste electrodomésticos',
    'creaste un phonk',
    'reparaste un ventilador',
    'arreglaste una radio',
    'creaste una aplicación para android',
    'hiciste una cirujia a una señora',
    'le contaste una vulnerabilidad a Google',
    'creaste un sistema operativo'
];


const plugin: Plugin = {
    commands: ['work', 'w'],
    
    async execute(ctx: PluginContext): Promise<void> {
        if (ctx.ctx.isGroup && !ctx.dbService.getGroup(ctx.ctx.chatId).settings.economy) {
            await ctx.ctx.reply('ꕤ El sistema de economía está desactivado en este grupo.');
            return;
        }

        const COOLDOWN = 1 * 60 * 60 * 1000;
        const REWARD = Math.floor(Math.random() * 300) + 100;
        const userData = ctx.userData;
        const cooldown = getCooldown(userData.economy.lastWork, COOLDOWN);
        if (cooldown > 0) {
            await ctx.ctx.reply(
                `ꕤ Estás cansado, descansa un poco.\nVuelve en: ${formatTime(cooldown)}`
            );
        }

        userData.economy.lastWork = Date.now();
        userData.economy.coins += REWARD;
        ctx.dbService.markDirty();
        const job = getRandom(JOBS);
        await ctx.ctx.reply(
            `*ꕥ* ${job} y ganaste *${formatNumber(REWARD)}* coins.`
        );
    }
};

export default plugin;
