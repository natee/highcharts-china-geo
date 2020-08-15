import ajax from "./fetch";

export function getAdCode() {
  ajax("./infos.json").then(res => {
    console.log(res)
  })
}
