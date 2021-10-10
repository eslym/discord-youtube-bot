import {Component, ComponentType} from "./Component";

export class ActionRow implements Component {
    readonly type: ComponentType.ACTION_ROW = ComponentType.ACTION_ROW;
    components: Component[];
    constructor(components?: Component[]) {
        this.components = Array.isArray(components) ? Array.from(components) : [];
    }

    push(component: Component, ...components: Component[]){
        this.components.push(component, ...components);
    }
}