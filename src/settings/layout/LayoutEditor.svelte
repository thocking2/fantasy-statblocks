<script lang="ts">
    import {
        ButtonComponent,
        ExtraButtonComponent,
        setIcon,
        TextComponent
    } from "obsidian";

    import type StatBlockPlugin from "src/main";
    import { createEventDispatcher } from "svelte";

    import Blocks from "./blocks/Blocks.svelte";
    import { derived, writable } from "svelte/store";
    import type { Layout } from "src/layouts/layout.types";
    import Advanced from "./advanced/Advanced.svelte";
    import { setContext } from "./context";
    import Appearance from "./appearance/Appearance.svelte";
    import Previewer from "./previewer/Previewer.svelte";

    export let layout: Layout;
    export let plugin: StatBlockPlugin;
    const store = writable<Layout>(layout);
    setContext("plugin", plugin);
    setContext("layout", store);
    let previewed = "";

    const SettingsSections = [
        "General",
        "Appearance",
        "Advanced",
        "Previewer"
    ] as const;

    let editingName = false;
    const name = (node: HTMLElement) => {
        node.empty();
        if (editingName) {
            let temp = $store.name;
            new TextComponent(node).setValue(temp).onChange((v) => {
                temp = v;
            });
            const buttons = node.createDiv("buttons");
            new ExtraButtonComponent(buttons)
                .setIcon("checkmark")
                .setTooltip("Save")
                .onClick(() => {
                    editingName = false;
                    $store.name = temp;
                    name(node);
                });
            new ExtraButtonComponent(buttons)
                .setIcon("cross-in-box")
                .setTooltip("Cancel")
                .onClick(() => {
                    editingName = false;
                    name(node);
                });
        } else {
            node.createEl("h5", { text: $store.name });
            new ExtraButtonComponent(node.createDiv("buttons"))
                .setIcon("pencil")
                .setTooltip("Edit Name")
                .onClick(() => {
                    editingName = true;
                    name(node);
                });
        }
    };

    const dispatch = createEventDispatcher();
    const save = (node: HTMLDivElement) => {
        new ButtonComponent(node)
            .setIcon("checkmark")
            .setCta()
            .setTooltip("Save")
            .onClick(() => {
                dispatch("saved");
            });
    };

    /** Mobile: null shows the section list, otherwise the selected submenu. */
    let mobileSection: (typeof SettingsSections)[number] | null = null;
    const back = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon("chevron-left")
            .setTooltip("Back")
            .onClick(() => {
                mobileSection = null;
            });
    };
    const chevron = (node: HTMLElement) => {
        setIcon(node, "chevron-right");
    };

    const style = derived(store, (layout) => {
        return plugin.manager.getSheetRules(layout);
    });
</script>

{@html `<style>
        ${$style.join("\n")}
    </style>`}
    <div class="statblock-mobile">
        {#if mobileSection === null}
            <div class="top">
                <div class="name" use:name />
                <div class="buttons">
                    <div class="save" use:save />
                </div>
            </div>
            <div class="mobile-menu">
                {#each SettingsSections as SECTION}
                    <div
                        class="mobile-menu-item"
                        on:click={() => (mobileSection = SECTION)}
                    >
                        <span>{SECTION}</span>
                        <span class="chevron" use:chevron />
                    </div>
                {/each}
            </div>
        {:else}
            <div class="top">
                <div class="name">
                    <div class="back" use:back />
                    <h5>{mobileSection}</h5>
                </div>
                <div class="buttons">
                    <div class="save" use:save />
                </div>
            </div>
            <div class="mobile-section {mobileSection.toLowerCase()}s">
                {#if mobileSection === "General"}
                    <Blocks />
                {:else if mobileSection === "Appearance"}
                    <Appearance />
                {:else if mobileSection === "Advanced"}
                    <Advanced />
                {:else if mobileSection === "Previewer"}
                    <Previewer
                        {previewed}
                        on:update={(ev) => (previewed = ev.detail)}
                    />
                {/if}
            </div>
        {/if}
    </div>

<style scoped>
    .statblock-mobile {
        display: flex;
        flex-flow: column;
        gap: 0.25rem;
    }
    .mobile-menu {
        display: flex;
        flex-flow: column;
    }
    .mobile-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--size-4-3) var(--size-4-4);
        border-bottom: 1px solid var(--background-modifier-border);
        cursor: pointer;
    }
    .mobile-section.previewers {
        min-height: 60vh;
    }
    .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.25rem;
    }
    .buttons {
        display: flex;
        align-items: center;
    }
    .name {
        display: flex;
        /* justify-content: space-between; */
        align-items: center;
    }
    .name :global(.buttons) {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }
</style>
