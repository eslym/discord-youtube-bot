import {Component, ComponentType, PartialEmoji} from "./Component";

export class SelectMenu implements Component {
    readonly type: ComponentType.SELECT_MENU = ComponentType.SELECT_MENU;
    custom_id: string;
    options: SelectOption[];
    placeholder?: string;
    min_values?: number;
    max_values?: number;
    disabled?: boolean;

    constructor(custom_id: string, options?: SelectOption[]) {
        this.custom_id = custom_id;
        this.options = Array.isArray(options) ? Array.from(options) : [];
    }

    setPlaceholder(placeholder: string){
        this.placeholder = placeholder;
        return this;
    }

    setMin(min: number){
        this.min_values = min;
        return this;
    }

    setMax(max: number){
        this.max_values = max;
        return this;
    }

    setDisabled(disabled: boolean){
        this.disabled = disabled;
        return this;
    }
}

export class SelectOption {
    label: string;
    value: string;
    description?: string;
    emoji?: PartialEmoji;
    default?: boolean;

    constructor(label: string, value: string) {
        this.label = label;
        this.value = value;
    }

    setDescription(description: string){
        this.description = description;
        return this;
    }

    setEmoji(emoji: PartialEmoji){
        this.emoji = emoji;
        return this;
    }

    setDefault(selected: boolean){
        this.default = selected;
        return this;
    }
}