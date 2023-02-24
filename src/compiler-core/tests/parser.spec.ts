import { describe, it, expect } from "vitest";
import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
describe("parser", () => {
  // 插值
  describe("interpolation", () => {
    it("simple interpolation", () => {
      const ast = baseParse("{{message}}");
      expect(ast.children[0]).toStrictEqual({
        type:NodeTypes.INTERPOLATION,
        content: {
          type:NodeTypes.SIMPLE_EXPRESSION,
          content:'message'
        }
      });
    });
  });
});
