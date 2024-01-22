import type { ChatComponent } from "../types/lib/java.js";

export function decodeChatComponent(component: ChatComponent | ChatComponent[] | string, cleanColorCode = false): string {
    let depth = 0;
    let text = decodeChatComponent0(component);
    if (cleanColorCode){
        text = text.replace(/§[klomnr0-9a-f]/gi, "");
    }
    return text;

    function decodeChatComponent0(component: ChatComponent | ChatComponent[] | string): string {
        depth += 1;

        let text = "";

        if (depth > 100){
            depth -= 1;
            return "";
        }

        if (typeof component === "string"){
            text = component;
            depth -= 1;
            return text;
        }

        if (Array.isArray(component)){
            text = component.map(decodeChatComponent0).join("");
            depth -= 1;
            return text;
        }
        
        let componentType;
        if (component.type != null){
            componentType = component.type;
        } else if (component.text != null){
            componentType = "text";
        } else if (component.translate != null){
            componentType = "translatable";
        }
    
        if (component.color != null){
            let code: string | number = "r";
            switch (component.color){
                case "black":
                    code = 0;
                case "dark_blue":
                    code = 1;
                case "dark_green":
                    code = 2;
                case "dark_aqua":
                    code = 3;
                case "dark_red":
                    code = 4;
                case "dark_purple":
                    code = 5;
                case "gold":
                    code = 6;
                case "gray":
                    code = 7;
                case "dark_gray":
                    code = 8;
                case "blue":
                    code = 9;
                case "green":
                    code = "a";
                case "aqua":
                    code = "b";
                case "red":
                    code = "c";
                case "light_purple":
                    code = "d";
                case "yellow":
                    code = "e";
                case "white":
                    code = "f";
            }
            text += "§" + code;
        }
    
        if (component.bold){
            text += "§l";
        }
        if (component.italic){
            text += "§o";
        }
        if (component.underlined){
            text += "§n";
        }
        if (component.strikethrough){
            text += "§m";
        }
        if (component.obfuscated){
            text += "§k";
        }
    
        if (componentType === "text"){
            text += component.text;
        } else if (componentType === "translatable"){
            if (component.fallback != null){
                text += component.fallback;
            } else {
                let withs: string[] = [];
                if (Array.isArray(component.with)){
                    withs = component.with.map(decodeChatComponent0);
                }
                let curIdx = 0;
                text += String(component.translate).replace(/%(?:(\d)\$)?s/g, (match, p1, offset, string, groups) => {
                    if (p1 != null){
                        return withs[Number(p1)-1] ?? match;
                    } else {
                        return withs[curIdx++] ?? match;
                    }
                });
            }
        }
        
        if (Array.isArray(component.extra)){
            text += decodeChatComponent0(component.extra);
        }
    
        depth -= 1;
        return text;
    }
}
/*
"black"
"dark_blue"
"dark_green"
"dark_aqua"
"dark_red"
"dark_purple"
"gold"
"gray"
"dark_gray"
"blue"
"green"
"aqua"
"red"
"light_purple"
"yellow"
"white"
"reset"
*/
/*
export type ChatComponent = {
    type?: "text" | "translatable" | "score" | "nbt" | "selector" | "keybind";

    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    color?: string;

    text: string;

    translate: string;
    with: ChatComponent[];

    extra?: ChatComponent[];
};
*/