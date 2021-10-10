import {Component, ComponentType, PartialEmoji} from "./Component";
import {Snowflake} from "discord.js";

export class Button implements Component{
    readonly type: ComponentType.BUTTON = ComponentType.BUTTON;
    style: ButtonStyle;
    label?: string;
    emoji?: PartialEmoji;
    custom_id?: string;
    url?: string | URL;
    disabled?: boolean;

    constructor(type: ButtonStyle.PRIMARY | ButtonStyle.SECONDARY | ButtonStyle.SUCCESS | ButtonStyle.DANGER, label: string)
    constructor(type: ButtonStyle.PRIMARY | ButtonStyle.SECONDARY | ButtonStyle.SUCCESS | ButtonStyle.DANGER, emoji: PartialEmoji)
    constructor(type: ButtonStyle.LINK, url: string | URL, label: string);

    constructor(type: ButtonStyle, ...params: (string | URL | PartialEmoji)[]) {
        this.style = type
        let param = params.shift();
        if (type === ButtonStyle.LINK) {
            this.url = param.toString();
            param = params.shift();
        }
        if (typeof param === 'string') {
            this.label = param;
        } else {
            this.emoji = param as PartialEmoji;
        }
    }

    setLabel(label: string){
        this.label = label;
        return this;
    }

    setEmoji(emoji: PartialEmoji) {
        this.emoji = emoji;
        return this;
    }

    setCustomId(custom_id: string){
        this.custom_id = custom_id;
        return this;
    }

    setDisabled(disabled: boolean){
        this.disabled = disabled;
        return this;
    }
}

export enum ButtonStyle {
    PRIMARY = 1,
    SECONDARY = 2,
    SUCCESS = 3,
    DANGER = 4,
    LINK = 5,
}