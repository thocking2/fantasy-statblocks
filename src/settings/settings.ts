import {
    App,
    ButtonComponent,
    normalizePath,
    Notice,
    PluginSettingTab,
    SettingPage,
    setIcon,
    Setting,
    TFolder,
    type SettingDefinition,
    type SettingDefinitionItem,
    type SettingGroupItem
} from "obsidian";

import type StatBlockPlugin from "src/main";
import { mount, unmount } from "svelte";
import LayoutEditor from "./layout/LayoutEditor.svelte";

import { copy as fastCopy } from "fast-copy";

import { ExpectedValue } from "@javalent/dice-roller";
import { FolderInputSuggest } from "@javalent/utilities";
import type { Monster } from "index";
import { Bestiary } from "src/bestiary/bestiary";
import Importer from "src/importers/importer";
import { DefaultLayouts } from "src/layouts";
import { Layout5e } from "src/layouts/basic 5e/basic5e";
import type { DefaultLayout, Layout } from "src/layouts/layout.types";
import { DICE_ROLLER_SOURCE } from "src/main";
import FantasyStatblockModal from "src/modal/modal";
import { nanoid } from "src/util/util";
import { Watcher } from "src/watcher/watcher";
import Creatures from "./creatures/Creatures.svelte";
import { EditMonsterModal } from "./modal";

const IMPORTERS: {
    name: string;
    desc: string | DocumentFragment;
    input: string;
    accept: string;
    source: string;
    tooltip: string;
}[] = [
    {
        name: "Import DnDAppFile",
        desc: "Only import content that you own.",
        input: "dndappfile",
        accept: ".xml",
        source: "appfile",
        tooltip: "Import DnDAppFile Data"
    },
    {
        name: "Import Improved Initiative Data",
        desc: "Only import content that you own.",
        input: "improvedinitiative",
        accept: ".json",
        source: "improved",
        tooltip: "Import Improved Initiative Data"
    },
    {
        name: "Import CritterDB Data",
        desc: "Only import content that you own.",
        input: "critterdb",
        accept: ".json",
        source: "critter",
        tooltip: "Import CritterDB Data"
    },
    {
        name: "Import 5e.tools Data",
        desc: "Only import content that you own.",
        input: "fivetools",
        accept: ".json",
        source: "5e",
        tooltip: "Import 5e.tools Data"
    },
    {
        name: "Import TetraCube Data",
        desc: "Only import content that you own.",
        input: "tetra",
        accept: ".json, .monster",
        source: "tetra",
        tooltip: "Import TetraCube Data"
    },
    {
        name: "Import PF2eMonsterTools Data",
        desc: "Only import content that you own.",
        input: "PF2eMonsterTool",
        accept: ".json, .monster",
        source: "PF2eMonsterTool",
        tooltip: "Import PF2EMonsterTools Data"
    },
    {
        name: "Import Pathbuilder Data",
        desc: "Import a PC or NPC exported from Pathbuilder2e.",
        input: "pathbuilder",
        accept: ".json",
        source: "pathbuilder",
        tooltip: "Import Pathbuilder Data"
    },
    {
        name: "Import Generic Data",
        desc: createFragment((e) => {
            e.createSpan({
                text: "Import generic JSON files. JSON objects will be imported "
            });
            e.createEl("strong", { text: "as-is" });
            e.createSpan({ text: " and all objects must have the " });
            e.createEl("code", { text: "name" });
            e.createSpan({ text: " property." });
        }),
        input: "generic",
        accept: ".json, .monster",
        source: "generic",
        tooltip: "Import Generic Data"
    }
];

export default class StatblockSettingTab extends PluginSettingTab {
    importer: Importer;
    results: Partial<Monster>[] = [];
    filter!: Setting;
    $UI?: ReturnType<typeof mount>;
    constructor(
        app: App,
        public plugin: StatBlockPlugin
    ) {
        super(app, plugin);
        this.importer = new Importer(this.plugin);
        this.containerEl.addClass("statblock-settings");
    }

    /** Re-reads the declarative definitions and re-renders the tab. */
    refresh() {
        this.update();
    }

    /** Required by the base class; the tab is rendered from getSettingDefinitions(). */
    display(): void {}

    /**
     * Declarative definitions used by Obsidian's native, searchable settings
     * (1.13.0+). Simple values are declared as controls; anything that needs
     * custom UI is rendered imperatively into its own setting row.
     */
    getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                type: "group",
                heading: "General Settings",
                items: this.getGeneralDefinitions()
            },
            {
                type: "group",
                heading: "Note Parsing",
                items: this.getParseDefinitions()
            },
            {
                type: "group",
                heading: "Advanced Settings",
                items: this.getAdvancedDefinitions()
            },
            {
                type: "group",
                heading: "Layouts",
                items: this.getLayoutDefinitions()
            },
            {
                type: "group",
                heading: "Import Homebrew Creatures",
                items: this.getImportDefinitions()
            },
            {
                type: "page",
                name: "Bestiary",
                desc: "Add, browse, edit, and remove saved creatures.",
                displayValue: () =>
                    `${Bestiary.getBestiaryCreatures().length} creatures`,
                items: this.getBestiaryDefinitions()
            }
        ];
    }

    getGeneralDefinitions(): SettingDefinition[] {
        const diceDesc = (action: string, flag: string) =>
            createFragment((e) => {
                if (this.plugin.diceRollerInstalled) {
                    e.createSpan({ text: `${action} by default. Use ` });
                    e.createEl("code", { text: `${flag}: false` });
                    e.createSpan({ text: " to disable per-statblock." });
                } else {
                    e.createSpan({
                        text: "This setting is only usable with the Dice Roller plugin enabled."
                    });
                }
            });
        return [
            {
                name: "Integrate Dice Roller",
                desc: diceDesc("Add Dice Roller dice to statblocks", "dice"),
                control: {
                    type: "toggle",
                    key: "useDice",
                    disabled: () => !this.plugin.diceRollerInstalled
                }
            },
            {
                name: "Render Dice Rolls",
                desc: diceDesc(
                    "Roll graphical dice inside statblocks",
                    "render"
                ),
                control: {
                    type: "toggle",
                    key: "renderDice",
                    disabled: () => !this.plugin.diceRollerInstalled
                }
            },
            {
                name: "Try to Render Wikilinks",
                desc: createFragment((e) => {
                    e.createSpan({
                        text: "The plugin will attempt to detect wikilinks inside Statblocks."
                    });
                    e.createEl("br");
                    e.createEl("strong", {
                        text: "Please note: these links will not be added to the graph."
                    });
                }),
                control: { type: "toggle", key: "tryToRenderLinks" }
            },
            {
                name: "Enable 5e SRD",
                desc: "Use the Dungeons & Dragons 5th Edition System Reference Document monsters.",
                control: { type: "toggle", key: "enableSRD" }
            }
        ];
    }

    getParseDefinitions(): SettingDefinition[] {
        let path = "";
        return [
            {
                name: "Automatically Parse Frontmatter for Creatures",
                desc: createFragment((e) => {
                    e.createSpan({
                        text: "The plugin will watch the vault for creatures defined in note frontmatter."
                    });
                    e.createEl("br");
                    e.createEl("br");
                    e.createSpan({
                        text: `The "Parse Frontmatter for Creatures" command can also be used.`
                    });
                }),
                aliases: ["frontmatter", "watcher"],
                control: { type: "toggle", key: "autoParse" }
            },
            {
                name: "Enable Debug Messages",
                desc: "Debug messages will be displayed by the file parser.",
                control: { type: "toggle", key: "debug" }
            },
            {
                name: "Bestiary Folder",
                desc: "The plugin will only parse notes inside these folders and their children.",
                aliases: ["bestiary folder", "paths"],
                render: (setting) => {
                    setting
                        .addText((text) => {
                            const folders = this.app.vault
                                .getAllLoadedFiles()
                                .filter(
                                    (f) =>
                                        f instanceof TFolder &&
                                        !this.plugin.settings.paths.includes(
                                            f.path
                                        )
                                );
                            text.setPlaceholder("/");
                            new FolderInputSuggest(this.app, text, [
                                ...(folders as TFolder[])
                            ]).onSelect(async ({ item }) => {
                                path = normalizePath(item.path);
                                text.setValue(item.path);
                            });
                            text.inputEl.onblur = () => {
                                path = normalizePath(
                                    text.inputEl.value?.trim() || "/"
                                );
                            };
                        })
                        .addExtraButton((b) => {
                            b.setIcon("plus-with-circle").onClick(async () => {
                                if (!path?.length) return;
                                this.plugin.settings.paths.push(
                                    normalizePath(path)
                                );
                                await this.plugin.saveSettings();
                                await Watcher.reparseVault();
                                this.refresh();
                            });
                        });
                }
            },
            ...this.plugin.settings.paths.map(
                (folder): SettingDefinition => ({
                    name: folder,
                    searchable: false,
                    render: (setting) => {
                        setting.addExtraButton((b) =>
                            b.setIcon("trash").onClick(async () => {
                                this.plugin.settings.paths =
                                    this.plugin.settings.paths.filter(
                                        (p) => p != folder
                                    );
                                await this.plugin.saveSettings();
                                await Watcher.reparseVault();
                                this.refresh();
                            })
                        );
                    }
                })
            )
        ];
    }

    getAdvancedDefinitions(): SettingDefinition[] {
        return [
            {
                name: "Try to Save Data Atomically",
                desc: createFragment((e) => {
                    e.createSpan({
                        text: "This will cause to plugin to save data to a temporary file before saving the actual data file in an attempt to prevent data loss."
                    });
                    e.createEl("br");
                    e.createSpan({
                        text: "This can cause issues sometimes when using sync services."
                    });
                    e.createEl("br");
                    const warning = e.createDiv();
                    setIcon(warning.createDiv(), "warning");
                    warning.createSpan({
                        attr: {
                            style: "color: var(--text-error)"
                        },
                        text: "This setting is currently disabled."
                    });
                }),
                control: { type: "toggle", key: "atomicWrite" }
            }
        ];
    }

    getLayoutDefinitions(): SettingGroupItem[] {
        const layouts = this.plugin.manager.getAllLayouts();
        return [
            {
                name: "About Layouts",
                searchable: false,
                desc: createFragment((el) => {
                    el.createSpan({
                        text: "New statblock layouts can be created and managed here. A specific layout can be used for a creature using the "
                    });
                    el.createEl("code", { text: "layout" });
                    el.createSpan({ text: " parameter." });
                })
            },
            {
                name: "Import From JSON",
                desc: "Import a custom layout from a JSON file.",
                aliases: ["import layout"],
                render: (setting) => {
                    this.addFileButton(setting, {
                        input: "layout",
                        accept: ".json",
                        icon: "upload",
                        onFiles: async (files) => {
                            await this.importLayouts(files);
                            this.refresh();
                        }
                    });
                }
            },
            {
                type: "page",
                name: "Add New Layout",
                desc: "Create a new statblock layout.",
                page: () =>
                    new LayoutPage(this, {
                        layout: { name: "Layout", blocks: [], id: nanoid() },
                        onSave: async (l) => {
                            const dupe = this.getDuplicate(l);
                            this.plugin.settings.layouts.push(dupe);
                            this.plugin.manager.addLayout(dupe);
                            await this.plugin.saveSettings();
                        }
                    })
            },
            {
                name: "Default Layout",
                desc: "Change the default statblock layout used, if not specified.",
                control: {
                    type: "dropdown",
                    key: "default",
                    options: Object.fromEntries(
                        layouts.map(({ id, name }) => [id, name])
                    )
                }
            },
            {
                name: "Show Advanced Options",
                desc: "Show advanced options when editing layout blocks.",
                control: { type: "toggle", key: "showAdvanced" }
            },
            {
                name: "Restore Default Layouts",
                visible: () =>
                    this.plugin.manager
                        .getAllDefaultLayouts()
                        .some((f) => f.removed),
                render: (setting) => {
                    setting.addButton((b) => {
                        b.setIcon("rotate-ccw").onClick(async () => {
                            for (const layout of Object.values(
                                this.plugin.settings.defaultLayouts
                            )) {
                                layout.removed = false;
                                if (!layout.edited) {
                                    delete this.plugin.settings.defaultLayouts[
                                        layout.id
                                    ];
                                }
                            }
                            await this.plugin.saveSettings();
                            this.refresh();
                        });
                    });
                }
            },
            {
                type: "page",
                name: "Saved Layouts",
                desc: "Edit, copy, export, and delete saved layouts.",
                displayValue: () => `${this.getLayoutCount()} layouts`,
                items: this.getLayoutListDefinitions()
            }
        ];
    }

    private getLayoutCount() {
        return (
            this.plugin.manager
                .getAllDefaultLayouts()
                .filter((l) => !l.removed).length +
            this.plugin.settings.layouts.length
        );
    }

    getLayoutListDefinitions(): SettingGroupItem[] {
        const defs: SettingGroupItem[] = [];
        for (const layout of this.plugin.manager.getAllDefaultLayouts()) {
            if (layout.removed) continue;
            defs.push({
                type: "page",
                name: layout.name,
                page: () =>
                    new LayoutPage(this, {
                        layout,
                        onSave: async (l) => {
                            (l as DefaultLayout).edited = true;
                            this.plugin.settings.defaultLayouts[layout.id] = l;
                            await this.plugin.saveSettings();
                            this.plugin.manager.updateDefaultLayout(
                                layout.id,
                                l
                            );
                        },
                        onReset: layout.edited
                            ? async () => {
                                  const defLayout = DefaultLayouts.find(
                                      ({ id }) => id == layout.id
                                  )!;
                                  delete this.plugin.settings.defaultLayouts[
                                      layout.id
                                  ];
                                  await this.plugin.saveSettings();
                                  this.plugin.manager.updateDefaultLayout(
                                      layout.id,
                                      defLayout
                                  );
                              }
                            : undefined,
                        onDelete: async () => {
                            layout.removed = true;
                            this.plugin.settings.defaultLayouts[layout.id] =
                                layout;
                            await this.plugin.saveSettings();
                        }
                    })
            });
        }
        for (const layout of this.plugin.settings.layouts) {
            defs.push({
                type: "page",
                name: layout.name,
                page: () =>
                    new LayoutPage(this, {
                        layout,
                        onSave: async (l) => {
                            if (DefaultLayouts.find(({ id }) => id == layout.id)) {
                                (l as DefaultLayout).edited = true;
                            }
                            this.plugin.settings.layouts.splice(
                                this.plugin.settings.layouts.indexOf(layout),
                                1,
                                l
                            );
                            await this.plugin.saveSettings();
                            this.plugin.manager.updateLayout(layout.id, l);
                        },
                        onDelete: async () => {
                            this.plugin.settings.layouts =
                                this.plugin.settings.layouts.filter(
                                    (x) => x.id !== layout.id
                                );
                            await this.plugin.saveSettings();
                            this.plugin.manager.removeLayout(layout.id);
                        }
                    })
            });
        }
        return defs;
    }

    /** Saves a copy of `layout` next to the original. */
    async copyLayout(layout: Layout) {
        const dupe = this.getDuplicate(layout);
        this.plugin.settings.layouts.push(dupe);
        await this.plugin.saveSettings();
        this.plugin.manager.addLayout(dupe);
        this.refresh();
    }

    exportLayout(layout: Layout) {
        const link = createEl("a");
        const file = new Blob([JSON.stringify(layout)], { type: "json" });
        const url = URL.createObjectURL(file);
        link.href = url;
        link.download = `${layout.name}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    /** Adds a button to `setting` that opens a hidden multi-file input. */
    private addFileButton(
        setting: Setting,
        opts: {
            input: string;
            accept: string;
            onFiles: (files: FileList) => Promise<void>;
            icon?: string;
            text?: string;
            tooltip?: string;
        }
    ) {
        const input = createEl("input", {
            attr: {
                type: "file",
                name: opts.input,
                accept: opts.accept,
                multiple: true
            }
        });
        input.onchange = async () => {
            const { files } = input;
            if (!files?.length) return;
            try {
                await opts.onFiles(files);
            } catch (e) {
                console.error(e);
            }
            input.value = "";
        };
        setting.addButton((b) => {
            if (opts.icon) b.setIcon(opts.icon);
            if (opts.text) b.setButtonText(opts.text);
            if (opts.tooltip) b.setTooltip(opts.tooltip);
            b.buttonEl.addClass("statblock-file-upload");
            b.buttonEl.appendChild(input);
            b.onClick(() => input.click());
        });
    }

    private async importLayouts(files: FileList) {
        for (const file of Array.from(files)) {
            try {
                const layout: Layout = JSON.parse(await file.text());
                if (!layout) {
                    throw new Error("Invalid layout imported");
                }
                if (!layout.name) {
                    throw new Error(
                        "Invalid layout imported: layout does not have a name"
                    );
                }
                if (!layout.blocks) {
                    throw new Error(
                        "Invalid layout imported: no blocks defined in layout."
                    );
                }
                if (!layout.diceParsing) {
                    layout.diceParsing = [];
                }
                layout.id = nanoid();

                if (
                    !this.plugin.settings.alwaysImport &&
                    layout.blocks.find((b) => b.type == "javascript") &&
                    !(await confirm(this.plugin))
                ) {
                    continue;
                }
                this.plugin.settings.layouts.push(this.getDuplicate(layout));
            } catch (e) {
                new Notice(`There was an error importing the layout: \n\n${e}`);
                console.error(e);
            }
        }
        await this.plugin.saveSettings();
    }

    getImportDefinitions(): SettingDefinition[] {
        return [
            {
                name: "About Importing",
                searchable: false,
                desc: "Import creatures from creature files. Monsters are stored by name, so only the last creature by that name will be saved. This is destructive - any saved creature will be overwritten."
            },
            ...IMPORTERS.map(
                (importer): SettingDefinition => ({
                    name: importer.name,
                    desc: importer.desc,
                    aliases: ["import"],
                    render: (setting) => {
                        this.addFileButton(setting, {
                            input: importer.input,
                            accept: importer.accept,
                            text: "Choose File(s)",
                            tooltip: importer.tooltip,
                            onFiles: async (files) => {
                                const monsters = await this.importer.import(
                                    files,
                                    importer.source as never
                                );
                                if (monsters && monsters.length) {
                                    await this.plugin.saveMonsters(monsters);
                                }
                                this.refresh();
                            }
                        });
                    }
                })
            )
        ];
    }

    getBestiaryDefinitions(): SettingDefinition[] {
        return [
            {
                name: "Add Creature",
                aliases: ["new creature"],
                render: (setting) => {
                    setting.addButton((b) => {
                        b.setIcon("plus-with-circle").onClick(() => {
                            const modal = new EditMonsterModal(this.plugin);
                            modal.onClose = () => this.refresh();
                            modal.open();
                        });
                    });
                }
            },
            {
                name: "Saved Creatures",
                desc: "Browse, edit, and remove saved creatures.",
                aliases: ["monsters", "creatures", "bestiary"],
                render: (setting) => {
                    setting.settingEl.addClass("statblock-creatures-setting");
                    const ancestor =
                        setting.settingEl.closest(".statblock-settings") ??
                        this.containerEl;
                    const { backgroundColor, paddingTop } =
                        getComputedStyle(ancestor);
                    this.$UI = mount(Creatures, {
                        target: setting.settingEl,
                        props: {
                            plugin: this.plugin,
                            backgroundColor,
                            paddingTop
                        }
                    });
                    return () => {
                        if (this.$UI) unmount(this.$UI);
                        this.$UI = undefined;
                    };
                }
            }
        ];
    }

    getControlValue(key: string): unknown {
        const settings = this.plugin.settings;
        if (key === "enableSRD") return !settings.disableSRD;
        if (key === "default") {
            const layouts = this.plugin.manager.getAllLayouts();
            return layouts.some(({ id }) => id == settings.default)
                ? settings.default
                : Layout5e.id;
        }
        return (settings as unknown as Record<string, unknown>)[key];
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        const settings = this.plugin.settings;
        switch (key) {
            case "enableSRD":
                settings.disableSRD = !value;
                await this.plugin.saveSettings();
                this.plugin.app.workspace.trigger(
                    "fantasy-statblocks:srd-change",
                    value
                );
                return;
            case "renderDice":
                settings.renderDice = value as boolean;
                if (this.plugin.diceRollerInstalled) {
                    window.DiceRoller.registerSource(DICE_ROLLER_SOURCE, {
                        shouldRender: settings.renderDice,
                        showFormula: false,
                        showParens: false,
                        expectedValue: ExpectedValue.Average
                    });
                }
                break;
            case "autoParse":
                settings.autoParse = value as boolean;
                if (value) Watcher.start();
                break;
            case "debug":
                settings.debug = value as boolean;
                Watcher.setDebug();
                break;
            case "default":
                settings.default = value as string;
                this.plugin.manager.setDefaultLayout(value as string);
                break;
            default:
                (settings as unknown as Record<string, unknown>)[key] = value;
        }
        await this.plugin.saveSettings();
    }

    getDuplicate(layout: Layout): Layout {
        if (
            !this.plugin.manager
                .getAllLayouts()
                .find((l) => l.name == layout.name)
        )
            return layout;
        const names = this.plugin.manager
            .getSortedLayoutNames()
            .filter((name) => name.contains(`${layout.name} Copy`));

        let temp = `${layout.name} Copy`;

        let name = temp;
        let index = 1;
        while (names.includes(name)) {
            name = `${temp} (${index})`;
            index++;
        }
        return {
            blocks: fastCopy(layout.blocks),
            name,
            id: nanoid()
        };
    }
    override hide() {
        if (this.$UI) unmount(this.$UI);
        this.$UI = undefined;
    }
}

interface LayoutPageOptions {
    layout: Layout;
    onSave: (layout: Layout) => Promise<void>;
    onDelete?: () => Promise<void>;
    onReset?: () => Promise<void>;
}

/** Sub-page of the settings tab that edits a single layout. */
class LayoutPage extends SettingPage {
    private editor?: ReturnType<typeof mount>;
    private layout: Layout;
    constructor(
        private tab: StatblockSettingTab,
        private opts: LayoutPageOptions
    ) {
        super();
        this.layout = fastCopy(opts.layout);
        this.title = opts.layout.name;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass("statblock-layout-page");

        const actions = containerEl.createDiv("statblock-layout-actions");
        const button = (icon: string, tip: string, cb: () => unknown) =>
            new ButtonComponent(actions)
                .setIcon(icon)
                .setTooltip(tip)
                .onClick(async () => {
                    await cb();
                    this.tab.refresh();
                });
        button("duplicate-glyph", "Create Copy", () =>
            this.tab.copyLayout(this.opts.layout)
        );
        button("import-glyph", "Export as JSON", () =>
            this.tab.exportLayout(this.opts.layout)
        );
        if (this.opts.onReset) {
            button("undo", "Reset to default", this.opts.onReset);
        }
        if (this.opts.onDelete) {
            button("trash", "Delete", this.opts.onDelete);
        }

        this.editor = mount(LayoutEditor, {
            target: containerEl.createDiv(),
            props: { layout: this.layout, plugin: this.tab.plugin },
            events: {
                saved: async () => {
                    await this.opts.onSave(this.layout);
                    new Notice(`Saved layout "${this.layout.name}".`);
                    this.tab.refresh();
                }
            }
        });
    }

    hide() {
        if (this.editor) unmount(this.editor);
        this.editor = undefined;
        super.hide();
    }
}

class ConfirmModal extends FantasyStatblockModal {
    saved: boolean = false;
    constructor(
        public filtered: number,
        plugin: StatBlockPlugin
    ) {
        super(plugin);
    }
    onOpen() {
        this.titleEl.setText("Are you sure?");
        this.contentEl.createEl("p", {
            text: `This will delete ${this.filtered} creatures. This cannot be undone.`
        });
        new Setting(this.contentEl)
            .setClass("no-border-top")
            .addButton((b) => {
                b.setIcon("checkmark")
                    .setCta()
                    .onClick(() => {
                        this.saved = true;
                        this.close();
                    });
            })
            .addExtraButton((b) =>
                b.setIcon("cross").onClick(() => {
                    this.close();
                })
            );
    }
}
async function confirm(plugin: StatBlockPlugin): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const modal = new ConfirmImport(plugin);
            modal.onClose = () => {
                resolve(modal.confirmed);
            };
            modal.open();
        } catch (e) {
            reject();
        }
    });
}
class ConfirmImport extends FantasyStatblockModal {
    confirmed: boolean = false;
    constructor(public plugin: StatBlockPlugin) {
        super(plugin);
    }
    async display() {
        this.contentEl.empty();
        this.contentEl.addClass("confirm-modal");
        this.contentEl.createEl("p", {
            text: "This Layout includes JavaScript blocks. JavaScript blocks can execute code in your vault, which could cause loss or corruption of data."
        });
        this.contentEl.createEl("p", {
            text: "Are you sure you want to import this layout?"
        });

        const buttonContainerEl = this.contentEl.createDiv(
            "confirm-buttons-container"
        );
        buttonContainerEl.createEl("a").createEl("small", {
            cls: "dont-ask",
            text: "Import and don't ask again"
        }).onclick = async () => {
            this.confirmed = true;
            this.plugin.settings.alwaysImport = true;
            this.close();
        };

        const buttonEl = buttonContainerEl.createDiv("confirm-buttons");
        new ButtonComponent(buttonEl)
            .setButtonText("Import")
            .setCta()
            .onClick(() => {
                this.confirmed = true;
                this.close();
            });
        buttonEl.createEl("a").createEl("small", {
            cls: "dont-ask",
            text: "Cancel"
        }).onclick = () => {
            this.close();
        };
    }
    onOpen() {
        this.display();
    }
}
