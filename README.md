# Highcharts-china-geo

Highchairs 中国地图和中国各省地图 geo 数据。

## 原始数据

`src/` 中是各省级地图的经纬度坐标geo数据，来自早期echarts。
`dist/` 为转换后的js文件，可直接使用。

### 全国地图
`src/china_geo.json` 对应完整的中国地图，每个省份的轮廓，用于按省级看数据，特殊处理成 `dist/china_geo.js`。

### 全国城市
`src/china_city_geo.json` 对应中国主要城市的经纬度坐标点，用于按市级看数据，由于只有一个点，所以只有在气泡地图上才能看到效果，特殊处理成 `dist/city-point.js`。

### 省份地图
显示每个省份的地图，支持查看一级城市和4个直辖市显示区，县级城市不支持。对应 `src/省_geo.json` => `dist/省_geo.js`
注：如果需要增加对更细粒度的县级城市支持，需要依据其经纬度，转化成图表坐标系中的坐标点，参照后面的方法。

## 转换方法

`transLatLonToCoordinate.js` 中调用了Highcharts的一个坐标转换函数把经纬度转成坐标点数值，这里直接把这个函数抽出来，该函数依赖于proj4.js这个库。

在执行转换之前，根据需要对代码进行修改：

1. 代码中 `f.properties['hz-code']` 这里的 `hz-code` 为自定义的关联字段，highcharts中 `joinBy` 使用的名称。

2. 国内经常有新增或合并某些区县（如天津的滨海新区、北京东城区和西城区等），这部分的数据暂时不做处理，可以自行增加后再处理。

### 执行

1. `npm install` 安装依赖包
2. `rm dist/*`
3. 修改代码中 `f.properties['hz-code']` 这里的 `hz-code` 字段名称为你自己需要的，highcharts中 `joinBy` 使用的名称
2. `node transLatLonToCoordinate.js`

## 示例

生成的js文件格式如下：
```javascript
Highcharts.maps["countries/cn/an_hui_geo"] = {
	// ...
}
```

例如，要使用一个`mapPrefix`的地图文件（这里是按需请求地图文件，如果是一次性加载，就不必走if逻辑）：
```javascript
var mapAreaData = Highcharts.maps['countries/cn/' + mapPrefix + '_geo'];
if (!mapAreaData) {
	// 如果没有加载地图数据，则去请求地理信息文件

    // helper.getMapMeta(mapPrefix + '_geo');

    mapAreaData = Highcharts.maps['countries/cn/' + mapPrefix + '_geo'];
}
```

Highcharts options配置如下：
```javascript
// 第一层作为底图，保持地名始终能够显示（需要两层的原因是便于控制数值的可见性）
// 放在同一层的话，虽然可以用css控制数值和地名居中对齐，但在导出图片时会失效，所以只能用两层来实现
series: [{  
    data: [],
    mapData: mapAreaData,
    joinBy: 'hz-code',
    mapData: mapAreaData,
    enableMouseTracking: false,
    dataLabels: {
        format: "{point.name}"
    }
},
{
    data: [],
    mapData: mapAreaData,
    joinBy: 'hz-code',
    name: 'name1'
}]
```