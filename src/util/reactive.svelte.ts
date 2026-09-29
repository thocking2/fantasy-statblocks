/**
 * Wraps a props object in Svelte 5 deep reactive state so that assigning to
 * its properties after `mount()` updates the mounted component.
 */
export function reactiveProps<T extends Record<string, unknown>>(props: T): T {
    const state = $state(props);
    return state;
}
