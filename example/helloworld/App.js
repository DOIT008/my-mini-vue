//.vue文件 <template></template>--->render函数
export const App = {
  render() { 
    return h('div','hello,'+this.msg)
  },
  setup() { 
    return {
      msg:'my-mini-vue'
    }
  }
}