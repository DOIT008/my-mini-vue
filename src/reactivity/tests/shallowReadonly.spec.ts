import { describe, it, expect } from "vitest";
import { isReadonly,shallowReadonly } from "../reactive";
describe("shallowReadonly", () => {
  it('只有表层的数据是readonly', () => {
    const data = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(data)).toBe(true);
    expect(isReadonly(data.n)).toBe(false);
  })
})