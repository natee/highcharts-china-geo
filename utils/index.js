import ajax from "./fetch";

export function getAdCode() {
  ajax("../info/infos.json").then(res => {
    console.log(res)
  })
}
