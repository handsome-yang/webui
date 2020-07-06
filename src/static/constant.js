//在线天地图服务影像(经纬度)
export const TDT_IMG_C="http://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
    "&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
    "&style=default&format=tiles&tk=9fc77db78dae6b888d27a04897db0883";
//在线天地图服务影像（球面墨卡托投影）
export const TDT_IMG_W="http://{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0" +
    "&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
    "&style=default&format=tiles&tk=9fc77db78dae6b888d27a04897db0883";
//在线天地图服务影像中文标记服务(经纬度)  WMTS：Web地图瓦片服务（Web Map Tile Service）
export const TDT_CIA_C="http://{s}.tianditu.gov.cn/cia_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
    "&LAYER=cia&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
    "&style=default&format=tiles&tk=9fc77db78dae6b888d27a04897db0883";
//在线天地图矢量地图服务(经纬度)
export const TDT_VEC_C="http://{s}.tianditu.gov.cn/vec_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
    "&LAYER=vec&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
    "&style=default&format=tiles&tk=9fc77db78dae6b888d27a04897db0883";
//在线天地图矢量中文标记服务(经纬度)
export const TDT_CVA_C="http://{s}.tianditu.gov.cn/cva_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
    "&LAYER=cva&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
    "&style=default&format=tiles&tk=9fc77db78dae6b888d27a04897db0883";

//在线天地图影像英文标记服务(经纬度)
export const TDT_EIA_C="http://{s}.tianditu.gov.cn/eia_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
    "&LAYER=cia&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
    "&style=default&format=tiles&tk=9fc77db78dae6b888d27a04897db0883";

//  高德地图
export const AMAP_webst="https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
// arcgis
export const ARCGIS='http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer';