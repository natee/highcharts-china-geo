export function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    document.body.appendChild(script);
    script.onload = resolve;
    script.onerror = reject;
    script.async = true;
    script.src = url;
  });
}

export function fetchJson(url) {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => data);
}

// 认为行政区域代码最后两位不是00的表示县级市，无子区域
export function hasChildRegion(code) {
  return code.toString().endsWith("00");
}

export async function mockData(adcode) {
  adcode = adcode === "china" ? "100000" : adcode;
  adcode = adcode === "hainan" ? "460000" : adcode;
  const data = await fetchJson("../info/infos.json");
  const region = data[adcode];
  if (region.children.length === 0) {
    return [{
      adcode: region.adcode,
      name: region.name,
      value: Math.round(Math.random() * 1000),
    }];
  }
  return region.children.map((r) => {
    return {
      adcode: r.adcode,
      name: r.name,
      value: Math.round(Math.random() * 1000),
    };
  });
}
