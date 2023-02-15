import typescript from "@rollup/plugin-typescript" // 编译ts文件
export default {
  input: 'src/index.ts',
  output: [
    {
      format: 'cjs',// commonjs
      file:'lib/my-mini-vue.cjs.js'
    },
    {
      format: 'es',// commonjs
      file:'lib/my-mini-vue.esm.js'
    },
  ],
  plugins: [
    typescript()
  ]
}