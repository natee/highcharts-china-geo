/**
 * @description 把 geo.json 经纬度数据文件转化成 Highcharts Map 所需的坐标点
 * @author kerncink@gmail.com
 */

// geo = {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "properties": {
//         "adcode": 110102,
//         "name": "西城区",
//         "center": [116.366794, 39.915309],
//         "centroid": [116.365684, 39.912236],
//         "childrenNum": 0,
//         "level": "district",
//         "acroutes": [100000, 110000],
//         "parent": { "adcode": 110000 }
//       },
//       "geometry": {
//         "type": "MultiPolygon",
//         "coordinates": [[[[116.380912, 39.972719]]]]
//       }
//     }
//   ]
// }

//docs.google.com/presentation/d/1XgKaFEgPIzF2psVgY62-KnylV81gsjCWu999h4QtaOE/
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const chalk = require("chalk");
const proj4 = require(path.resolve(__dirname, "./proj4.js"));
const log = console.log;
const isArray = Array.isArray;

const args = process.argv.slice(2);
const sourceDir = path.resolve(__dirname, "../latlng");
const targetDir = path.resolve(__dirname, "../highmaps");

const infoPath = path.resolve(__dirname, "../info");
const chinaSplitSouth = path.resolve(__dirname, "../info/china.json");
const adCodeObj = require("./download").adCodeObj;

const transform = {
  crs: "+proj=lcc +lat_1=18 +lat_2=24 +lat_0=21 +lon_0=114 +x_0=500000 +y_0=500000 +ellps=WGS72 +towgs84=0,0,1.9,0,0,0.814,-0.38 +units=m +no_defs",
  scale: 0.000129831107685,
  jsonres: 15.5,
  jsonmarginX: -999,
  jsonmarginY: 9851,
  xoffset: -3139937.49309,
  yoffset: 4358972.7486,
};

const crs = {
  type: "name",
  properties: {
    name: "urn:ogc:def:crs:EPSG:3415",
  },
};

const joinBy = args[0] || "adcode";

log(chalk.bgMagenta("\njoinBy:", joinBy));

startTransfer();

function startTransfer() {
  let handleCount = 0;
  glob(`${targetDir}/*.js`, {}, function (err, files) {
    handleCount = files.length;
  });

  glob(`${sourceDir}/*.json`, {}, function (err, files) {
    log(
      chalk.black.bgCyan(
        `共需处理 ${files.length} 个文件，已处理 ${handleCount} 个文件`
      )
    );

    files.forEach((filePath, index) => {
      // if (index < 10) {
      const fileName = getFileName(filePath);
      transfer(fileName, filePath);
      // }
    });
  });

  handleSouthGeo();
}

// china.json 并非来自 dataV，所以需将其处理成和 latlng/*.json 格式一致
// 次函数会生成一个南海诸岛在右下角的中国地图 highmaps/china.js
function handleSouthGeo() {
  const rawStr = fs.readFileSync(chinaSplitSouth, "utf8");
  const geo = JSON.parse(rawStr);
  geo.features.forEach((f) => {
    f.properties = genProperties(f.properties.id);
  });

  const saveFile = `${infoPath}/china_geo.json`
  fs.writeFileSync(saveFile, JSON.stringify(geo), "utf8");

  transfer("china", saveFile, true);
}


function genProperties(id) {
  const adcode = id.length === 2 ? (id + "0000") : id;
  const region = adCodeObj[adcode];
  if (id === "") {
    return { 
      adcode: "", 
      name: "南海诸岛", 
      centroid: [135.3516, 22.9179],
      childrenNum: 0
    };
  }

  return {
    adcode: region.adcode,
    name: region.name,
    centroid: region.centroid,
    childrenNum: region.childrenNum,
    level: "province",
  };
}

/**
 * @param {string} path "highcharts-china-geo/latlng/100000_full.json"
 */
function getFileName(path) {
  // mathes = [
  //   "/100000_full.json",
  //   "100000_full",
  //   "_full",
  //   index: 27,
  // ]
  return path.match(/\/(\d*(_full)?).json$/)[1];
}

function transfer(fileName, filePath, force=false) {
  fs.exists(`${targetDir}/${fileName}.js`, (exists) => {
    if (force || !exists) {
      const rawStr = fs.readFileSync(filePath, "utf8");
      const geo = JSON.parse(rawStr);
      // Meta tag
      geo.UTF8Encoding = true;

      fs.writeFileSync(
        `${targetDir}/${fileName}.js`,
        addAMDWrapper(geo, fileName),
        "utf8"
      );

      log(chalk.green(`文件 ${fileName}.js 已写入`));
    }
  });
}

/**
 * Get point from latLon using specified transform definition
 * highcharts GeoJSON.js
 */
function transformFromLatLon(latLon, transform) {
  if (proj4 === undefined) {
    return {
      x: 0,
      y: null,
    };
  }

  const projected = proj4(transform.crs, [latLon.lon, latLon.lat]);
  const cosAngle =
    transform.cosAngle || (transform.rotation && Math.cos(transform.rotation));
  const sinAngle =
    transform.sinAngle || (transform.rotation && Math.sin(transform.rotation));
  const rotated = transform.rotation
    ? [
        projected[0] * cosAngle + projected[1] * sinAngle,
        -projected[0] * sinAngle + projected[1] * cosAngle,
      ]
    : projected;

  return {
    x:
      ((rotated[0] - (transform.xoffset || 0)) * (transform.scale || 1) +
        (transform.xpan || 0)) *
        (transform.jsonres || 1) +
      (transform.jsonmarginX || 0),
    y:
      (((transform.yoffset || 0) - rotated[1]) * (transform.scale || 1) +
        (transform.ypan || 0)) *
        (transform.jsonres || 1) -
      (transform.jsonmarginY || 0),
  };
}

/**
 * Get latLon from point using specified transform definition
 * highcharts GeoJSON.js
 */
function transformToLatLon (point, transform) {
  if (proj4 === undefined) {
      return;
  }
  const normalized = {
      x: ((point.x -
          (transform.jsonmarginX || 0)) / (transform.jsonres || 1) -
          (transform.xpan || 0)) / (transform.scale || 1) +
          (transform.xoffset || 0),
      y: ((-point.y - (transform.jsonmarginY || 0)) / (transform.jsonres || 1) +
          (transform.ypan || 0)) / (transform.scale || 1) +
          (transform.yoffset || 0)
  };
  const cosAngle = transform.cosAngle ||
      (transform.rotation && Math.cos(transform.rotation));
  const sinAngle = transform.sinAngle ||
      (transform.rotation && Math.sin(transform.rotation));
  // Note: Inverted sinAngle to reverse rotation direction
  const projected = proj4(transform.crs, 'WGS84', transform.rotation ? {
      x: normalized.x * cosAngle + normalized.y * -sinAngle,
      y: normalized.x * sinAngle + normalized.y * cosAngle
  } : normalized);
  return { lat: projected.y, lon: projected.x };
}

function traverse(coordinates) {
  coordinates.forEach(function (v, key) {
    if (isArray(v[0])) {
      traverse(v);
    } else {
      const positions = transformFromLatLon(
        { lon: v[0], lat: v[1] },
        transform
      );
      v[0] = Math.floor(positions.x);
      v[1] = Math.floor(-1 * positions.y); // * -1 否则图形是垂直翻转效果
    }
  });
}

function transferGeo(geo) {
  if (geo.features) {
    geo.features.forEach(function (f) {
      // 重心坐标
      const centroid = f.properties.centroid;
      // 行政区域代码
      const adcode = f.properties.adcode || ""; // 南海诸岛 adbcode=0
      if (centroid) {
        f.properties.longitude = centroid[0];
        f.properties.latitude = centroid[1];
      }

      if (adcode.length === 6) {
        f.properties[joinBy] = Number(adcode);
      }

      const coordinates = f.geometry.coordinates; // [[[经度，纬度],[lon，lat]],[]]

      traverse(coordinates);
    });
  }

  geo.crs = crs;
  geo["hc-transform"] = {
    default: transform,
  };
  return JSON.stringify(geo);
}

function addAMDWrapper(geo, fileName) {
  const result = transferGeo(geo);
  return ['Highcharts.maps["countries/cn/', fileName, '"] = ', result].join("");
}
