# highcharts-china-geo

highchairs中国地图和中国各省地图geo数据。

## 原始数据

`src/`中是各省级地图的经纬度坐标geo数据，来自echarts。
`dist/`为转换后的js文件，可直接使用。

**说明**
1. `src/china_geo.json`对应完整的中国地图，每个省份的轮廓，用于按省级看数据，特殊处理成`dist/china_geo.js`。
2. `src/china_city_geo.json`对应中国主要城市的经纬度坐标点，用于按市级看数据，由于只有一个点，所以只有在气泡地图上才能看到效果，特殊处理成`dist/city-point.js`。

## 转换方法

`transLatLonToCoordinate.js`把调用了Highcharts的一个坐标转换函数把经纬度转成坐标点数值，须修改后才可以使用。

### 修改
1. 代码中`f.properties['hz-code']`这里的`hz-code`为自定义的关联字段，highcharts中`joinBy`使用的名称。

### 执行
`node transLatLonToCoordinate.js`

## Highcharts-china-geo数据

`geodata.js`中包含了所有省级geo数据、全国geo数据、和全国主要城市geo坐标点数据（气泡地图有用）。