import { describe, it, expect } from 'vitest';
import { generate } from '../src/codegen';
import { baseParse } from '../src/parse';
import { transform } from '../src/transform';
import { transformElement } from '../src/transforms/transformElement';
import { transformExpression } from '../src/transforms/transformExpression';
import { transformText } from '../src/transforms/transformText';
describe("codegen", () => {
  // 字符串
  it('string', () => { 
    // 拿到ast树
    const ast = baseParse('hi');
    transform(ast)
    const { code } = generate(ast);
    // 快照
    expect(code).toMatchSnapshot();
  })
// 插值
  it('interpolation', () => { 
    const ast = baseParse('{{message}}');
    transform(ast, {
      nodeTransforms:[transformExpression]
    })
    const { code } = generate(ast);
    // 快照
    expect(code).toMatchSnapshot();
  })
  // 测试element
  it('element', () => { 
    const ast:any = baseParse('<div>hi,{{message}}</div>');
    transform(ast, {
      nodeTransforms: [transformExpression,transformElement,transformText]
    });
    const { code } = generate(ast);
    // 快照
    expect(code).toMatchSnapshot();
  })
})