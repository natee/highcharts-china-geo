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

const sourceDir = path.resolve(__dirname, "../latlng");
const targetDir = path.resolve(__dirname, "../highmaps");
const log = console.log;
const isArray = obj => Object.prototype.toString.call(obj) === "[object Array]";

const transform = {
  crs:
    "+proj=lcc +lat_1=18 +lat_2=24 +lat_0=21 +lon_0=114 +x_0=500000 +y_0=500000 +ellps=WGS72 +towgs84=0,0,1.9,0,0,0.814,-0.38 +units=m +no_defs",
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

startTransfer();

function startTransfer() {
  let handleCount = 0
  glob(`${targetDir}/*.js`, {}, function (err, files) {
    handleCount = files.length
  });

  glob(`${sourceDir}/*.json`, {}, function (err, files) {
    log(chalk.black.bgCyan(`共需处理 ${files.length} 个文件，已处理 ${handleCount} 个文件`))

    files.forEach((filePath, index) => {
      // if (index < 10) {
        const fileName = getFileName(filePath);
        transfer(fileName, filePath);
      // }
    });
  });
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

function transfer(fileName, filePath){
  fs.exists(`${targetDir}/${fileName}.js`, (exists) => {
    if (!exists) {
      const rawStr = fs.readFileSync(filePath, "utf8");
      const geo = JSON.parse(rawStr);
      // Meta tag
      geo.UTF8Encoding = true;

      fs.writeFileSync(
        `${targetDir}/${fileName}.js`,
        addAMDWrapper(geo, fileName),
        "utf8"
      );

      log(chalk.green(`文件 ${fileName}.js 已写入`))
    }
  })
}

/**
 * Get point from latLon using specified transform definition
 */
function transformFromLatLon (latLon, transform) {
  if (proj4 === undefined) {
    // error(21);
    return {
      x: 0,
      y: null,
    };
  }

  const projected = proj4(transform.crs, [latLon.lon, latLon.lat]);
  const cosAngle = transform.cosAngle || (transform.rotation && Math.cos(transform.rotation));
  const sinAngle = transform.sinAngle || (transform.rotation && Math.sin(transform.rotation));
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
  }
}

function traverse (coordinates) {
  coordinates.forEach(function (v, key) {
    if (isArray(v[0])) {
      traverse(v);
    } else {
      const positions = transformFromLatLon({ lon: v[0], lat: v[1] }, transform);
      v[0] = Math.floor(positions.x);
      v[1] = Math.floor(-1 * positions.y);
    }
  });
};

function transferGeo(geo) {
  
  if (geo.features) {
    geo.features.forEach(function (f) {
      // 重心坐标
      const centroid = f.properties.centroid;
      // 行政区域代码
      const adcode = f.properties.adcode;
      if (centroid) {
        f.properties.longitude = centroid[0];
        f.properties.latitude = centroid[1];
      }
      
      if (adcode.length === 6) {
        f.properties["hz-code"] = Number(adcode);
      }

      const coordinates = f.geometry.coordinates; // [[[经度，纬度],[经度，纬度]],[]]
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
