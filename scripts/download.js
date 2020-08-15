const fs = require("fs");
const path = require("path");
const glob = require("glob");
const request = require("request");
const chalk = require('chalk');
// const promisify = require("./promisify");

// const readFileAsync = promisify(fs.readFile);

const destDir = path.resolve(__dirname, "../latlng");
const adCodePath = path.resolve(__dirname, "../utils/infos.json");
const log = console.log;

/**
 * 完整 url: datavDomain + "100000_full.json"
 * ${code}.json 轮廓经纬度
 * ${code}_full.json 带子区域的经纬度
 *    - 有子区域才有该文件，比如，北京_full.json
 *    - 无子区域的行政区只有 code.json 文件，如：有[东城区.json]，但没有[东城区_full.json]
 */
const datavDomain = "https://geo.datav.aliyun.com/areas_v2/bound/";

const raw = fs.readFileSync(adCodePath, "utf8");
const adCodeObj = JSON.parse(raw)
const allCodes = Object.keys(adCodeObj);

downloadGeo()

function downloadGeo(){

  glob(`${destDir}/*.json`, {}, function (err, files) {
    log(chalk.black.bgCyan(`共需下载 ${allCodes.length} 个文件，已下载 ${files.length} 个文件`))
  })

  allCodes.forEach((code, index) => {
    // if(index < 10){
    const hasChildren = adCodeObj[code].children.length > 0;
    download(code, hasChildren);
    // }
  })
}

function download(code, isFull) {
  const fileName = `${code}${isFull ? '_full' : ''}.json`
  const output = `${destDir}/${fileName}`;

  // 文件不存在才下载
  fs.exists(output, (exists) => {
    if (!exists) {
      request(`${datavDomain}${fileName}`, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          fs.writeFileSync(output, body, "utf8");
          log(chalk.green(`文件 ${fileName} 下载完成`))
        } else {
          log(chalk.red(`文件 ${fileName} 下载错误：${error}`))
        }
      });
    }else {
      // log(chalk.yellow(`文件 ${fileName} 已存在`))
    }
  });
}
