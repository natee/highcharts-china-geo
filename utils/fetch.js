export default function ajax(url){
  return fetch(url)
    .then(res => res.json())
    .then(data => data)
}
