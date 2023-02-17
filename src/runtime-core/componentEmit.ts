import { calmlize,toHandleKey } from "@/shared/index";

export function emit(instance,eventName,...args) { 
  // return 
  // console.log(eventName);
  const { props } = instance;
  console.log('emit',eventName);
  // TPP
  // 先写一个特定的行为==>再重构成通用行为
 const handleName = toHandleKey(calmlize(eventName))
  const handler = props[handleName];
  handler&&handler(...args)
}