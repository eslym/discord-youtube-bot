import {MessageEmbed} from "discord.js";

type EmbedGenerator = (text: string)=>MessageEmbed;

type EmbedUtils = {
    [key in 'info' | 'log' | 'warn' | 'error']: EmbedGenerator;
};

const colors = {
    info: 'GREEN',
    log: 'WHITE',
    warn: 'YELLOW',
    error: 'RED',
}

export const embed: EmbedUtils = {} as any;

for (let key in colors) {
    embed[key] = function (text: string){
        return new MessageEmbed({description: text})
            .setColor(colors[key]);
    }
}
