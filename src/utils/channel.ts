import {DMChannel, TextBasedChannels, TextChannel} from "discord.js";

export const channel = {
    name(channel: TextBasedChannels){
        if(channel.type === 'DM'){
            return (channel as DMChannel).recipient.tag;
        } else {
            let ch = (channel as TextChannel);
            return `[${ch.guild.name}]${ch.name}`;
        }
    }
}