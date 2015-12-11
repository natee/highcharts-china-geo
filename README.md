# highcharts-china-geo

highchairs中国地图和中国各省地图geo数据。

## 原始数据

`province/geoJson`中是各省级地图的经纬度坐标geo数据，来自charts。

## 转换方法

`transLatLonToCoordinate.js`把调用了Highcharts的一个坐标转换函数把经纬度转成坐标点数值。这个文件不经过修改是无法直接使用的。

## Highcharts-china-geo数据

`geodata.js`中包含了所有省级geo数据、全国geo数据、和全国主要城市geo坐标点数据（气泡地图有用）。