<script lang="ts">
    import type { CSSPropertyGroup } from "src/layouts/layout.css";
    import Property from "./Property.svelte";

    export let group: CSSPropertyGroup;
</script>

<div class="setting-group">
    <div class="setting-item setting-item-heading">
        <div class="setting-item-info">
            <div class="setting-item-name">{group.name}</div>
            {#if group.desc}
                <div class="setting-item-description">{group.desc}</div>
            {/if}
        </div>
    </div>
    <div class="setting-items">
        {#each group.properties as property}
            <Property {property} />
        {/each}
    </div>
</div>
