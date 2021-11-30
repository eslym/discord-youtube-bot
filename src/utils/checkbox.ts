import {MessageButton} from "discord.js";

export function checkbox(label: string, checked: boolean = false){
    return new MessageButton()
        .setStyle('SECONDARY')
        .setLabel(label)
        .setEmoji(checked ? '✅' : '⬜');
}