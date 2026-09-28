import { LinkStringifier } from "./stringifier";

describe("LinkStringifier.transformSource / stringifyLinks", () => {
    it("round-trips a wikilink", () => {
        const source = "See [[Ancient Red Dragon]] for details.";
        const transformed = LinkStringifier.transformSource(source);
        expect(transformed).not.toContain("[[");
        expect(LinkStringifier.stringifyLinks(transformed)).toBe(source);
    });

    it("round-trips a markdown link with an alias", () => {
        const source = "See [the dragon](Ancient%20Red%20Dragon) for details.";
        const transformed = LinkStringifier.transformSource(source);
        expect(transformed).not.toContain("](");
        expect(LinkStringifier.stringifyLinks(transformed)).toBe(source);
    });

    it("round-trips a markdown link without an alias", () => {
        const source = "See [](Ancient%20Red%20Dragon) for details.";
        const transformed = LinkStringifier.transformSource(source);
        expect(LinkStringifier.stringifyLinks(transformed)).toBe(source);
    });

    it("leaves plain text without links untouched", () => {
        const source = "No links here.";
        expect(LinkStringifier.transformSource(source)).toBe(source);
    });
});

describe("LinkStringifier.isStatblockLink", () => {
    it("detects a transformed wikilink", () => {
        const transformed = LinkStringifier.replaceWikiLink("Goblin");
        expect(LinkStringifier.isStatblockLink(transformed)).toBe(true);
    });
    it("detects a transformed markdown link", () => {
        const transformed = LinkStringifier.replaceMarkdownLink(
            "goblin",
            "Goblin"
        );
        expect(LinkStringifier.isStatblockLink(transformed)).toBe(true);
    });
    it("returns false for untransformed text", () => {
        expect(LinkStringifier.isStatblockLink("[[Goblin]]")).toBe(false);
    });
});
