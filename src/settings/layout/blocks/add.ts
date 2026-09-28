import type StatBlockPlugin from "src/main";
import { Menu } from "obsidian";
import {
    type StatblockItemMap,
    type StatblockItem,
    TypeNames
} from "src/layouts/layout.types";
import { nanoid } from "src/util/util";

export function blockGenerator<T extends keyof StatblockItemMap>(
    type: T
): StatblockItemMap[T];
export function blockGenerator(type: string): StatblockItem {
    switch (type) {
        case "inline":
        case "group": {
            return {
                type: type,
                id: nanoid(),
                properties: [],
                nested: []
            };
        }
        case "heading": {
            return {
                type: "heading",
                id: nanoid(),
                properties: [],
                size: 1
            };
        }
        case "property": {
            return {
                type: "property",
                id: nanoid(),
                properties: []
            };
        }
        case "saves": {
            return {
                type: "saves",
                id: nanoid(),
                properties: []
            };
        }
        case "traits": {
            return {
                type: "traits",
                id: nanoid(),
                properties: []
            };
        }
        case "spells": {
            return {
                type: "spells",
                id: nanoid(),
                properties: []
            };
        }
        case "subheading": {
            return {
                type: "subheading",
                id: nanoid(),
                properties: []
            };
        }
        case "image": {
            return {
                type: "image",
                id: nanoid(),
                properties: []
            };
        }
        case "table": {
            return {
                type: "table",
                id: nanoid(),
                properties: [],
                headers: [],
                calculate: true
            };
        }
        case "text": {
            return {
                type: "text",
                id: nanoid(),
                properties: [],
                text: ""
            };
        }
        case "ifelse": {
            return {
                type: "ifelse",
                id: nanoid(),
                conditions: []
            };
        }
        case "collapse": {
            return {
                type: "collapse",
                id: nanoid(),
                heading: undefined,
                hasRule: false,
                conditioned: false,
                nested: [blockGenerator("group")],
                open: false
            };
        }
        case "javascript": {
            return {
                type: "javascript",
                id: nanoid(),
                conditioned: false,
                code: ""
            };
        }
        case "layout": {
            return {
                type: "layout",
                id: nanoid(),
                layout: ""
            };
        }
        case "action": {
            return {
                type: "action",
                id: nanoid(),
                icon: "clapperboard"
            };
        }
        default:
            throw new Error(`Unknown block type: ${type}`);
    }
}

export const generate = async (
    evt: MouseEvent
): Promise<StatblockItem | void> => {
    return new Promise((resolve, reject) => {
        const addMenu = new Menu().setNoIcon();
        let gen: StatblockItem;
        TypeNames.forEach((type) => {
            const [blockType, title] = type;
            if (blockType === null) {
                addMenu.addSeparator();
                return;
            }
            addMenu.addItem((item) => {
                item.setTitle(title).onClick(() => {
                    gen = blockGenerator(blockType);
                    addMenu.unload();
                });
            });
        });
        addMenu.register(() => {
            resolve(gen);
        });

        addMenu.showAtMouseEvent(evt);
    });
};
