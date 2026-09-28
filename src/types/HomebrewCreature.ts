// obsidian-overload@1.167.0 ships a broken "types" field (points at a
// missing index.d.ts, so TS falls back to type-checking its raw index.ts,
// which in turn pulls in other javalent packages whose own re-exports
// don't resolve outside their own repos). This local copy of the shape it
// declares lets us type-check without depending on that broken chain.
export interface HomebrewCreature {
    name?: string;
    display?: string;
    hp?: number;
    ac?: number | string;
    stats?: number[];
    source?: string | string[];
    cr?: number | string;
    modifier?: number | number[];
    note?: string;
    path?: string;
    level?: number;
    player?: boolean;
    marker?: string;
    id?: string;
    xp?: number;
    hidden?: boolean;
    friendly?: boolean;
    active?: boolean;
    static?: boolean;
    rollHP?: boolean;
    "statblock-link"?: string;
}
