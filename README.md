# highcharts-china-geo

highchairs中国地图和中国各省地图geo数据。

## 原始数据

`province/geoJson`中是各省级地图的经纬度坐标geo数据，来自echarts。

## 转换方法

`transLatLonToCoordinate.js`把调用了Highcharts的一个坐标转换函数把经纬度转成坐标点数值，须修改后才可以使用。

### 修改
1. 代码中有`$(".chart").highcharts()`，这是为了拿到highcharts实例然后进行转化，所以必须是有一个highcharts图表
2. 代码中`f.properties['hz-code']`这里的`hz-code`为自定义的关联字段，highcharts中`joinBy`使用的名称。

### 执行
`node transLatLonToCoordinate.js`

## Highcharts-china-geo数据

`geodata.js`中包含了所有省级geo数据、全国geo数据、和全国主要城市geo坐标点数据（气泡地图有用）。