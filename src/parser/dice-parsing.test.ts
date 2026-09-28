import { getDiceParsingDefaults, parseForDice } from "./dice-parsing";
import type { Layout } from "src/layouts/layout.types";
import type { Monster } from "index";

describe("getDiceParsingDefaults", () => {
    it("returns three default dice-parsing entries with unique ids", () => {
        const defaults = getDiceParsingDefaults();
        expect(defaults).toHaveLength(3);
        const ids = new Set(defaults.map((entry) => entry.id));
        expect(ids.size).toBe(3);
        expect(defaults.map((entry) => entry.desc)).toEqual([
            "+10 to hit",
            "4 (1d6 + 1)",
            "+5"
        ]);
    });
});

describe("parseForDice", () => {
    const monster = {} as Monster;

    it("leaves text untouched when nothing matches", () => {
        const layout = { diceParsing: getDiceParsingDefaults() } as Layout;
        expect(parseForDice(layout, "Nothing to see here.", monster)).toEqual(
            ["Nothing to see here."]
        );
    });

    it("uses the default dice parsing rules when the layout defines none", () => {
        const layout = {} as Layout;
        const result = parseForDice(layout, "Melee Attack +7 to hit", monster);
        expect(result).toEqual([
            "Melee Attack ",
            { text: "1d20+7", original: "+7 to hit" },
            ""
        ]);
    });

    it("applies a custom dice-parsing rule defined on the layout", () => {
        const layout = {
            diceParsing: [
                {
                    id: "custom-hp",
                    regex: /(\d+) HP/.source,
                    desc: "custom",
                    parser: `let [, num] = matches; return { text: 'HP:' + num, original };`
                }
            ]
        } as unknown as Layout;

        const result = parseForDice(
            layout,
            "The creature has 15 HP and moves fast.",
            monster
        );

        expect(result).toEqual([
            "The creature has ",
            { text: "HP:15", original: "15 HP" },
            " and moves fast."
        ]);
    });

    it("falls back to the original text when the parser throws", () => {
        const consoleError = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const layout = {
            diceParsing: [
                {
                    id: "throws",
                    regex: /(\d+) HP/.source,
                    desc: "custom",
                    parser: `throw new Error("boom");`
                }
            ]
        } as unknown as Layout;

        const result = parseForDice(layout, "15 HP", monster);
        expect(result).toEqual(["", "15 HP", ""]);
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
