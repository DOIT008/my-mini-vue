import typescript from "@rollup/plugin-typescript" // 编译ts文件
import pkg from './package.json'
export default {
  input: './src/index.ts',
  output: [
    {
      format: 'cjs',// commonjs
      file:pkg.main
    },
    {
      format: 'esm',// esmoudule
      file:pkg.module
    },
  ],
  plugins: [
    typescript()
  ]
}