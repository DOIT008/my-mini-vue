import { describe, it, expect } from 'vitest';
import { generate } from '../src/codegen';
import { baseParse } from '../src/parse';
import { transform } from '../src/transform';
describe("codegen", () => {
  it('string', () => { 
    // 拿到ast树
    const ast = baseParse('hi');
    transform(ast)
    const { code } = generate(ast);
    // 快照
    expect(code).toMatchSnapshot();
  })
})