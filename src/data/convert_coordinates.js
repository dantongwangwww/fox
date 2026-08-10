import fs from 'fs';
import path from 'path';

// 读取原始数据
const inputPath = './src/data/response.json';
const outputPath = './src/data/response_converted.json';

const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// 经纬度转 Web Mercator 投影坐标
function latLngToWebMercator(lat, lng) {
  const R = 6378137;
  const x = R * lng * Math.PI / 180;
  const y = R * Math.log(Math.tan((90 + lat) * Math.PI / 360));
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

// 转换坐标
function convertCoordinates(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return geometry;
  }

  switch (geometry.type) {
    case 'Point':
      const [lng, lat] = geometry.coordinates;
      return latLngToWebMercator(lat, lng);
    
    case 'LineString':
      return geometry.coordinates.map(([lng, lat]) => latLngToWebMercator(lat, lng));
    
    case 'Polygon':
      return geometry.coordinates.map(ring => 
        ring.map(([lng, lat]) => latLngToWebMercator(lat, lng))
      );
    
    case 'MultiPoint':
      return geometry.coordinates.map(([lng, lat]) => latLngToWebMercator(lat, lng));
    
    case 'MultiLineString':
      return geometry.coordinates.map(line => 
        line.map(([lng, lat]) => latLngToWebMercator(lat, lng))
      );
    
    case 'MultiPolygon':
      return geometry.coordinates.map(polygon => 
        polygon.map(ring => 
          ring.map(([lng, lat]) => latLngToWebMercator(lat, lng))
        )
      );
    
    default:
      return geometry;
  }
}

// 处理数据
const convertedData = {
  StatusCode: rawData.StatusCode,
  Data: rawData.Data.map(item => {
    if (item.Geom) {
      try {
        const geom = JSON.parse(item.Geom);
        const convertedGeom = convertCoordinates(geom);
        return {
          ...item,
          Geom: JSON.stringify(convertedGeom)
        };
      } catch (e) {
        console.error('Error parsing Geom for item', item.Id, ':', e);
        return item;
      }
    }
    return item;
  })
};

// 保存转换后的数据
fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));
console.log('坐标转换完成，结果保存到', outputPath);
