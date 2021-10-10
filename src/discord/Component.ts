import {Snowflake} from "discord.js";

export interface Component {
    type: ComponentType;
}

export enum ComponentType {
    ACTION_ROW = 1,
    BUTTON = 2,
    SELECT_MENU = 3,
}

export declare type PartialEmoji =
    { id: Snowflake, name?: string, animated?: boolean } |
    { name: string, id?: Snowflake, animated?: boolean };
