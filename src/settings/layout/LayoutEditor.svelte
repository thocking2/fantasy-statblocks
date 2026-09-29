<script lang="ts">
    import {
        ButtonComponent,
        ExtraButtonComponent,
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

    const style = derived(store, (layout) => {
        return plugin.manager.getSheetRules(layout);
    });
</script>

{@html `<style>
        ${$style.join("\n")}
    </style>`}
    <div class="statblock-mobile">
        <div class="top">
            <div class="name" use:name />
            <div class="buttons">
                <div class="save" use:save />
            </div>
        </div>
        {#each SettingsSections as SECTION}
            <div class="mobile-section {SECTION.toLowerCase()}s">
                <h2 class="section-heading">{SECTION}</h2>
                {#if SECTION === "General"}
                    <Blocks />
                {:else if SECTION === "Appearance"}
                    <Appearance />
                {:else if SECTION === "Advanced"}
                    <Advanced />
                {:else if SECTION === "Previewer"}
                    <Previewer
                        {previewed}
                        on:update={(ev) => (previewed = ev.detail)}
                    />
                {/if}
            </div>
        {/each}
    </div>

<style scoped>
    .statblock-mobile {
        display: flex;
        flex-flow: column;
        gap: 0.25rem;
    }
    .section-heading {
        margin: var(--size-4-8) 0 var(--size-4-2);
        padding-bottom: var(--size-4-1);
        border-bottom: 1px solid var(--background-modifier-border);
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
