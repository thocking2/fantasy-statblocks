import {
    append,
    getMod,
    nanoid,
    slugify,
    slugifyLayoutForCss,
    stringify,
    stringifyWithKeys,
    toTitleCase,
    traitMapFrom,
    transformTraits
} from "./util";

describe("slugify", () => {
    it("returns an empty string for falsy input", () => {
        expect(slugify("")).toBe("");
    });
    it("lowercases and replaces whitespace with hyphens", () => {
        expect(slugify("Ancient Red Dragon")).toBe("ancient-red-dragon");
    });
    it("strips characters outside of word characters, spaces, - and _", () => {
        expect(slugify("Ogre (Variant)!")).toBe("ogre-variant");
    });
    it("collapses runs of whitespace into a single hyphen", () => {
        expect(slugify("Goblin   Boss")).toBe("goblin-boss");
    });
});

describe("slugifyLayoutForCss", () => {
    it("lowercases, replaces spaces with hyphens and dots with hyphens", () => {
        expect(slugifyLayoutForCss("5e.Statblock Layout")).toBe(
            "5e-statblock-layout"
        );
    });
    it("returns the fallback when layoutName is nullish", () => {
        expect(slugifyLayoutForCss(undefined as unknown as string, "default")).toBe(
            "default"
        );
    });
});

describe("toTitleCase", () => {
    it("capitalizes the first letter and lowercases the rest", () => {
        expect(toTitleCase("dRAGON")).toBe("Dragon");
    });
});

describe("nanoid", () => {
    it("generates an id matching the expected shape", () => {
        expect(nanoid()).toMatch(/^[0-9a-f]{12}$/);
    });
    it("generates unique ids across many calls", () => {
        const ids = new Set(Array.from({ length: 200 }, () => nanoid()));
        expect(ids.size).toBe(200);
    });
});

describe("getMod", () => {
    it("computes a positive modifier with a leading +", () => {
        expect(getMod(18)).toBe("+4");
    });
    it("computes a negative modifier with a leading -", () => {
        expect(getMod(6)).toBe("-2");
    });
    it("treats a score of 10 as a +0 modifier", () => {
        expect(getMod(10)).toBe("+0");
    });
    it("defaults to a score of 10 when given a nullish value", () => {
        expect(getMod(undefined as unknown as number)).toBe("+0");
    });
});

describe("traitMapFrom", () => {
    it("builds a map keyed by trait name", () => {
        const traits = [
            { name: "Keen Smell", desc: "a" },
            { name: "Pack Tactics", desc: "b" }
        ];
        const map = traitMapFrom(traits);
        expect(map.size).toBe(2);
        expect(map.get("Keen Smell")).toEqual(traits[0]);
    });
    it("returns an empty map when given no traits", () => {
        expect(traitMapFrom().size).toBe(0);
    });
});

describe("stringify", () => {
    it("returns strings and numbers unchanged", () => {
        expect(stringify("hello")).toBe("hello");
        expect(stringify(5)).toBe("5");
    });
    it("returns an empty string for null/undefined", () => {
        expect(stringify(null as unknown as string)).toBe("");
    });
    it("wraps arrays in parens joined by the joiner", () => {
        expect(stringify(["a", "b"])).toBe("(a b)");
    });
    it("omits parens when parens is false", () => {
        expect(stringify(["a", "b"], 0, " ", false)).toBe("a b");
    });
    it("stops recursing at depth 5", () => {
        expect(stringify(["a"], 5)).toBe("");
    });
});

describe("stringifyWithKeys", () => {
    it("interleaves object keys and values", () => {
        expect(stringifyWithKeys({ to: "hit", bonus: 5 })).toBe(
            "to hit bonus 5"
        );
    });
    it("returns an empty string for null/undefined/empty string", () => {
        expect(stringifyWithKeys(null as unknown as string)).toBe("");
        expect(stringifyWithKeys("")).toBe("");
    });
});

describe("transformTraits", () => {
    it("adds a new trait defined as a tuple", () => {
        const result = transformTraits([], [["Bite", "1d6 piercing damage"]]);
        expect(result).toEqual([
            { name: "Bite", desc: "1d6 piercing damage" }
        ]);
    });
    it("replaces an existing trait with the same name", () => {
        const existing = [{ name: "Bite", desc: "old" }];
        const result = transformTraits(existing, [
            { name: "Bite", desc: "new" }
        ]);
        expect(result).toEqual([{ name: "Bite", desc: "new" }]);
    });
    it("wraps a non-array monsterTraits argument in an array", () => {
        const result = transformTraits(
            { name: "Bite", desc: "old" } as any,
            []
        );
        expect(result).toEqual([{ name: "Bite", desc: "old" }]);
    });
});

describe("append", () => {
    it("concatenates two arrays", () => {
        expect(append(["a"], ["b"])).toEqual(["a", "b"]);
    });
    it("pushes a string onto an array", () => {
        expect(append(["a"], "b")).toEqual(["a", "b"]);
    });
    it("joins two strings with a space", () => {
        expect(append("a", "b")).toBe("a b");
    });
    it("returns toAppend unchanged when property is an unsupported type", () => {
        expect(append(5 as unknown as string, "b")).toBe("b");
    });
});
