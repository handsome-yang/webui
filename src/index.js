import $ from "jquery";
import 'jquery-ui/themes/base/draggable.css';
import 'jquery-ui/themes/base/resizable.css';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/resizable';
import bootstrap from "bootstrap";
import moment from 'moment';
import 'daterangepicker'

moment.locale('zh-cn');
import 'bootstrap-input-spinner'
import coordtransform from "coordtransform";
import dayjs from "dayjs";
import axios from "axios";
import * as constant from "./static/constant.js";
//highcharts
import Highcharts from 'highcharts/highstock';
// import the module
import Highcharts3D from 'highcharts/highcharts-3d';
import * as Variablepie from "highcharts/modules/variable-pie";
import * as HichartsMore from 'highcharts/highcharts-more';
import * as signalR from "@aspnet/signalr";

// initialize the module
HichartsMore(Highcharts);
Variablepie(Highcharts);
Highcharts3D(Highcharts);

import echarts from 'echarts';
import 'echarts-gl';

import PolylneTrailMaterialProperty from "./static/js/PolylineTrailMaterialProperty";
import CircleWaveMaterialProperty from "./static/js/CircleWaveMaterialProperty";

import './scss/index.scss';


//测试使用
const isDebug = false;

let token = window.sessionStorage.getItem("token");
if (isDebug) {
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiYWRtaW4iLCJuYmYiOjE1ODU5NzA5MjIsImV4cCI6MTU4ODU2MjkyMiwiaXNzIjoieGlhb21hZ3VvanUiLCJhdWQiOiJ4aWFvbWFndW9qdUNsaWVudCJ9.6jF5oZ48xoniNOBWjHYfIQ_qjvdS85WsRU3ZbwZ8Jio"
}
if (!token) {
    window.location.href = '/login.html';
}
axios.defaults.headers.common['Authorization'] = "Bearer " + token; // 设置请求头为 Authorization
axios.defaults.timeout = 90000;


window.isLoad4k = true;
if (window.innerWidth <= 1920) {
    window.isLoad4k = false;
}

console.log(window.innerWidth + ':' + window.isLoad4k);

window.addEventListener('load', function () {
    console.debug(window.innerWidth);
    //首次加载，获取屏幕宽度
    if (window.innerWidth <= 1920) {
        window.isLoad4k = false;
    }
    console.debug(window.isLoad4k);
    window.addEventListener('resize', function () {
        console.debug(window.innerWidth);
        if (window.innerWidth <= 1920) {
            window.isLoad4k = false;
            return;
        }
        console.debug(window.isLoad4k);
    })
});

window.MapColors=[
    Cesium.Color.YELLOW.withAlpha(0.5),
    Cesium.Color.BURLYWOOD.withAlpha(0.5),
    Cesium.Color.CADETBLUE.withAlpha(0.5),
    Cesium.Color.CORNFLOWERBLUE.withAlpha(0.5),
    Cesium.Color.DARKKHAKI.withAlpha(0.5),
    Cesium.Color.DARKSALMON.withAlpha(0.5),
    Cesium.Color.DARKVIOLET.withAlpha(0.5),
    Cesium.Color.FORESTGREEN.withAlpha(0.5),
    Cesium.Color.GOLDENROD.withAlpha(0.5),
    Cesium.Color.INDIANRED.withAlpha(0.5)
];

window.LogisticsTurnMapColors=[
    Cesium.Color.INDIANRED.withAlpha(0.8),
    Cesium.Color.DARKKHAKI.withAlpha(0.8),
    Cesium.Color.DARKSALMON.withAlpha(0.8),
    Cesium.Color.CADETBLUE.withAlpha(0.8),
    Cesium.Color.BURLYWOOD.withAlpha(0.8),
    Cesium.Color.CORNFLOWERBLUE.withAlpha(0.8),
    Cesium.Color.DARKVIOLET.withAlpha(0.8),
    Cesium.Color.YELLOW.withAlpha(0.8),
    Cesium.Color.FORESTGREEN.withAlpha(0.8),
    Cesium.Color.GOLDENROD.withAlpha(0.8),
];

//轨迹追踪对象
let trajectoryTracking = {
    picked: null,
    tipsCartesian2: null
};

window.AMapGeocoder = new AMap.Geocoder({radius: 1000});//范围，默认：500
//物流地图-运输路线
window.logisticsRoute = null;
//玉溪市中心点
window.yuxiEntity_gcj02 = null;
window.yuxiEntity_wgs84 = null;
//物流地图-物流联盟
window.logisticsCompany = {};
//运力地图-轨迹分段查询对象
window.segmentTrack = {};
//运力地图-上一个轨迹线跟踪id
window.prevTrackPolyLineId = null;

let cesiumContainer = document.querySelector("#transportCesiumContainer");

const img_c_LayerProvider = new Cesium.WebMapTileServiceImageryProvider({
    url: constant.TDT_IMG_C,
    layer: 'constant.TDT_IMG_C',
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'c',
    credit: new Cesium.Credit('天地图影像服务'),
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    maximumLevel: 16,
    tilingScheme: new Cesium.GeographicTilingScheme(),
    tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
});

//默认是gcj02
window.coordinateType = {
    gcj02: "gcj02",
    wgs84: "wgs84",
    seleced: "gcj02",
};

window.menu = {
    transport: "transport",
    logistics: "logistics",
    financial: "financial",
    seleced: "transport"
};

window.primitives = [];

// 禁用浏览器右键菜单
(function(){
    if (window.Event)
        document.captureEvents(Event.MOUSEUP);
    function nocontextmenu() {
        event.cancelBubble = true
        event.returnvalue = false;
        return false;
    }
    function norightclick(e) {
        if (window.Event) {
            if (e.which == 2 || e.which == 3)
                return false;
        } else if (event.button == 2 || event.button == 3) {
            event.cancelBubble = true
            event.returnvalue = false;
            return false;
        }
    }
    document.oncontextmenu = nocontextmenu;  // for IE5+
    document.onmousedown = norightclick;  //
}());

$(document).ready(function () {
    //页面Dom
    let transportDom = $(".transport");
    let logisticsDom = $(".logistics");
    let financialDom = $(".financial");
    let headerDom = $('.header');

    /**
     * 菜单交互
     */
    transportDom.show();
    transportDom.parent('li').siblings().children('a').removeClass('active');
    logisticsDom.hide();
    financialDom.hide();
    $("#transport").addClass('active');

    // window.menu.seleced = window.menu.logistics;
    // transportDom.hide();
    // logisticsDom.show();
    // logisticsDom.parent('li').siblings().children('a').removeClass('active');
    // financialDom.hide();
    // $("#logistics").addClass('active');

    // transportDom.hide();
    // logisticsDom.hide();
    // financialDom.show();
    // financialDom.parent('li').siblings().children('a').removeClass('active');
    // $("#financial").addClass('active');

    headerDom.find('a').on('click', function () {
        if ($(this).attr('id') === "transport") {
            window.menu.seleced = window.menu.transport;
            transportDom.show();
            logisticsDom.hide();
            financialDom.hide();
            $(this).addClass('active');
            $(this).parent('li').siblings().children('a').removeClass('active');
            headerDom.find("li").removeClass('active');
            loadTransport();
            $("#switchImageryProvider1").siblings("button").removeClass("active").end().addClass("active");
            $("#switchImageryProvider1").click();
        } else if ($(this).attr('id') === "logistics") {
            window.menu.seleced = window.menu.logistics;
            transportDom.hide();
            logisticsDom.hide();
            financialDom.hide();
            $(this).addClass('active');
            $(this).parent('li').siblings().children('a').removeClass('active');
            headerDom.find("li").removeClass('active');
            $(this).siblings("ul").children('li').eq(0).addClass("active");
            if (window.coordinateType.seleced !== window.coordinateType.gcj02) {
                $.xmMapViewer.imageryLayers.removeAll();
                $.xmMapViewer.imageryLayers.addImageryProvider(img_c_LayerProvider);
                $.xmMapViewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
                    url: constant.ARCGIS
                }));
                window.coordinateType.seleced = window.coordinateType.gcj02;
            }
            loadLogistics();
            $("#logisticsSwitchImageryProvider1").siblings("button").removeClass("active").end().addClass("active");
        } else if ($(this).attr('id') === "financial") {
            window.menu.seleced = window.menu.financial;
            transportDom.hide();
            logisticsDom.hide();
            financialDom.show();
            $(this).addClass('active');
            $(this).parent('li').siblings().children('a').removeClass('active');
            headerDom.find("li").removeClass('active');
            if (window.coordinateType.seleced !== window.coordinateType.gcj02) {
                $.xmMapViewer.imageryLayers.removeAll();
                $.xmMapViewer.imageryLayers.addImageryProvider(img_c_LayerProvider);
                $.xmMapViewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
                    url: constant.ARCGIS
                }));
                window.coordinateType.seleced = window.coordinateType.gcj02;
            }
            loadFinancial();
        }
    });

    firstBindEvent();
    firstLoadMap();
});

/**
 * 首次加载地图
 */
function firstLoadMap() {
    // // home定位到中国范围
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(80, 22, 130, 50);
    $.xmMapViewer = new Cesium.Viewer('transportCesiumContainer', {
        shouldAnimate: true,
        geocoder: false,
        baseLayerPicker: false,
        sceneModePicker: false,// 是否显示3D2D选择器
        navigationHelpButton: false,// 是否显示右上角的帮助按钮
        homeButton: false,  // 是否显示Home按钮
        infoBox: false,      // 是否显示信息框
        timeline: false,
        animation: false,
        fullscreenButton: false,
        //关闭地球光环
        skyAtmosphere: false,
        imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
            url: constant.ARCGIS
        }),
    });
    //去掉版权
    $.xmMapViewer.cesiumWidget.creditContainer.style.display = "none";
    //性能监控
    $.xmMapViewer.scene.debugShowFramesPerSecond = true;
    //问题所在：双击entity，会放大视图，entity居中显示，且鼠标左键失去移动功能，鼠标滚轮失去作用
    $.xmMapViewer.screenSpaceEventHandler.setInputAction(function () {
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    //绑定左键事件标注点
    $.xmMapViewer.screenSpaceEventHandler.setInputAction((e) => {
        let pick = $.xmMapViewer.scene.pick(e.position);
        if (Cesium.defined(pick)) {
            let entity = Cesium.defaultValue(pick.id, pick.primitive.id);
            let primitive = Cesium.defaultValue(pick.instanceId, pick.primitive.instanceId);
            if (entity instanceof Cesium.Entity) {
                //选中某模型pick选中的对象
                let func = window.ViewerClickFactory[entity.clickType];
                if (func === undefined) return;
                func(e, pick, entity);
            }else if (primitive){
                //选中某模型pick选中的对象
                let func = window.ViewerClickFactory[pick.clickType];
                if (func === undefined) return;
                func(e, pick, pick.element);
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //绑定右键事件标注点
    $.xmMapViewer.screenSpaceEventHandler.setInputAction((e) => {
        if (window.menu.seleced === window.menu.logistics) {
            //todo:绑定右键事件标注点
            logisticsLoadRightMenu(e);
            window.logisticsRightCoordinate = pickToCoordinate(e.position);
        }else if(window.menu.seleced === window.menu.transport){
            transportLoadRightMenu(e);
            window.transportRightCoordinate = pickToCoordinate(e.position);
        }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // $.xmMapViewer.screenSpaceEventHandler.setInputAction(function(movement) {
    //     let cartesian =  $.xmMapViewer.camera.pickEllipsoid(movement.endPosition,  $.xmMapViewer.scene.globe.ellipsoid);
    //     if (cartesian) {
    //         let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    //         let longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
    //         let latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
    //         console.log(
    //             'Lon: ' + ('   ' + longitudeString).slice(-7) + '\u00B0' +
    //             '\nLat: ' + ('   ' + latitudeString).slice(-7) + '\u00B0');
    //     }
    // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    $.xmMapViewer.scene.postRender.addEventListener((e) => {
        if (trajectoryTracking.picked == null) return;
        if (!trajectoryTracking.picked.id) return;
        if (trajectoryTracking.picked.id.clickType) {
            let func = window.ViewerPostRenderHandler[trajectoryTracking.picked.id.clickType];
            if (func === undefined) return;
            func(e);
        }
    });
    $.xmMapViewer.screenSpaceEventHandler.setInputAction(function (event) {
        var height = $.xmMapViewer.camera.positionCartographic.height;
        if (height <= 12000) {
            if (window.menu.transport == window.menu.seleced) {
                for (var i = 0; i < $.xmMapViewer.entities.values.length; i++) {
                    var entity = $.xmMapViewer.entities.values[i];
                    if (entity.label) {
                        entity.label.show = true;
                    }
                    if (entity.billboard) {
                        let imageUrl = '';
                        if (window.isLoad4k) {
                            // console.log('(height<=12000 && window.isLoad4k==true),1.加载@2x 图片;2.entity.label.show=true;');
                            // console.log(entity.billboard.image);
                            imageUrl = entity.billboard.image._value.replace("@mini", "@2x").replace("@1x", "@2x");
                        } else {
                            // console.log('(height<=12000 && window.isLoad4k==false),1.加载默认 图片;2.entity.label.show=true;');
                            // console.log(entity.billboard.image);
                            imageUrl = entity.billboard.image._value.replace("@mini", "@1x").replace("@2x", "@1x");
                        }
                        entity.billboard.image = imageUrl;
                    }
                }
            }
        } else if (height > 12000) {
            if (window.menu.transport == window.menu.seleced) {
                for (var i = 0; i < $.xmMapViewer.entities.values.length; i++) {
                    var entity = $.xmMapViewer.entities.values[i];
                    if (entity.label) {
                        entity.label.show = false;
                    }
                    if (entity.billboard) {
                        let imageUrl = '';
                        if (window.isLoad4k) {
                            // console.log('(height>12000 && window.isLoad4k==true),1.加载默认 图片;2.entity.label.show=false;');
                            // console.log(entity.billboard.image);
                            imageUrl = entity.billboard.image._value.replace("@mini", "@1x").replace("@2x", "@1x");
                        } else {
                            // console.log('(height>12000 && window.isLoad4k==false),1.加载@mini 图片;2.entity.label.show=false;');
                            // console.log(entity.billboard.image);
                            imageUrl = entity.billboard.image._value.replace("@1x", "@mini").replace("@2x", "@mini");
                        }
                        entity.billboard.image = imageUrl;
                    }
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.WHEEL);


    //玉溪市102.4972,24.3728(gcj02)
    //let wgs84togcj02 = coordtransform.wgs84togcj02(102.4972, 24.3728);
    //gcj02 102.518814,24.368926
    //wgs84 102.51748835569124,24.371924330040848
    let ellipsoid = $.xmMapViewer.scene.globe.ellipsoid;
    window.yuxiEntity_gcj02 = new Cesium.Entity({
        id: '玉溪市红塔区_gcj02',
        //position :Cesium.Cartesian3.fromDegrees(102.518814,24.368926, 3000),
        position: Cesium.Cartesian3.fromDegrees(102.53, 24.37, 2580),
        show: true,
        point: {
            pixelSize: 1,
            color: Cesium.Color.WHITE.withAlpha(0.1),
            outlineWidth: 10
        }
    });
    window.yuxiEntity_wgs84 = new Cesium.Entity({
        id: '玉溪市红塔区_wgs84',
        //position : Cesium.Cartesian3.fromDegrees(102.51748835569124,24.371924330040848, 3000),
        position: Cesium.Cartesian3.fromDegrees(102.53, 24.37, 2580),
        show: true,
        point: {
            pixelSize: 1,
            color: Cesium.Color.WHITE.withAlpha(0.1),
            outlineWidth: 10
        }
    });
    if (isDebug) {
        //加载运力地图数据
        logisticsInitRoute();
        // loadTransport();
        //云南省行政区域
        initYunNanArea();
        //initLogisticsCompany();
        //initFinancialCustomerService();
    } else {
        let i = Date.now();
        function rotate() {
            let a = .1;
            let t = Date.now();
            let n = (t - i) / 1e3;
            i = t;
            $.xmMapViewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -a * n);
        }
        $.xmMapViewer.clock.onTick.addEventListener(rotate);
        setTimeout(function () {
            //旋转跳跃
            $.xmMapViewer.clock.onTick.removeEventListener(rotate);
            //首次加载运力地图
            loadTransport();
        }, 3000);
    }
    window.HuoFaDaLou = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles.guojutech.net/HuoFaDaLou/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.HuoFaDaLou);

    window.DongFengGuangChang = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles.guojutech.net/DongFengGuangChang/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.DongFengGuangChang);

    window.DongFengShuiKu = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles.guojutech.net/DongFengShuiKu/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.DongFengShuiKu);

    window.HuoCheNanZhan = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles.guojutech.net/HuoCheNanZhan/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.HuoCheNanZhan);

    window.LanXiRuiYuan = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles1.guojutech.net/LanXiRuiYuan/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.LanXiRuiYuan);

    window.NieErGuangChang = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles1.guojutech.net/NieErGuangChang/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.NieErGuangChang);

    window.ShuiNiChang = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles1.guojutech.net/ShuiNiChang/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.ShuiNiChang);

    window.TuZhaChang = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles1.guojutech.net/TuZhaChang/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.TuZhaChang);

    window.WuLiuYuan = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles2.guojutech.net/WuLiuYuan/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.WuLiuYuan);

    window.XianFuGangTieChang = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles2.guojutech.net/XianFuGangTieChang/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.XianFuGangTieChang);

    window.YuKunGangTieChang = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles2.guojutech.net/YuKunGangTieChang/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.YuKunGangTieChang);

    window.YuXiGaoTieZhan = new Cesium.Cesium3DTileset({
        url: 'http://3dtiles2.guojutech.net/YuXiGaoTieZhan/tileset.json'
    });
    $.xmMapViewer.scene.primitives.add(window.YuXiGaoTieZhan);
    updatePrimitives();
}

/**
 * 首次绑定事件
 */
function firstBindEvent() {
    //运力地图-事件绑定
    transportBindEvent();
    //物流地图-事件绑定
    logisticsBindEvent();
    $(".tips").find('button.close').on('click', function () {
        $(this).parent('div').css('display', 'none');
    })
}

/**
 * 加载中心点并飞到该点上面
 */
function loadCenterPointAndFlyTo() {
    if (!$.xmMapViewer.entities.contains(window.yuxiEntity_gcj02)) {
        $.xmMapViewer.entities.add(window.yuxiEntity_gcj02);
    }
    if (!$.xmMapViewer.entities.contains(window.yuxiEntity_wgs84)) {
        $.xmMapViewer.entities.add(window.yuxiEntity_wgs84);
    }
    window.yuxiEntity_gcj02.show = true;
    window.yuxiEntity_wgs84.show = true;
    if (window.coordinateType.seleced === window.coordinateType.gcj02) {
        $.xmMapViewer.flyTo(window.yuxiEntity_gcj02, {
            duration: 1.0,  //持续时间
            heading: Cesium.Math.toRadians(0),
            range: 100,//距离中心的距离（以米为单位)
        }).then(() => {
            window.yuxiEntity_gcj02.show = false;
            window.yuxiEntity_wgs84.show = false;
        });
    } else {
        $.xmMapViewer.flyTo(window.yuxiEntity_wgs84, {
            duration: 1.0,  //持续时间
            heading: Cesium.Math.toRadians(0),
            range: 100,//距离中心的距离（以米为单位)
        }).then(() => {
            window.yuxiEntity_gcj02.show = false;
            window.yuxiEntity_wgs84.show = false;
        });
    }
}

/**
 * 加载运力地图
 */
function loadTransport() {
    dispose();
    axios.post(window.BASE_URL + '/JT808WebApi/Vehicle/GetCarCount').then((response) => {
        if (response.data) {
            $("#transportCarCount").text(response.data+410);
        }
    }).catch((error) => {
        console.error(error);
    });
    transportInitChart();
    // 初始化车辆报警表
    axios.post(
        window.BASE_URL + '/JT808WebApi/Alarm/QueryAlarmTop1ToMap'
    ).then((response) => {
        if (response.data) {
            window.transportCarAlarmMap = response.data;
            let tbodyStr = '';
            for (let prop in window.transportCarAlarmMap) {
                let item = window.transportCarAlarmMap[prop];
                let trStr = "<tr car-alarm-row=" + item.id + ">";
                trStr += "<td>" + item.vno + "</td>";
                trStr += "<td>" + dayjs.unix(item.gps_time).format('HH:mm:ss') + "</td>";
                trStr += "<td>" + transportAlarmTypeNameFormatter(item.alarm_type_name) + "</td>";
                trStr += "<td>" + transportAlarmTypeAddressFormatter(item.address) + "</td>";
                trStr + "</tr>";
                tbodyStr += trStr;
            }
            console.time("alarm-tbody");
            $("#tableWarning>tbody").html(tbodyStr);
            console.timeEnd("alarm-tbody");
        }
    }).catch((error) => {
        console.error(error);
    });
    //初始化车辆列表表格
    axios.post(
        window.BASE_URL + '/JT808WebApi/Vehicle/GetCarLocationToMap', {"vno": ""}
    ).then((response) => {
        if (response.data) {
            window.transportCarLocationMap = response.data;
            //运力地图-车辆状态表初始化
            transportInitVehicleTable();
        }
        loadCenterPointAndFlyTo();
    }).catch((error) => {
        console.error(error);
    });
    //萤石云accessToken
    axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/GetToken').then((response) => {
        if (response.data) {
            window.YSYAccessToken = response.data;
        }
    }).catch((error) => {
        console.error(error);
    });
    //云南省行政区域
    initYunNanArea();
    loadCenterPointAndFlyTo();
    transportInitWebSocket();
    //定时语音播报报警信息
    transportTimer();
}

/**
 * 加载物流地图
 */
function loadLogistics() {
    dispose();
    //云南省行政区域
    initYunNanArea();
    logisticsInitCompany();
}

/**
 * 加载金融地图
 */
function loadFinancial() {
    dispose();
    initFinancialChart();
    initFinancialCustomerService();
}

/**
 * 释放资源
 */
function dispose() {
    $("#audioDetail").css({display: "none"});
    $("#vehicleDetialTips").hide();
    $("#vehicleTrackTips").hide();
    $("#companyTips").hide();
    $("#routeTips").hide();
    $("#logisticsCompany").siblings("button").removeClass("active").end().addClass("active");
    $.xmMapViewer.entities.removeAll();
    $.xmMapViewer.dataSources.removeAll();
    $.xmMapViewer.vehicleTrackedEntity = undefined;
    $.xmMapViewer.trackedEntity = undefined;
    window.transportCarLocationMap = null;
    window.transportCarAlarmMap = null;
    window.logisticsCompany = {};
    $("#logisticsShowAllGasStation").prop("checked",false);
    if(window.logistics_route_gas_station_poi_collection){
        $.xmMapViewer.scene.primitives.remove(window.logistics_route_gas_station_poi_collection);
        window.logistics_route_gas_station_poi_collection=null;
    }
}

/********************************************************************************************************/
/*******************************************地图事件开始**************************************************/
/********************************************************************************************************/

//地图实体事件工厂
window.ViewerClickFactory = {
    "transport": function (e, pick, id) {
        //运力地图-车辆详情tips监听
        //选中某模型pick选中的对象
        $("#vehicleDetialTips").css({
            display: "block",
            top: e.position.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
            left: e.position.x + 'px'
        });
        $.xmMapViewer.trackedEntity = undefined;
        let carInfo = window.transportCarLocationMap[id.id];
        //临时加入视频直播
        if(carInfo.car_videos){
            $("#audioDetail").css({display: "inline-block"});
            $("#audioDetail").data("vno", carInfo.vno);
            $("#audioDetail").data("sim", carInfo.terminal_sim);
        }else{
            $("#audioDetail").css({display: "none"});
        }
        // 移动炫酷
        if (window.prevTrackPolyLineId == null) {
            window.prevTrackPolyLineId = id.id + "_polyline";
        } else {
            $.xmMapViewer.entities.removeById(window.prevTrackPolyLineId);
            window.prevTrackPolyLineId = id.id + "_polyline";
        }
        if (window.coordinateType.seleced === window.coordinateType.gcj02) {
            $.xmMapViewer.entities.add({
                id: window.prevTrackPolyLineId,
                gcj02_position: Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 0),
                wgs84_position: Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 0),
                position: Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 0),
                wgs84_positions: [],
                gcj02_positions: [],
                point: {
                    show: true,
                    color: Cesium.Color.YELLOW
                },
                polyline: {
                    show: true,
                    positions: [],
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        color: Cesium.Color.YELLOW
                    }),
                    width: 5
                }
            });
        } else {
            $.xmMapViewer.entities.add({
                id: window.prevTrackPolyLineId,
                gcj02_position: Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 0),
                wgs84_position: Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 0),
                position: Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 0),
                wgs84_positions: [],
                gcj02_positions: [],
                point: {
                    show: true,
                    color: Cesium.Color.RED
                },
                polyline: {
                    show: true,
                    positions: [],
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        color: Cesium.Color.YELLOW
                    }),
                    width: 5
                }
            });
        }
        const lnglat = carInfo.longitude_gcj02 + "," + carInfo.latitude_gcj02;
        window.AMapGeocoder.getAddress(lnglat, function (status, result) {
            let address = "未知地址(" + lnglat + ")"
            if (status === 'complete' && result.regeocode) {
                address = result.regeocode.formattedAddress;
            }
            $("#vehicleDetialTipsUl").empty()
                .append("<li><span>车牌号：</span>" + carInfo.vno + "</li>")
                .append("<li><span>当前车速：</span><i id='trackPolylineSpeed'>" + (carInfo.obd_speed || 0) + "km/h</i></li>")
                .append("<li title=" + address + "><span>当前位置：</span><i id='trackPolylineAddress'>" + address + "</i></li>");
            $("#queryTrack").data("vno", carInfo.vno);
            $("#queryTrack").data("sim", carInfo.terminal_sim);
            $("#vehicleDetial").data("vno", carInfo.vno);
            $("#vehicleDetial").data("sim", carInfo.terminal_sim);
        });
        trajectoryTracking.picked = pick;
        let cartesian = $.xmMapViewer.camera.pickEllipsoid(e.position, $.xmMapViewer.scene.globe.ellipsoid);
        trajectoryTracking.tipsCartesian2 = cartesian;
    },
    "logistics": function (e, pick, id) {

    },
    "logistics_route": function (e, pick, id) {
        //运力地图-运输路线
        //选中某模型pick选中的对象
        const routeInfo = window.logisticsRoute[id.id];
        if (!routeInfo) return;
        $("#routeTips").css({
            display: "block",
            top: e.position.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
            left: e.position.x + 'px'
        });
        //第一次
        let prevEntity = window.logisticsRoute["prev"];
        if (!prevEntity) {
            window.logisticsRoute["prev"] = {};
            window.logisticsRoute["prev"].id = id.id;
            let currentEntity = $.xmMapViewer.entities.getById(id.id);
            $.xmMapViewer.entities.getById(id.id).polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: 1, //一个数字属性，指定发光强度，占总线宽的百分比。
                color: Cesium.Color.ORANGERED.withAlpha(9)
            });
        } else {
            let currentEntity = $.xmMapViewer.entities.getById(prevEntity.id);
            $.xmMapViewer.entities.getById(prevEntity.id).polyline.material = window.logisticsRoute[prevEntity.id].material;
            $.xmMapViewer.entities.getById(id.id).polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: 1, //一个数字属性，指定发光强度，占总线宽的百分比。
                color: Cesium.Color.ORANGERED.withAlpha(9)
            });
            window.logisticsRoute["prev"].id = id.id;
        }
        $("#routeTipsUL").empty()
            .append("<li><span>始发地：</span>" + routeInfo.origin + "</li>")
            .append("<li><span>目的地：</span>" + routeInfo.destination + "</li>")
            .append("<li><span>总路程：</span>" + (parseInt(routeInfo.distance) / 1000.0).toFixed(1) + "公里</li>")
            .append("<li><span>耗时：</span>" + (parseInt(routeInfo.duration) / 3600.0).toFixed(1) + "小时</li>");
        trajectoryTracking.picked = pick;
        let cartesian = $.xmMapViewer.camera.pickEllipsoid(e.position, $.xmMapViewer.scene.globe.ellipsoid);
        trajectoryTracking.tipsCartesian2 = cartesian;
    },
    "logistics_route_gas_station": function (e, pick, id) {
        //添加雷达扫描。
        let ds = $.xmMapViewer.dataSources.getByName("logistics_route_gas_station");
        if (ds.length > 0) {
            $.xmMapViewer.dataSources.remove(ds[0], true);
        }
        let radius=5000;
        ds = new Cesium.CustomDataSource('logistics_route_gas_station');
        window.radarScanId="radarScanId";
        $.xmMapViewer.entities.removeById(window.radarScanId);
        if (window.coordinateType.seleced === window.coordinateType.gcj02) {
            $.xmMapViewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(id.gcj02_coordinate.longitude, id.gcj02_coordinate.latitude, 25000)
            });
            window.radarScan = addRadarScan($.xmMapViewer, {
                lon: id.gcj02_coordinate.longitude,//经度
                lat: id.gcj02_coordinate.latitude, //纬度
                scanColor: new Cesium.Color(0, 0, 1, 1),//红，绿，蓝，透明度
                //scanColor:new Cesium.Color(1.0, 0.1, 0.1, 1),//红，绿，蓝，透明度
                r: radius,//扫描半径
                interval: 4000//时间间隔
            });
            setTimeout(function () {
                $.xmMapViewer.scene.postProcessStages.remove(window.radarScan); //消除;
                $.xmMapViewer.scene.globe.depthTestAgainstTerrain = false;
                $.xmMapViewer.entities.add({
                    id: window.radarScanId,
                    gcj02_position: coordinateToPosition(id.gcj02_coordinate),
                    wgs84_position: coordinateToPosition(id.wgs84_coordinate),
                    position: coordinateToPosition(id.gcj02_coordinate),
                    name: '',
                    ellipse: {
                        semiMinorAxis: radius,//指定半长轴的数值属性
                        semiMajorAxis: radius,//指定半短轴的数字属性。
                        height: 0,//一个数字属性，指定椭圆相对于椭球表面的高度。
                        fill: false,//一个布尔属性，指定椭圆是否填充了所提供的材料。空心
                        // material : Cesium.Color.BLUE.withAlpha(0), //一个属性，指定用于填充椭圆的材料。
                        outline: true,//一个布尔属性，指定是否勾勒出椭圆。 height must be set for outline to display
                        outlineColor: Cesium.Color.BLUE,//一个属性，指定轮廓的 颜色 。
                        outlineWidth: 10 //一个数字属性，指定轮廓的宽度。
                    }
                });
                axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryWholeStreetWithCenterPoint', {
                    distance:0.001,
                    adcode: id.adcode,gcj02_Coordinate:{
                    "longitude": id.gcj02_coordinate.longitude,
                    "latitude": id.gcj02_coordinate.latitude
                }}).then((response) => {
                    if (response.data) {
                        for (let index = 0; index < response.data.length; index++) {
                            const element = response.data[index];
                            ds.entities.add({
                                wgs84_position: coordinateToPosition(element.wgs84_center,element.gcj02_polyline.length+200),
                                gjc02_position: coordinateToPosition(element.gcj02_center,element.gcj02_polyline.length+200),
                                position: coordinateToPosition(element.gcj02_center,element.gcj02_polyline.length+200),
                                label: {
                                    color:Cesium.Color.WHITE,
                                    text: element.name
                                }
                            });
                            ds.entities.add({
                                gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polyline),
                                wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polyline),
                                polygon: {
                                    show: true,
                                    hierarchy: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polyline),
                                    height: 0,
                                    material: window.MapColors[index%10],//使用红色，绿色，蓝色和alpha值指定的颜色，范围从0（无强度）到1.0（全强度）。
                                    outline: true,//几何轮廓存在
                                    outlineColor: window.MapColors[index%10],//设置轮廓颜色为黑色,
                                    extrudedHeight:element.gcj02_polyline.length+150
                                }
                            });
                        }
                        $.xmMapViewer.dataSources.add(ds);
                    }
                });
            }, 5000)
        } else if (window.coordinateType.seleced === window.coordinateType.wgs84) {
            $.xmMapViewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(id.wgs84_coordinate.longitude, id.wgs84_coordinate.latitude, 25000)
            });
            window.radarScan = addRadarScan($.xmMapViewer, {
                lon: id.wgs84_coordinate.longitude,//经度
                lat: id.wgs84_coordinate.latitude, //纬度
                scanColor: new Cesium.Color(0, 0, 1, 1),//红，绿，蓝，透明度
                //scanColor:new Cesium.Color(1.0, 0.1, 0.1, 1),//红，绿，蓝，透明度
                r: radius,//扫描半径
                interval: 4000//时间间隔
            });
            setTimeout(function () {
                $.xmMapViewer.scene.postProcessStages.remove(window.radarScan); //消除;
                $.xmMapViewer.scene.globe.depthTestAgainstTerrain = false;
                $.xmMapViewer.entities.add({
                    id: window.radarScanId,
                    gcj02_position: coordinateToPosition(id.gcj02_coordinate),
                    wgs84_position: coordinateToPosition(id.wgs84_coordinate),
                    position: coordinateToPosition(id.wgs84_coordinate),
                    ellipse: {
                        semiMinorAxis: radius,//指定半长轴的数值属性
                        semiMajorAxis: radius,//指定半短轴的数字属性。
                        height: 0,//一个数字属性，指定椭圆相对于椭球表面的高度。
                        fill: false,//一个布尔属性，指定椭圆是否填充了所提供的材料。空心
                        // material : Cesium.Color.BLUE.withAlpha(0), //一个属性，指定用于填充椭圆的材料。
                        outline: true,//一个布尔属性，指定是否勾勒出椭圆。 height must be set for outline to display
                        outlineColor: Cesium.Color.BLUE,//一个属性，指定轮廓的 颜色 。
                        outlineWidth: 10 //一个数字属性，指定轮廓的宽度。
                    }
                });
                axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryWholeStreetWithCenterPoint', {
                    "distance":0.001,
                    "adcode": id.adcode,
                    "gcj02_Coordinate":{
                        "longitude": id.wgs84_coordinate.longitude,
                        "latitude": id.wgs84_coordinate.latitude
                    }
                }).then((response) => {
                    if (response.data) {
                        for (let index = 0; index < response.data.length; index++) {
                            const element = response.data[index];
                            ds.entities.add({
                                wgs84_position: coordinateToPosition(element.wgs84_center,element.gcj02_polyline.length+200),
                                gjc02_position: coordinateToPosition(element.gcj02_center,element.gcj02_polyline.length+200),
                                position: coordinateToPosition(element.wgs84_center,element.gcj02_polyline.length+200),
                                label: {
                                    color:Cesium.Color.WHITE,
                                    text: element.name
                                }
                            });
                            ds.entities.add({
                                gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polyline),
                                wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polyline),
                                polygon: {
                                    show: true,
                                    hierarchy: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polyline),
                                    height: 0,
                                    material: window.MapColors[index%10],//使用红色，绿色，蓝色和alpha值指定的颜色，范围从0（无强度）到1.0（全强度）。
                                    outline: true,//几何轮廓存在
                                    outlineColor: window.MapColors[index%10],//设置轮廓颜色为黑色,
                                    extrudedHeight:element.gcj02_polyline.length+150
                                }
                            });
                        }
                        $.xmMapViewer.dataSources.add(ds);
                    }
                });
            }, 5000)
        }
    },
    "logistics_route_gas_station_poi": function (e, pick, id) {
        //添加雷达扫描。
        let ds = $.xmMapViewer.dataSources.getByName("logistics_route_gas_station");
        if (ds.length > 0) {
            $.xmMapViewer.dataSources.remove(ds[0], true);
        }
        ds = new Cesium.CustomDataSource('logistics_route_gas_station');
        let radius = 5000;
        window.radarScanId="radarScanId";
        $.xmMapViewer.entities.removeById(window.radarScanId);
        if (window.coordinateType.seleced === window.coordinateType.gcj02) {
            $.xmMapViewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(id.gcj02_coordinate.longitude, id.gcj02_coordinate.latitude, 25000)
            });
            window.radarScan = addRadarScan($.xmMapViewer, {
                lon: id.gcj02_coordinate.longitude,//经度
                lat: id.gcj02_coordinate.latitude, //纬度
                scanColor: new Cesium.Color(0, 0, 1, 1),//红，绿，蓝，透明度
                //scanColor:new Cesium.Color(1.0, 0.1, 0.1, 1),//红，绿，蓝，透明度
                r: radius,//扫描半径
                interval: 4000//时间间隔
            });
            setTimeout(function () {
                $.xmMapViewer.scene.globe.depthTestAgainstTerrain = false;
                $.xmMapViewer.scene.postProcessStages.remove(window.radarScan); //消除;
                $.xmMapViewer.entities.add({
                    id:window.radarScanId,
                    gcj02_position: coordinateToPosition(id.gcj02_coordinate),
                    wgs84_position: coordinateToPosition(id.wgs84_coordinate),
                    position: coordinateToPosition(id.gcj02_coordinate),
                    ellipse: {
                        semiMinorAxis: radius,//指定半长轴的数值属性
                        semiMajorAxis: radius,//指定半短轴的数字属性。
                        height: 0,//一个数字属性，指定椭圆相对于椭球表面的高度。
                        fill: false,//一个布尔属性，指定椭圆是否填充了所提供的材料。空心
                        // material : Cesium.Color.BLUE.withAlpha(0), //一个属性，指定用于填充椭圆的材料。
                        outline: true,//一个布尔属性，指定是否勾勒出椭圆。 height must be set for outline to display
                        outlineColor: Cesium.Color.BLUE,//一个属性，指定轮廓的 颜色 。
                        outlineWidth: 10 //一个数字属性，指定轮廓的宽度。
                    }
                });
                axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryWholeStreetWithCenterPoint', {
                    distance:0.001,
                    adcode: id.adcode,gcj02_Coordinate:{
                        longitude: id.gcj02_coordinate.longitude,
                        latitude: id.gcj02_coordinate.latitude
                    }
                }).then((response) => {
                    if (response.data) {
                        for (let index = 0; index < response.data.length; index++) {
                            const element = response.data[index];
                            ds.entities.add({
                                wgs84_position: coordinateToPosition(element.wgs84_center,element.gcj02_polyline.length+200),
                                gjc02_position: coordinateToPosition(element.gcj02_center,element.gcj02_polyline.length+200),
                                position: coordinateToPosition(element.gcj02_center,element.gcj02_polyline.length+200),
                                label: {
                                    color:Cesium.Color.WHITE,
                                    text: element.name
                                }
                            });
                            ds.entities.add({
                                gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polyline),
                                wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polyline),
                                polygon: {
                                    show: true,
                                    hierarchy: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polyline),
                                    height: 0,
                                    material: window.MapColors[index%10],//使用红色，绿色，蓝色和alpha值指定的颜色，范围从0（无强度）到1.0（全强度）。
                                    outline: true,//几何轮廓存在
                                    outlineColor: window.MapColors[index%10],//设置轮廓颜色为黑色,
                                    extrudedHeight:element.gcj02_polyline.length+150
                                }
                            });
                        }
                        $.xmMapViewer.dataSources.add(ds);
                    }
                });
            }, 5000)
        } else if (window.coordinateType.seleced === window.coordinateType.wgs84) {
            $.xmMapViewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(id.wgs84_coordinate.longitude, id.wgs84_coordinate.latitude, 25000)
            });
            window.radarScan = addRadarScan($.xmMapViewer, {
                lon: id.wgs84_coordinate.longitude,//经度
                lat: id.wgs84_coordinate.latitude, //纬度
                scanColor: new Cesium.Color(0, 0, 1, 1),//红，绿，蓝，透明度
                //scanColor:new Cesium.Color(1.0, 0.1, 0.1, 1),//红，绿，蓝，透明度
                r: radius,//扫描半径
                interval: 4000//时间间隔
            });
            setTimeout(function () {
                $.xmMapViewer.scene.postProcessStages.remove(window.radarScan); //消除;
                $.xmMapViewer.scene.globe.depthTestAgainstTerrain = false;
                $.xmMapViewer.entities.add({
                    id:window.radarScanId,
                    gcj02_position: coordinateToPosition(id.gcj02_coordinate),
                    wgs84_position: coordinateToPosition(id.wgs84_coordinate),
                    position: coordinateToPosition(id.wgs84_coordinate),
                    ellipse: {
                        semiMinorAxis: radius,//指定半长轴的数值属性
                        semiMajorAxis: radius,//指定半短轴的数字属性。
                        height: 0,//一个数字属性，指定椭圆相对于椭球表面的高度。
                        fill: false,//一个布尔属性，指定椭圆是否填充了所提供的材料。空心
                        // material : Cesium.Color.BLUE.withAlpha(0), //一个属性，指定用于填充椭圆的材料。
                        outline: true,//一个布尔属性，指定是否勾勒出椭圆。 height must be set for outline to display
                        outlineColor: Cesium.Color.BLUE,//一个属性，指定轮廓的 颜色 。
                        outlineWidth: 10 //一个数字属性，指定轮廓的宽度。
                    }
                });
                axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryWholeStreetWithCenterPoint', {
                    distance:0.001,
                    adcode: id.adcode,
                    gcj02_Coordinate:{
                        longitude: id.wgs84_coordinate.longitude,
                        latitude: id.wgs84_coordinate.latitude
                    }
                }).then((response) => {
                    if (response.data) {
                        for (let index = 0; index < response.data.length; index++) {
                            const element = response.data[index];
                            ds.entities.add({
                                wgs84_position: coordinateToPosition(element.wgs84_center,element.gcj02_polyline.length+200),
                                gjc02_position: coordinateToPosition(element.gcj02_center,element.gcj02_polyline.length+200),
                                position: coordinateToPosition(element.wgs84_center,element.gcj02_polyline.length+200),
                                label: {
                                    color:Cesium.Color.WHITE,
                                    text: element.name
                                }
                            });
                            ds.entities.add({
                                gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polyline),
                                wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polyline),
                                polygon: {
                                    show: true,
                                    hierarchy: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polyline),
                                    height: 0,
                                    material: window.MapColors[index%10],//使用红色，绿色，蓝色和alpha值指定的颜色，范围从0（无强度）到1.0（全强度）。
                                    outline: true,//几何轮廓存在
                                    outlineColor: window.MapColors[index%10],//设置轮廓颜色为黑色,
                                    extrudedHeight:element.gcj02_polyline.length+150
                                }
                            });
                        }
                        $.xmMapViewer.dataSources.add(ds);
                    }
                });
            }, 5000)
        }
    },
    "company": function (e, pick, id) {//公司名称
        let entity = window.logisticsCompany[id.id];
        if (typeof (entity) === undefined) return;
        // 移动炫酷
        //console.log(entity)
        $.xmMapViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(entity.longitude_gcj02, entity.latitude_gcj02, 15000.0)
        });
        $("#companyTipsContent").empty().append("<label>公司名称：</label> <span>" + id.id + "</span>");
        $("#companyTips").css({
            display: "block",
            top: e.position.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
            left: e.position.x + 'px'
        });
        trajectoryTracking.picked = pick;
        let cartesian = $.xmMapViewer.camera.pickEllipsoid(e.position, $.xmMapViewer.scene.globe.ellipsoid);
        trajectoryTracking.tipsCartesian2 = cartesian;
    },
    "financial": function (e, pick, id) {

    }
};

//地图渲染事件
window.ViewerPostRenderHandler = {
    "transport": function () {
        let changedC = null
        if (trajectoryTracking.picked.id._polyline != null) {
            let pos = {};
            pos.x = (trajectoryTracking.picked.id._polyline._positions._value["0"].x + trajectoryTracking.picked.id._polyline._positions._value[1].x) / 2
            pos.y = (trajectoryTracking.picked.id._polyline._positions._value["0"].y + trajectoryTracking.picked.id._polyline._positions._value[1].y) / 2
            pos.z = (trajectoryTracking.picked.id._polyline._positions._value["0"].z + trajectoryTracking.picked.id._polyline._positions._value[1].z) / 2
            changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, pos)
        } else if (trajectoryTracking.picked._polyline != null) {
            let pos = {};
            pos.x = (trajectoryTracking.picked._polyline._positions._value["0"].x + trajectoryTracking.picked._polyline._positions._value[1].x) / 2
            pos.y = (trajectoryTracking.picked._polyline._positions._value["0"].y + trajectoryTracking.picked._polyline._positions._value[1].y) / 2
            pos.z = (trajectoryTracking.picked._polyline._positions._value["0"].z + trajectoryTracking.picked._polyline._positions._value[1].z) / 2
            changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, pos)
        } else {
            if (trajectoryTracking.picked.id._position instanceof Cesium.ConstantPositionProperty) {
                changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, trajectoryTracking.picked.id._position._value)
            } else if (trajectoryTracking.picked._position instanceof Cesium.ConstantPositionProperty) {
                changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, trajectoryTracking.picked._position._value)
            }
        }
        if (changedC == null) return
        if ((trajectoryTracking.tipsCartesian2.x !== changedC.x) || (trajectoryTracking.tipsCartesian2.y !== changedC.y)) {
            $("#vehicleDetialTips").css({
                //display: "block",
                top: changedC.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
                left: changedC.x + 'px'
            });
            trajectoryTracking.tipsCartesian2 = changedC
        }
    },
    "company": function () {//公司名称tips监听
        let changedC = null
        if (trajectoryTracking.picked.id._polyline != null) {
            let pos = {};
            pos.x = (trajectoryTracking.picked.id._polyline._positions._value["0"].x + trajectoryTracking.picked.id._polyline._positions._value[1].x) / 2
            pos.y = (trajectoryTracking.picked.id._polyline._positions._value["0"].y + trajectoryTracking.picked.id._polyline._positions._value[1].y) / 2
            pos.z = (trajectoryTracking.picked.id._polyline._positions._value["0"].z + trajectoryTracking.picked.id._polyline._positions._value[1].z) / 2
            changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, pos)
        } else if (trajectoryTracking.picked._polyline != null) {
            let pos = {};
            pos.x = (trajectoryTracking.picked._polyline._positions._value["0"].x + trajectoryTracking.picked._polyline._positions._value[1].x) / 2
            pos.y = (trajectoryTracking.picked._polyline._positions._value["0"].y + trajectoryTracking.picked._polyline._positions._value[1].y) / 2
            pos.z = (trajectoryTracking.picked._polyline._positions._value["0"].z + trajectoryTracking.picked._polyline._positions._value[1].z) / 2
            changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, pos)
        } else {
            if (trajectoryTracking.picked.id._position instanceof Cesium.ConstantPositionProperty) {
                changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, trajectoryTracking.picked.id._position._value)
            } else if (trajectoryTracking.picked._position instanceof Cesium.ConstantPositionProperty) {
                changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, trajectoryTracking.picked._position._value)
            }
        }
        if (changedC == null) return;
        if ((trajectoryTracking.tipsCartesian2.x !== changedC.x) || (trajectoryTracking.tipsCartesian2.y !== changedC.y)) {
            $("#companyTips").css({
                //display: "block",
                top: changedC.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
                left: changedC.x + 'px'
            });
            trajectoryTracking.tipsCartesian2 = changedC
        }
    },
    "logistics_route": function () { //运输路线tips监听
        let changedC = null
        if (trajectoryTracking.picked.id._polyline != null) {
            let pos = {};
            pos.x = (trajectoryTracking.picked.id._polyline._positions._value["0"].x + trajectoryTracking.picked.id._polyline._positions._value[1].x) / 2
            pos.y = (trajectoryTracking.picked.id._polyline._positions._value["0"].y + trajectoryTracking.picked.id._polyline._positions._value[1].y) / 2
            pos.z = (trajectoryTracking.picked.id._polyline._positions._value["0"].z + trajectoryTracking.picked.id._polyline._positions._value[1].z) / 2
            changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, pos)
        } else if (trajectoryTracking.picked._polyline != null) {
            let pos = {};
            pos.x = (trajectoryTracking.picked._polyline._positions._value["0"].x + trajectoryTracking.picked._polyline._positions._value[1].x) / 2
            pos.y = (trajectoryTracking.picked._polyline._positions._value["0"].y + trajectoryTracking.picked._polyline._positions._value[1].y) / 2
            pos.z = (trajectoryTracking.picked._polyline._positions._value["0"].z + trajectoryTracking.picked._polyline._positions._value[1].z) / 2
            changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, pos)
        } else {
            if (trajectoryTracking.picked.id._position instanceof Cesium.ConstantPositionProperty) {
                changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, trajectoryTracking.picked.id._position._value)
            } else if (trajectoryTracking.picked._position instanceof Cesium.ConstantPositionProperty) {
                changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, trajectoryTracking.picked._position._value)
            }
        }
        if (changedC == null) return
        if ((trajectoryTracking.tipsCartesian2.x !== changedC.x) || (trajectoryTracking.tipsCartesian2.y !== changedC.y)) {
            $("#routeTips").css({
                //display: "block",
                top: changedC.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
                left: changedC.x + 'px'
            });
            trajectoryTracking.tipsCartesian2 = changedC
        }
    }
};

function xuanZhuan(xyz, duShu, modelMatrix) {
    var m = modelMatrix
    // duShu为旋转角度，转为弧度再参与运算
    var m1 = null
    if (xyz === 'x' || xyz === 'X') {
      // eslint-disable-next-line no-undef
      m1 = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(duShu))
    } else if (xyz === 'y' || xyz === 'y') {
      // eslint-disable-next-line no-undef
      m1 = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(duShu))
    } else if (xyz === 'z' || xyz === 'Z') {
      // eslint-disable-next-line no-undef
      m1 = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(duShu))
    }
    // eslint-disable-next-line no-undef
    Cesium.Matrix4.multiplyByMatrix3(m, m1, m) // 矩阵计算
    return m
}

function updatePrimitives() {
    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.HuoFaDaLou.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.520675, 24.363530);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.HuoFaDaLou._root.transform = xuanZhuan('z', 0.4, modelMatrix);
        });
    } else {
        window.HuoFaDaLou.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.520675, 24.363530, 0));
            window.HuoFaDaLou._root.transform =xuanZhuan('z', 0.4, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.DongFengGuangChang.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.542480,24.346300);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.DongFengGuangChang._root.transform =  xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.DongFengGuangChang.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.542480,24.346300, 0));
            window.DongFengGuangChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.DongFengShuiKu.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.577400,24.371752);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.DongFengShuiKu._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.DongFengShuiKu.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.577400,24.371752, 0));
            window.DongFengShuiKu._root.transform =xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.HuoCheNanZhan.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.512325,24.281200);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.HuoCheNanZhan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.HuoCheNanZhan.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.512325,24.281200, 0));
            window.HuoCheNanZhan._root.transform =  xuanZhuan('z', 0, modelMatrix);
        });
    }
    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.LanXiRuiYuan.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.550900,24.374190);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.LanXiRuiYuan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.LanXiRuiYuan.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.550900,24.374190, 0));
            window.LanXiRuiYuan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.NieErGuangChang.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.559454,24.371600);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.NieErGuangChang._root.transform =xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.NieErGuangChang.readyPromise.then(function(argument) {
            var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.559454,24.371600, 0));
            window.NieErGuangChang._root.transform =xuanZhuan('z', 0, modelMatrix);
        });
    }
    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.ShuiNiChang.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.475807,24.390300);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.ShuiNiChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.ShuiNiChang.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.475807,24.390300, 0));
            window.ShuiNiChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }
    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.TuZhaChang.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.478990,24.375676);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.TuZhaChang._root.transform =xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.TuZhaChang.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.478990,24.375676, 0));
            window.TuZhaChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.WuLiuYuan.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.488930,24.376590);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.WuLiuYuan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.WuLiuYuan.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.488930,24.376590, 0));
            window.WuLiuYuan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.XianFuGangTieChang.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.183423,24.018358);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.XianFuGangTieChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.XianFuGangTieChang.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.183423,24.018358, 0));
            window.XianFuGangTieChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.YuKunGangTieChang.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.547538,24.471482);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.YuKunGangTieChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.YuKunGangTieChang.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.547538,24.471482, 0));
            window.YuKunGangTieChang._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }

    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        window.YuXiGaoTieZhan.readyPromise.then(function(argument) {
            let coordinate = coordtransform.wgs84togcj02(102.512450,24.341910);
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(coordinate[0],coordinate[1], 0));
            window.YuXiGaoTieZhan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    } else {
        window.YuXiGaoTieZhan.readyPromise.then(function(argument) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(102.512450,24.341910, 0));
            window.YuXiGaoTieZhan._root.transform = xuanZhuan('z', 0, modelMatrix);
        });
    }
}

//经纬度转地图坐标
function coordinateToPosition(coordinate, alt = 0) {
    let cartographic = Cesium.Cartographic.fromDegrees(coordinate.longitude, coordinate.latitude, alt);
    let point = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
    return point;
}

//屏幕坐标转经纬度
function pickToCoordinate(position) {
    let cartesian = $.xmMapViewer.camera.pickEllipsoid(position, $.xmMapViewer.scene.globe.ellipsoid);

    let ellipsoid = $.xmMapViewer.scene.globe.ellipsoid;
    let cartographic = ellipsoid.cartesianToCartographic(cartesian);
    console.log(cartographic);

    return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        height: cartographic.height
    };
}

/**
 * 云南省行政区域
 */
function initYunNanArea() {
    axios.get('/static/json/yunnan_amap.json').then((response) => {
        if (response.data) {
            let gcj02_positions = [];
            let wgs84_positions = [];
            response.data.gcj02_coordinates.map((point, index) => {
                gcj02_positions.push(coordinateToPosition(point));
            });
            response.data.wgs84_coordinates.map((point, index) => {
                wgs84_positions.push(coordinateToPosition(point));
            });
            let ds = new Cesium.CustomDataSource('yunnan_area');
            ds.entities.add({
                id: "yunnan_polyline",
                gcj02_positions: gcj02_positions,
                wgs84_positions: wgs84_positions,
                polyline: {
                    show: true,
                    positions: gcj02_positions,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        color: Cesium.Color.YELLOW
                    }),
                    width: 5
                }
            });
            $.xmMapViewer.dataSources.add(ds);
        }
    });
}

/********************************************************************************************************/
/*******************************************地图事件结束**************************************************/
/********************************************************************************************************/

/********************************************************************************************************/
/*******************************************运力地图开始**************************************************/
/********************************************************************************************************/

//运力地图-初始化消息推送
function transportInitWebSocket() {
    window.signalRConn = new signalR.HubConnectionBuilder()
        .withUrl(window.BASE_URL + "/PositionHub?Bearer=" + token)
        .build();
    
    window.signalRConn.on("ReceiveMessage", (TerminalNo, message) => {
        message = JSON.parse(message);
        //console.log(TerminalNo,message);
        
        if (!message.vno) return;
        if (message.obd_speed <= 0) {
            //如果obd没有就使用gps的速度替代
            message.obd_speed = (message.speed || 0) / 10.0
        }
        let wgs84togcj02 = coordtransform.wgs84togcj02(message.longitude, message.latitude);
        let status = ((message.car_state & 1) == 1) ? "在线" : "离线";
        //更新左边的车辆状态表
        transportVehicleTableUpdateRow(message, wgs84togcj02, status);
        //更新地图标注
        transportMarkUpdate(message);
        //更新右上角表格的报警信息
        transportAlarmableUpdateRow(message, wgs84togcj02, status);
    });
    window.signalRConn.on("CarHeartbeat", (TerminalNo, message) => {
        message = JSON.parse(message);
        //console.log("CarHeartbeat",message);
        if (message.alarm_type_name == "车辆故障码") return;
        //没有就先忽略
        if (!window.transportCarLocationMap) return;
        if (!window.transportCarLocationMap.hasOwnProperty(message.terminal_sim)) return;
        //更新左边的车辆状态表
        let carStatusRow = window.transportCarLocationMap[message.terminal_sim];
        if (carStatusRow) {
            carStatusRow.date = message.gps_time;
            if (carStatusRow.status == "在线") {
                carStatusRow.status = "离线";
                let trStr = "<tr class='text-danger' car-status-row=" + carStatusRow.terminal_sim + ">";
                trStr += "<td>" + carStatusRow.vno + "</td>";
                trStr += "<td>" + carStatusRow.status + "</td>";
                trStr += "<td>" + dayjs.unix(carStatusRow.date).format('HH:mm:ss') + "</td>";
                trStr += "<td>" + "挂车" + "</td>";
                trStr += "<td>"+carStatusRow.driver_name+"</td>";
                trStr + "</tr>";
                $("#transportVehicleTable>tbody tr[car-status-row='" + message.terminal_sim + "']").remove();
                $("#transportVehicleTable>tbody").prepend(trStr);
            } else {
                let trStr = "<td>" + carStatusRow.vno + "</td>";
                trStr += "<td>" + carStatusRow.status + "</td>";
                trStr += "<td>" + dayjs.unix(carStatusRow.date).format('HH:mm:ss') + "</td>";
                trStr += "<td>" + "挂车" + "</td>";
                trStr += "<td>"+carStatusRow.driver_name+"</td>";
                $("#transportVehicleTable>tbody tr[car-status-row='" + message.terminal_sim + "']").html(trStr);
            }
        }
    });
    window.signalRConn.on("AlarmVoice", (voiceId) => {
        let url = 'https://api-dev.guojutech.net/factoring-voice/voice/playVoice?id=' + voiceId;
        if(!window.AlarmVoiceArray) return;
        if(window.AlarmVoiceArray.length>5) return;
        window.AlarmVoiceArray.push(url);
    });
    window.signalRConn.start().catch(err => console.error(err));
}

//运力地图-初始化车辆定位mark点
function transportInitVehicleMark() {
    $("#vehicleDetialTips").css({display: "none"});
    //大批量操作时，临时禁用事件可以提高性能
    $.xmMapViewer.entities.suspendEvents();
    let ellipsoid = $.xmMapViewer.scene.globe.ellipsoid;
    let height = $.xmMapViewer.camera.positionCartographic.height;
    for (const key in window.transportCarLocationMap) {
        let point = window.transportCarLocationMap[key];
        let cartographic = Cesium.Cartographic.fromDegrees(point.longitude, point.latitude, 1);
        let cartesian3 = ellipsoid.cartographicToCartesian(cartographic);
        let offlineImage;
        if (point.status == "在线") {
            if (height <= 12000) {
                offlineImage = window.isLoad4k ? "/static/images/transport/online@2x.png" : "/static/images/transport/online@1x.png"
            } else {
                offlineImage = window.isLoad4k ? "/static/images/transport/online@1x.png" : "/static/images/transport/online@mini.png"
            }

        } else {
            if (height <= 12000) {
                offlineImage = window.isLoad4k ? "/static/images/transport/offline@2x.png" : "/static/images/transport/offline@1x.png";
            } else {
                offlineImage = window.isLoad4k ? "/static/images/transport/offline@1x.png" : "/static/images/transport/offline@mini.png";
            }
        }
        $.xmMapViewer.entities.add({
            id: point.terminal_sim,
            clickType: "transport",
            clampToGround: true,
            gcj02_position: ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(point.longitude_gcj02, point.latitude_gcj02, 1)),
            wgs84_position: cartesian3,
            position: ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(point.longitude_gcj02, point.latitude_gcj02, 1)),
            label: {
                text: "[" + point.vno + "]" + point.status,
                font: '12px SimHei ',
                Width: 3,
                style: Cesium.LabelStyle.FILL,
                fillColor: Cesium.Color.AQUA,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0.0, -30),
                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5)
            },
            billboard: {
                image: offlineImage
            }
        });
    }
    $.xmMapViewer.entities.resumeEvents();
}

//运力地图-更新车辆最后定位mark点
function transportUpdateVehicleMark() {
    let len = $.xmMapViewer.entities.values.length;
    let entityPolyLine = $.xmMapViewer.entities.getById(window.prevTrackPolyLineId);
    let yunnanDataSource = $.xmMapViewer.dataSources.getByName("yunnan_area");
    let yunnanPolyLine = null;
    if (yunnanDataSource.length > 0) {
        yunnanPolyLine = yunnanDataSource[0].entities.getById("yunnan_polyline");
    }
    if (window.coordinateType.seleced === window.coordinateType.wgs84) {
        if (entityPolyLine != null) {
            entityPolyLine._polyline.show = false;
            entityPolyLine._polyline.positions._value = entityPolyLine.wgs84_positions;
            entityPolyLine._polyline.show = true;
        }
        if (yunnanPolyLine != null) {
            yunnanPolyLine._polyline.show = false;
            yunnanPolyLine._polyline.positions._value = yunnanPolyLine.wgs84_positions;
            yunnanPolyLine._polyline.show = true;
        }
    } else if (window.coordinateType.seleced === window.coordinateType.gcj02) {
        if (entityPolyLine != null) {
            entityPolyLine._polyline.show = false;
            entityPolyLine._polyline.positions._value = entityPolyLine.gcj02_positions;
            entityPolyLine._polyline.show = true;
        }
        if (yunnanPolyLine != null) {
            yunnanPolyLine._polyline.show = false;
            yunnanPolyLine._polyline.positions._value = yunnanPolyLine.gcj02_positions;
            yunnanPolyLine._polyline.show = true;
        }
    }
    if(window.parkingDataSource){
        let parkLen = window.parkingDataSource.entities.values.length;
        for (let i = 0; i < parkLen; i++) {
            let entity = window.parkingDataSource.entities.values[i];
            if (window.coordinateType.seleced === window.coordinateType.wgs84) {
                entity.position = entity.wgs84_position;
            } else if (window.coordinateType.seleced === window.coordinateType.gcj02) {
                entity.position = entity.gcj02_position;
            }
        }
    }
    for (let i = 0; i < len; i++) {
        let entity = $.xmMapViewer.entities.values[i];
        if (window.coordinateType.seleced === window.coordinateType.wgs84) {
            entity.position = entity.wgs84_position;
        } else if (window.coordinateType.seleced === window.coordinateType.gcj02) {
            entity.position = entity.gcj02_position;
        }
    }
}

//运力地图-地图标注实时行更新
function transportMarkUpdate(message) {
    if (transportFilterWebSocketUpdate(message)) return;
    let entity = $.xmMapViewer.entities.getById(message.terminal_sim);
    if (entity) {
        let carInfo = window.transportCarLocationMap[message.terminal_sim];
        if (carInfo) {
            if (window.coordinateType.seleced === window.coordinateType.gcj02) {
                entity.position = new Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 1);
                entity.gcj02_position = new Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 1);
                entity.wgs84_position = new Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 1);
                let entityPolyLine = $.xmMapViewer.entities.getById(message.terminal_sim + "_polyline");
                if (entityPolyLine != null) {
                    $("#trackPolylineSpeed").empty().text(message.obd_speed + "km/h");
                    const lnglat = carInfo.longitude_gcj02 + "," + carInfo.latitude_gcj02;
                    window.AMapGeocoder.getAddress(lnglat, function (status, result) {
                        let address = "未知地址(" + lnglat + ")"
                        if (status === 'complete' && result.regeocode) {
                            address = result.regeocode.formattedAddress;
                            $("#trackPolylineAddress").empty().text(address);
                            $("#trackPolylineAddress").parent("li").attr("title", address);
                        }
                    });
                    entityPolyLine.polyline.show = true;
                    entityPolyLine.gcj02_positions.push(Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 1));
                    entityPolyLine.wgs84_positions.push(Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 1));
                    entityPolyLine._polyline.positions._value.push(Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 1));
                }
            } else {
                entity.position = new Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 1);
                entity.gcj02_position = new Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 1);
                entity.wgs84_position = new Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 1);
                let entityPolyLine = $.xmMapViewer.entities.getById(carInfo.terminal_sim + "_polyline");
                if (entityPolyLine != null) {
                    $("#trackPolylineSpeed").empty().text(message.obd_speed + "km/h");
                    const lnglat = carInfo.longitude_gcj02 + "," + carInfo.latitude_gcj02;
                    window.AMapGeocoder.getAddress(lnglat, function (status, result) {
                        let address = "未知地址(" + lnglat + ")";
                        if (status === 'complete' && result.regeocode) {
                            address = result.regeocode.formattedAddress;
                            $("#trackPolylineAddress").empty().text(address);
                            $("#trackPolylineAddress").parent("li").attr("title", address);
                        }
                    });
                    entityPolyLine.polyline.show = true;
                    entityPolyLine.gcj02_positions.push(Cesium.Cartesian3.fromDegrees(carInfo.longitude_gcj02, carInfo.latitude_gcj02, 1));
                    entityPolyLine.wgs84_positions.push(Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 1));
                    entityPolyLine._polyline.positions._value.push(Cesium.Cartesian3.fromDegrees(carInfo.longitude, carInfo.latitude, 1));
                }
            }
            //console.log(entity);
            entity.label.text = message.longitude + "," + message.latitude;
            let height = $.xmMapViewer.camera.positionCartographic.height;
            if (message.alarm_type_name) {
                if (height <= 12000) {
                    entity.label.text = "[" + message.vno + "]" + message.alarm_type_name;
                    entity.billboard.image = window.isLoad4k ? "/static/images/transport/error-active@2x.png" : "/static/images/transport/error-active@1x.png";
                } else {
                    entity.label.text = "";
                    entity.billboard.image = window.isLoad4k ? "/static/images/transport/error-active@1x.png" : "/static/images/transport/error-active@mini.png";
                }
            } else {
                if (height <= 12000) {
                    entity.label.text = "[" + message.vno + "]" + "行驶中...";
                    entity.billboard.image = window.isLoad4k ? "/static/images/transport/online@2x.png" : "/static/images/transport/online@1x.png";
                } else {
                    entity.label.text = "";
                    entity.billboard.image = window.isLoad4k ? "/static/images/transport/online@1x.png" : "/static/images/transport/online@mini.png";
                }
            }
        }
    }
}

//运力地图-车辆状态表初始化
function transportInitVehicleTable() {
    let onLinetBodyStr = '';
    let offLinetBodyStr = '';
    for (let prop in window.transportCarLocationMap) {
        let item = window.transportCarLocationMap[prop];
        if (item.status == "在线") {
            let trStr = "<tr car-status-row=" + item.terminal_sim + ">";
            trStr += "<td>" + item.vno + "</td>";
            trStr += "<td>" + item.status + "</td>";
            trStr += "<td>" + dayjs.unix(item.date).format('HH:mm:ss') + "</td>";
            trStr += "<td>" + "挂车" + "</td>";
            trStr += "<td>" + item.driver_name + "</td>";
            trStr + "</tr>";
            onLinetBodyStr += trStr;
        } else {
            let trStr = "<tr class='text-danger' car-status-row=" + item.terminal_sim + ">";
            trStr += "<td>" + item.vno + "</td>";
            trStr += "<td>" + item.status + "</td>";
            trStr += "<td>" + dayjs.unix(item.date).format('HH:mm:ss') + "</td>";
            trStr += "<td>" + "挂车" + "</td>";
            trStr += "<td>" + item.driver_name + "</td>";
            trStr + "</tr>";
            offLinetBodyStr += trStr;
        }
    }
    console.time("car->tbody");
    $("#transportVehicleTable>tbody").html(onLinetBodyStr + offLinetBodyStr);
    console.timeEnd("car->tbody");
    transportInitVehicleMark();
}

//运力地图-车辆状态表实时行更新
function transportVehicleTableUpdateRow(message, wgs84togcj02, status) {
    if (transportFilterWebSocketUpdate(message)) return;
    if (!window.transportCarLocationMap) return;
    if (!window.transportCarLocationMap.hasOwnProperty(message.terminal_sim)) {//没有就先忽略
        return;
        //没有就新增车辆
        // window.transportCarLocationMap[message.terminal_sim]={
        //     terminal_sim: message.terminal_sim,
        //     vno: message.vno,
        //     heading: message.heading,
        //     car_state: message.car_state,
        //     longitude: message.longitude,
        //     latitude: message.latitude,
        //     longitude_gcj02: wgs84togcj02[0],
        //     latitude_gcj02: wgs84togcj02[1],
        //     status: status,
        //     weight: "66t",
        //     overweight: "6t",
        //     obd_speed: message.obd_speed,
        //     speed: message.speed,
        //     date: message.gps_time,
        // };
        // if(item.status=="在线"){
        //     let trStr="<tr car-status-row="+message.terminal_sim+">";
        //     trStr+="<td>"+message.vno+"</td>";
        //     trStr+="<td>"+message.status+"</td>";
        //     trStr+="<td>"+dayjs.unix(message.date).format('HH:mm:ss')+"</td>";
        //     trStr+="<td>"+"挂车"+"</td>";
        //     trStr+="<td>"+"-"+"</td>";
        //     trStr+"</tr>";
        //     console.time("tbody");
        //     $("#transportVehicleTable>tbody").prepend(trStr);
        //     console.timeEnd("tbody");
        // }else{
        //     let trStr="<tr car-status-row="+message.terminal_sim+">";
        //     trStr+="<td>"+message.vno+"</td>";
        //     trStr+="<td>"+message.status+"</td>";
        //     trStr+="<td>"+dayjs.unix(message.date).format('HH:mm:ss')+"</td>";
        //     trStr+="<td>"+"挂车"+"</td>";
        //     trStr+="<td>"+"-"+"</td>";
        //     trStr+"</tr>";
        //     console.time("car->tbody");
        //     $("#transportVehicleTable>tbody").append(trStr);
        //     console.timeEnd("car->tbody");
        // }
    }
    let carStatusRow = window.transportCarLocationMap[message.terminal_sim];
    if (carStatusRow) {
        carStatusRow.date = message.gps_time;
        carStatusRow.heading = message.heading;
        carStatusRow.car_state = message.car_state;
        carStatusRow.longitude = message.longitude;
        carStatusRow.latitude = message.latitude;
        carStatusRow.longitude_gcj02 = wgs84togcj02[0];
        carStatusRow.latitude_gcj02 = wgs84togcj02[1];
        carStatusRow.vno = message.vno;
        carStatusRow.obd_speed = message.obd_speed;
        carStatusRow.speed = message.speed;
        if (carStatusRow.status == "在线" && status == "在线") {
            let trStr = "<td>" + carStatusRow.vno + "</td>";
            trStr += "<td>" + carStatusRow.status + "</td>";
            trStr += "<td>" + dayjs.unix(carStatusRow.date).format('HH:mm:ss') + "</td>";
            trStr += "<td>" + "挂车" + "</td>";
            trStr += "<td>"+carStatusRow.driver_name+"</td>";
            $("#transportVehicleTable>tbody tr[car-status-row='" + message.terminal_sim + "']").html(trStr);
        } else if (carStatusRow.status == "在线" && status == "离线") {
            carStatusRow.status = "离线";
            let trStr = "<tr class='text-danger' car-status-row=" + carStatusRow.terminal_sim + ">";
            trStr += "<td>" + carStatusRow.vno + "</td>";
            trStr += "<td>" + carStatusRow.status + "</td>";
            trStr += "<td>" + dayjs.unix(carStatusRow.date).format('HH:mm:ss') + "</td>";
            trStr += "<td>" + "挂车" + "</td>";
            trStr += "<td>"+carStatusRow.driver_name+"</td>";
            trStr + "</tr>";
            $("#transportVehicleTable>tbody tr[car-status-row='" + message.terminal_sim + "']").remove();
            $("#transportVehicleTable>tbody").append(trStr);
        } else if (carStatusRow.status == "离线" && status == "在线") {
            carStatusRow.status = "在线";
            let trStr = "<tr car-status-row=" + carStatusRow.terminal_sim + ">";
            trStr += "<td>" + carStatusRow.vno + "</td>";
            trStr += "<td>" + carStatusRow.status + "</td>";
            trStr += "<td>" + dayjs.unix(carStatusRow.date).format('HH:mm:ss') + "</td>";
            trStr += "<td>" + "挂车" + "</td>";
            trStr += "<td>"+carStatusRow.driver_name+"</td>";
            trStr + "</tr>";
            $("#transportVehicleTable>tbody tr[car-status-row='" + message.terminal_sim + "']").remove();
            $("#transportVehicleTable>tbody").prepend(trStr);
        } else if (carStatusRow.status === "离线" && status === "离线") {
            let trStr = "<td>" + carStatusRow.vno + "</td>";
            trStr += "<td>" + carStatusRow.status + "</td>";
            trStr += "<td>" + dayjs.unix(carStatusRow.date).format('HH:mm:ss') + "</td>";
            trStr += "<td>" + "挂车" + "</td>";
            trStr += "<td>"+carStatusRow.driver_name+"</td>";
            $("#transportVehicleTable>tbody tr[car-status-row='" + message.terminal_sim + "']").html(trStr);
        }
    }
}

//运力地图-车辆状态表-单击事件
function transportVehicleTableRowEventHandler() {
    let terminal_sim = $(this).attr("car-status-row");
    let row = window.transportCarLocationMap[terminal_sim];
    //console.log("transportVehicleTableRowEventHandler",row);
    // 移动炫酷
    let entity = $.xmMapViewer.entities.getById(terminal_sim);
    if (window.prevTrackPolyLineId == null) {
        window.prevTrackPolyLineId = terminal_sim + "_polyline";
    } else {
        $.xmMapViewer.entities.removeById(window.prevTrackPolyLineId);
        window.prevTrackPolyLineId = terminal_sim + "_polyline";
    }
    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        $.xmMapViewer.entities.add({
            id: window.prevTrackPolyLineId,
            wgs84_positions: [],
            gcj02_positions: [],
            gcj02_position: Cesium.Cartesian3.fromDegrees(row.longitude_gcj02, row.latitude_gcj02, 1),
            wgs84_position: Cesium.Cartesian3.fromDegrees(row.longitude, row.latitude, 1),
            position: Cesium.Cartesian3.fromDegrees(row.longitude_gcj02, row.longitude_gcj02, 1),
            point: {
                show: true,
                color: Cesium.Color.YELLOW
            },
            polyline: {
                show: true,
                positions: [],
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: Cesium.Color.YELLOW
                }),
                width: 5
            }
        });
        $.xmMapViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(row.longitude_gcj02, row.latitude_gcj02, 15000.0)
        });
    } else {
        $.xmMapViewer.entities.add({
            id: window.prevTrackPolyLineId,
            wgs84_positions: [],
            gcj02_positions: [],
            gcj02_position: Cesium.Cartesian3.fromDegrees(row.longitude_gcj02, row.latitude_gcj02, 1),
            wgs84_position: Cesium.Cartesian3.fromDegrees(row.longitude, row.latitude, 1),
            position: Cesium.Cartesian3.fromDegrees(row.longitude, row.latitude, 1),
            point: {
                show: true,
                color: Cesium.Color.YELLOW
            },
            polyline: {
                show: true,
                positions: [],
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: Cesium.Color.YELLOW
                }),
                width: 5
            }
        });
        $.xmMapViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(row.longitude, row.latitude, 15000.0)
        });
    }
    const lnglat = row.longitude_gcj02 + "," + row.latitude_gcj02;
    window.AMapGeocoder.getAddress(lnglat, function (status, result) {
        let address = "未知地址(" + lnglat + ")"
        if (status === 'complete' && result.regeocode) {
            address = result.regeocode.formattedAddress;
        }
        $("#vehicleDetialTipsUl").empty()
            .append("<li><span>车牌号：</span>" + row.vno + "</li>")
            .append("<li><span>当前车速：</span><i id='trackPolylineSpeed'>" + (row.obd_speed || 0) + "km/s</i></li>")
            .append("<li title=" + address + "><span>当前位置：</span><i id='trackPolylineAddress'>" + address + "</i></li>");
        $("#queryTrack").data("vno", row.vno);
        $("#queryTrack").data("sim", row.terminal_sim);
        $("#vehicleDetial").data("vno", row.vno);
        $("#vehicleDetial").data("sim", row.terminal_sim);
        let cartesian2 = Cesium.SceneTransforms.wgs84ToWindowCoordinates($.xmMapViewer.scene, entity.position._value);
        trajectoryTracking.picked = entity;
        trajectoryTracking.tipsCartesian2 = cartesian2;
        //临时加入视频直播
        if(row.car_videos){
            $("#audioDetail").css({display: "inline-block"});
            $("#audioDetail").data("vno", row.vno);
            $("#audioDetail").data("sim", row.terminal_sim);
        }else{
            $("#audioDetail").css({display: "none"});
        }
        $("#vehicleDetialTips").css({
            display: "block",
            top: entity.position.y - 341 + (window.isLoad4k ? 0 : 200) + 'px',
            left: entity.position.x + 'px'
        });
    });
}

//运力地图-车辆报警表实时行更新
function transportAlarmableUpdateRow(message, wgs84togcj02, status) {
    if (!message.alarm_type_name) return;
    let id = message.vno + "_" + message.alarm_type_name;
    if (!window.transportCarAlarmMap) return;
    if (!window.transportCarAlarmMap.hasOwnProperty(id)) {
        //没有就新增对应车辆报警信息
        let row = {
            id: id,
            sim: message.terminal_sim,
            vno: message.vno,
            device_no: message.device_no,
            timestamp: message.timestamp,
            partition_date: message.partition_date,
            car_alarm_count: message.car_alarm_count,
            gps_time: message.gps_time,
            coordinate: {
                longitude: message.longitude,
                latitude: message.latitude
            },
            wgs84_coordinate: {
                longitude: wgs84togcj02[0],
                latitude: wgs84togcj02[1]
            },
            speed: message.speed,
            obd_speed: message.obd_speed,
            heading: message.heading,
            address: message.address,
            alarm_type: message.alarm_type,
            alarm_state: message.alarm_state,
            alarm_type_name: message.alarm_type_name,
            alarm_data: message.alarm_data
        };
        window.transportCarAlarmMap[id] = row;
        let trStr = "<tr car-alarm-row=" + row.id + ">";
        trStr += "<td>" + row.vno + "</td>";
        trStr += "<td>" + dayjs.unix(row.gps_time).format('HH:mm:ss') + "</td>";
        trStr += "<td>" + transportAlarmTypeNameFormatter(row.alarm_type_name) + "</td>";
        trStr += "<td>" + transportAlarmTypeAddressFormatter(row.address) + "</td>";
        trStr + "</tr>";
        $("#tableWarning>tbody").prepend(trStr);
    } else {
        let carAlarmRow = window.transportCarAlarmMap[id];
        carAlarmRow.vno = message.vno;
        carAlarmRow.device_no = message.device_no;
        carAlarmRow.timestamp = message.timestamp;
        carAlarmRow.partition_date = message.partition_date;
        carAlarmRow.car_alarm_count = message.car_alarm_count;
        carAlarmRow.gps_time = message.gps_time;
        carAlarmRow.coordinate = {
            longitude: message.longitude,
            latitude: message.latitude
        },
            carAlarmRow.wgs84_coordinate = {
                longitude: wgs84togcj02[0],
                latitude: wgs84togcj02[1]
            };
        carAlarmRow.speed = message.speed;
        carAlarmRow.obd_speed = message.obd_speed;
        carAlarmRow.heading = message.heading;
        carAlarmRow.address = message.address;
        carAlarmRow.alarm_type = message.alarm_type;
        carAlarmRow.alarm_state = message.alarm_state;
        carAlarmRow.alarm_type_name = message.alarm_type_name;
        carAlarmRow.alarm_data = message.alarm_data;
        let tdStr = "<td>" + carAlarmRow.vno + "</td>";
        tdStr += "<td>" + dayjs.unix(carAlarmRow.gps_time).format('HH:mm:ss') + "</td>";
        tdStr += "<td>" + transportAlarmTypeNameFormatter(carAlarmRow.alarm_type_name) + "</td>";
        tdStr += "<td>" + transportAlarmTypeAddressFormatter(carAlarmRow.address) + "</td>";
        $("#tableWarning>tbody tr[car-alarm-row='" + id + "']").html(tdStr);
    }
}

//运力地图-车辆报警表单机事件
function transportAlarmTableRowEventHandler() {
    let carAlarmTypeName = $(this).attr("car-alarm-row");
    let row = window.transportCarAlarmMap[carAlarmTypeName];
    //console.log("car_alarm_row", row);
    //实体车牌号+报警标志+上报时间
    let entityId = row.vno + "alarm" + row.gps_time;
    if (window.coordinateType.seleced === window.coordinateType.gcj02) {
        $.xmMapViewer.entities.add({
            id: entityId,
            gcj02_position: Cesium.Cartesian3.fromDegrees(row.coordinate.longitude, row.coordinate.latitude, 1),
            wgs84_position: Cesium.Cartesian3.fromDegrees(row.wgs84_coordinate.longitude, row.wgs84_coordinate.latitude, 1),
            position: Cesium.Cartesian3.fromDegrees(row.wgs84_coordinate.longitude, row.wgs84_coordinate.latitude, 1),
            label: {
                font: '12px sans-serif',
                scale: 1.0,
                text: "[" + row.vno + "]\n" + row.alarm_type_name + '\n' + (row.address || "未获取到当前地址"),
                width: 3,
                style: Cesium.LabelStyle.FILL,
                fillColor: Cesium.Color.AQUA,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0.0, -30),
                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
            },
            billboard: {
                image: window.isLoad4k ? "/static/images/transport/error-active@2x.png" : "/static/images/transport/error-active@1x.png"
            }
        });
        $.xmMapViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(row.coordinate.longitude, row.coordinate.latitude, 6000)
        });
    } else {
        $.xmMapViewer.entities.add({
            id: entityId,
            gcj02_position: Cesium.Cartesian3.fromDegrees(row.coordinate.longitude, row.coordinate.latitude, 1),
            wgs84_position: Cesium.Cartesian3.fromDegrees(row.wgs84_coordinate.longitude, row.wgs84_coordinate.latitude, 1),
            position: Cesium.Cartesian3.fromDegrees(row.wgs84_coordinate.longitude, row.wgs84_coordinate.latitude, 1),
            label: {
                font: '10px sans-serif',
                scale: 1.0,
                text: "[" + row.vno + "]\n" + row.alarm_type_name + '\n' + (row.address || "未获取到当前地址"),
                width: 3,
                style: Cesium.LabelStyle.FILL,
                fillColor: Cesium.Color.AQUA,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0.0, -30),
                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
            },
            billboard: {
                image: window.isLoad4k ? "/static/images/transport/error-active@2x.png" : "/static/images/transport/error-active@1x.png"
            }
        });
        $.xmMapViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(row.wgs84_coordinate.longitude, row.wgs84_coordinate.latitude, 6000)
        });
    }
}

//运力地图-车辆报警表格式化器
function transportAlarmTypeNameFormatter(alarmTypeNameValue) {
    let spanStr = '';
    switch (alarmTypeNameValue) {
        case "GPS模块故障报警":
        case "FLASH故障报警":
        case "CAN模块故障报警":
        case "3D传感器故障报警":
        case "RTC模块故障报警":
        case "系统启动":
        case "定位过长报警":
        case "终端拔出报警":
        case "终端插入报警":
            spanStr = '<span class="text-warning" style="width: ' + (window.isLoad4k ? "140px" : "70px") + ';margin: 0;padding: 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden" >' + alarmTypeNameValue + "</span>";
            break;
        case "碰撞报警":
        case "水温报警":
        case "拖车报警":
        case "低电压报警":
            spanStr = '<span class="text-success" style="width: ' + (window.isLoad4k ? "140px" : "70px") + ';margin: 0;padding: 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden" >' + alarmTypeNameValue + "</span>";
            break;
        case "怠速过长报警":
        case "点火上报":
        case "熄火上报":
        case "急加速报警":
        case "急减速报警":
        case "急拐弯报警":
        case "疲劳驾驶报警":
        case "超速报警":
            spanStr = '<span class="text-danger" style="width: ' + (window.isLoad4k ? "140px" : "70px") + ';margin: 0;padding: 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden" >' + alarmTypeNameValue + "</span>";
            break;
        case "总线不睡眠报警":
        case "油耗不支持报警":
        case "OBD不支持报警":
            spanStr = '<span class="text-purple" style="width: ' + (window.isLoad4k ? "140px" : "70px") + ';margin: 0;padding: 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden" >' + alarmTypeNameValue + "</span>";
            break;
        default:
            spanStr = '<span class="text-pink"  style="width: ' + (window.isLoad4k ? "140px" : "70px") + ';margin: 0;padding: 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden" >' + alarmTypeNameValue + "</span>";
            break;
    }
    return spanStr;
}

//运力地图-车辆报警表格式化器
function transportAlarmTypeAddressFormatter(addressValue) {
    let spanStr = addressValue;
    spanStr = '<p style="width: ' + (window.isLoad4k ? "140px" : "70px") + ';margin: 0;padding: 0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden" title="' + addressValue + '"> ' + (addressValue || "-") + '</p>';
    return spanStr;
}

//运力地图-过滤掉一些实时更新状态
function transportFilterWebSocketUpdate(message) {
    let filter = ["排放报警"]
    for (let index = 0; index < filter.length; index++) {
        const element = filter[index];
        if (element == message.alarm_type_name) {
            return true;
        }
    }
}

//运力地图-图表配置
function transportInitChart() {
    // 图表配置
    let pieOptions = {
        credits: {
            enabled: false // 禁用版权信息
        },
        chart: {
            style: {
                fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
            },
            backgroundColor: 'transparent',
            type: 'pie',
            margin: [0, 0, 50, 0],
            options3d: {
                enabled: true,
                alpha: window.isLoad4k ? 45 : 25,
                beta: 0,
                back: {
                    color: '颜色',
                    size: 1
                },
                bottom: {
                    color: '颜色',
                    size: 1
                },
                side: {
                    color: '颜色',
                    size: 1
                }
            }
        },
        colors: Highcharts.map(['#C91AE9', '#25A0F4', '#45E4A6', '#F9CD33', '#E46045', '#3FB1EF', '#162ABF'], function (color) {
            return {
                radialGradient: {cx: 0.5, cy: 0.3, r: 0.7},
                stops: [
                    [0, color],
                    // [1, color] // darken
                    [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
                ]
            }
        }),
        title: {
            text: ''
        },
        tooltip: {
            style: {
                'fontSize': window.isLoad4k ? '17px' : '12px',
                'fontWeight': 'bold',
                'whiteSpace': 'nowrap'
            },
            headerFormat: '<span style="font-size: 14px;>{point.key}</span><br/>',
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: window.isLoad4k ? 50 : 25,
                dataLabels: {
                    enabled: true,
                    inside: true,
                    distance: window.isLoad4k ? 10 : 5,
                    useHTML: true,
                    format: '{y}%',
                    style: {
                        color: '#eee',
                        fontSize: window.isLoad4k ? '24px' : '14px',
                        textOutline: 'none',
                        fontWeight: '600'
                    }
                },
                center: ['50%', '50%'],
                showInLegend: true
            }
        },
        legend: {
            width: window.isLoad4k ? 480 : 240,
            align: 'left',
            layout: 'horizontal',
            // margin: [50, 0, 0, 0],
            padding: window.isLoad4k ? 3 : 2,
            symbolPadding: window.isLoad4k ? 15 : 7,//图例与文字之间的间距
            itemMarginTop: window.isLoad4k ? 5 : 2,
            itemMarginBottom: window.isLoad4k ? 5 : 2,
            itemWidth: window.isLoad4k ? 150 : 105,
            itemStyle: {
                fontSize: window.isLoad4k ? '24px' : '12px',
                lineHeight: window.isLoad4k ? '20px' : '10px',
                color: '#B5C4D0',
                fontWeight: '500'
            },
            itemHoverStyle: {
                color: '#fff'
            }

        },
        series: [{
            type: 'pie',
            name: '车辆状态占比',
            colorByPoint: true,
            data: [
                {
                    name: '自卸车',
                    y: 13.8
                },
                {
                    name: '四桥平板',
                    y: 22.5
                },
                {
                    name: '拖挂车',
                    y: 56.8
                },
                {
                    name: '新型渣土车',
                    y: 4.0
                },
                {
                    name: '混凝土搅拌车',
                    y: 2.9
                }
            ]
        }]
    };
    // 图表初始化函数
    let chart = Highcharts.chart('pieCharts', pieOptions);
    let pieOptions1 = {
        credits: {
            enabled: false // 禁用版权信息
        },
        chart: {
            style: {
                fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
            },
            backgroundColor: 'transparent',
            type: 'pie',
            margin: [0, 0, 50, 0],
            options3d: {
                enabled: true,
                alpha: window.isLoad4k ? 45 : 25,
                beta: 0,
                back: {
                    color: '颜色',
                    size: 1
                },
                bottom: {
                    color: '颜色',
                    size: 1
                },
                side: {
                    color: '颜色',
                    size: 1
                }
            }
        },
        colors: Highcharts.map(['#C91AE9', '#25A0F4', '#45E4A6', '#F9CD33', '#E46045', '#3FB1EF', '#162ABF'], function (color) {
            // console.log(Highcharts.Color(color).brighten(-0.3).get('rgb'));
            return {
                radialGradient: {cx: 0.5, cy: 0.3, r: 0.7},
                stops: [
                    [0, color],
                    // [1, color] // darken
                    [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
                ]
            }
        }),
        title: {
            text: ''
        },
        tooltip: {
            style: {
                'fontSize': window.isLoad4k ? '17px' : '12px',
                'fontWeight': 'bold',
                'whiteSpace': 'nowrap'
            },
            headerFormat: '<span style="font-size: 14px;>{point.key}</span><br/>',
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br/>{point.name}数:{point.y}'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: window.isLoad4k ? 50 : 25,
                dataLabels: {
                    enabled: true,
                    inside: true,
                    distance: window.isLoad4k ? 10 : 5,
                    useHTML: true,
                    format: '{percentage:.1f}%',
                    style: {
                        color: '#eee',
                        fontSize: window.isLoad4k ? '24px' : '14px',
                        textOutline: 'none',
                        fontWeight: '600'
                    }
                },
                center: ['50%', '50%'],
                showInLegend: true
            }
        },
        legend: {
            width: window.isLoad4k ? 480 : 240,
            align: 'left',
            layout: 'horizontal',
            // margin: [50, 0, 0, 0],
            padding: window.isLoad4k ? 3 : 2,
            symbolPadding: window.isLoad4k ? 15 : 7,//图例与文字之间的间距
            itemMarginTop: window.isLoad4k ? 5 : 2,
            itemMarginBottom: window.isLoad4k ? 5 : 2,
            itemWidth: window.isLoad4k ? 150 : 105,
            itemStyle: {
                fontSize: window.isLoad4k ? '24px' : '12px',
                lineHeight: window.isLoad4k ? '20px' : '10px',
                color: '#B5C4D0',
                fontWeight: '500'
            },
            itemHoverStyle: {
                color: '#fff'
            }

        },
        series: [{
            type: 'pie',
            name: '车辆状态占比',
            colorByPoint: true,
            data: []
        }]
    };
    axios.post(
        window.BASE_URL + '/JT808WebApi/Vehicle/QueryVehicleStatusStatistics'
    ).then((response) => {
        if (response.data) {
            pieOptions1.series[0].data = response.data;
            Highcharts.chart('pieCharts2', pieOptions1);
        }
        loadCenterPointAndFlyTo();
    }).catch((error) => {
        console.error(error);
    });
    let barOptions = {
        tooltip: {
            // show:false,
            formatter: function (obj) {
                return obj.seriesName + ':<br>' + obj.name
            }
        },
        legend: {
            show: false
        },
        visualMap: {
            show: false,
            max: 20,
            inRange: {
                color: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#abd9e9', '#e0f3f8', '#74add1', '#4575b4']
            }
        },
        geo: {
            roam: true
        },
        xAxis3D: {
            show: false,
        },
        yAxis3D: {
            show: false,
        },
        zAxis3D: {
            show: false,
        },
        grid3D: {
            show: false,
            top: 100,
            boxWidth: 35,
            boxHeight: 35,
            boxDepth: 30,
            viewControl: {
                rotateSensitivity: 1,  // 不能旋转
                zoomSensitivity: 1, // 不能缩放
                autoRotate: false, //是否开启自动3d 旋转
                maxDistance: 100, //最大的值 （默认400）
                minDistance: 100 //是距离 最小值 （默认40） 与最大值相等时 则不能够放大与缩小
            },
            light: {
                main: {
                    intensity: 1.2,
                    shadow: true
                },
                ambient: {
                    intensity: 0.3
                }
            }
        },
        series: [{
            type: 'bar3D',
            name: '车辆报警类型统计',
            data: [],
            shading: 'lambert',
            label: {
                textStyle: {
                    fontSize: 16,
                    borderWidth: 0
                },
                // formatter: function(obj) {
                //     return obj.name;
                // }
            },
            // emphasis: {
            //     label: {
            //         textStyle: {
            //             fontSize: 20,
            //             color: '#900'
            //         }
            //     },
            //     itemStyle: {
            //         color: '#900'
            //     }
            // }
        }]

    };
    
    // editor by yang (2020-07-06)
    // // 基于准备好的dom，初始化echarts实例
    // let myChart = echarts.init(document.getElementById('barCharts'));
    // axios.post(
    //     window.BASE_URL + '/JT808WebApi/Alarm/QueryWeekAlarmStatistics'
    // ).then((response) => {
    //     if (response.data) {
    //         barOptions.series[0].data = response.data;
    //         // 绘制图表
    //         myChart.setOption(barOptions, true);
    //     }
    // }).catch((error) => {
    //     console.error(error);
    // });

    // setTimeout(function () {
    //     window.onresize = function () {
    //         myChart.resize();
    //     }
    // }, 200)
}

//运力地图-查询分段轨迹
function transportQuerySegmentTrack(clock) {
    let timeOffset = Cesium.JulianDate.secondsDifference(clock.currentTime, clock.startTime);
    let transportTrakLoadDom = $("#transportTrakLoad>div");
    //console.log(timeOffset);
    //console.log(window.segmentTrack.timeOffset-30);
    //console.log((window.segmentTrack.timeOffset-30)<timeOffset);
    if ((window.segmentTrack.timeOffset - 30) < timeOffset) {
        //已完成加载
        //如果状态失败就跳过
        if (window.segmentTrack.successed) {
            transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").hide();
            transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").eq(4).show();
        }
        if (window.segmentTrack.index >= (window.segmentTrack.days.length - 1)) {
            //重播
            //$.xmMapViewer.clock.currentTime = $.xmMapViewer.clock.startTime;
            //$.xmMapViewer.clock.shouldAnimate = true;
            //let ds=$.xmMapViewer.dataSources.getByName("track")[0];
            //console.log("VehicleLength",ds.entities.values.length);
            return;
        }
        window.segmentTrack.index++;
        window.segmentTrack.timeOffset = 999999;
        transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").hide();
        transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").eq(1).show();
        axios.post(window.BASE_URL + '/JT808WebApi/Vehicle/QueryTrackBySimOrVno', {
            "vno": window.segmentTrack.vno,
            "sim": window.segmentTrack.sim,
            "start_time": window.segmentTrack.days[window.segmentTrack.index].start,
            "end_time": window.segmentTrack.days[window.segmentTrack.index].end
            //"start_time": "2020-01-05 00:00:00",
            //"end_time": "2020-01-05 23:59:59"
        }).then((response) => {
            if (response.data.length > 0) {
                //debugger
                let ellipsoid = $.xmMapViewer.scene.globe.ellipsoid;
                let ds = $.xmMapViewer.dataSources.getByName("track")[0];
                let entity = ds.entities.getById("Vehicle");
                //console.log("VehicleLength",ds.entities.values.length);
                for (let i = 0; i < response.data.length; i++) {
                    let item = response.data[i];
                    let cartographic = null;
                    if (window.coordinateType.seleced === window.coordinateType.gcj02) {
                        cartographic = Cesium.Cartographic.fromDegrees(item.longitude_gcj02, item.latitude_gcj02, 1);
                    } else {
                        cartographic = Cesium.Cartographic.fromDegrees(item.longitude, item.latitude, 1);
                    }
                    let position = ellipsoid.cartographicToCartesian(cartographic);
                    let time = Cesium.JulianDate.addSeconds(window.segmentTrack.startTime, i + window.segmentTrack.prevTimeOffset, new Cesium.JulianDate());
                    entity.position.addSample(time, position);
                    ds.entities.add({
                        position: position,
                        point: {
                            pixelSize: 3,
                            color: Cesium.Color.TRANSPARENT,
                            outlineColor: Cesium.Color.YELLOW,
                            outlineWidth: 1
                        }
                    });
                }
                window.segmentTrack.prevTimeOffset += response.data.length;
                window.segmentTrack.timeOffset = window.segmentTrack.prevTimeOffset;
                window.segmentTrack.successed = true;
                transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").hide();
                transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").eq(0).show();
            } else {
                if (window.segmentTrack.index >= (window.segmentTrack.days.length - 1)) {
                    //重播
                    //$.xmMapViewer.clock.currentTime=$.xmMapViewer.clock.startTime;
                    //$.xmMapViewer.clock.shouldAnimate = true;
                    window.segmentTrack.timeOffset = 999999
                } else {
                    window.segmentTrack.timeOffset = 0;
                }
                window.segmentTrack.successed = false;
                transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").hide();
                transportTrakLoadDom.eq(window.segmentTrack.index).children("strong").eq(3).show();
            }
        }).catch((error) => {
            if (window.segmentTrack.index >= (window.segmentTrack.days.length - 1)) {
                //重播
                //$.xmMapViewer.clock.currentTime=$.xmMapViewer.clock.startTime;
                //$.xmMapViewer.clock.shouldAnimate = true;
                window.segmentTrack.timeOffset = 999999
            } else {
                window.segmentTrack.timeOffset = 0;
            }
            window.segmentTrack.successed = false;
            $("#transportTrakLoad>div").eq(window.segmentTrack.index).children("strong").hide();
            $("#transportTrakLoad>div").eq(window.segmentTrack.index).children("strong").eq(5).show();
        });
    }
}

//运力地图-获取车辆详情
function transportGetCarDetail() {
    axios.post(
        window.BASE_URL + '/JT808WebApi/Vehicle/GetCarInfoDetialByVno', {"vno": $("#queryTrack").data("vno")}
    ).then((response) => {
        if (response.data) {
            let carInfo = response.data;
            $(".info").find('[name="vno"]').text(carInfo.vno);
            $(".info").find('[name="vin"]').text(carInfo.driving_license_info.vin);
            $(".info").find('[name="engine_no"]').text(carInfo.driving_license_info.engine_no || '无');
            $(".info").find('[name="car_type"]').text(carInfo.driving_license_info.car_type || '无');
            $(".info").find('[name="use_property"]').text(carInfo.driving_license_info.use_property || '无');
            $(".info").find('[name="brand"]').text(carInfo.driving_license_info.brand || '无');
            $(".info").find('[name="registration_date"]').text(dayjs(carInfo.driving_license_info.registration_date).format('YYYY-MM-DD HH:mm:ss') || '无');
            $(".info").find('[name="licence_issued"]').text(dayjs(carInfo.driving_license_info.licence_issued).format('YYYY-MM-DD HH:mm:ss') || '无');
            $(".info").find('[name="owner"]').text(carInfo.driving_license_info.owner || '无');
            $(".info").find('[name="address"]').text(carInfo.driving_license_info.address || '无');
            $(".info").find('[name="company"]').text(carInfo.company || '无');
        }
    }).catch((error) => {
        console.error(error);
    });

    axios.post(
        window.BASE_URL + '/JT808WebApi/Vehicle/GetCarPhotosByVno', {"vno": $("#queryTrack").data("vno")}
    ).then((response) => {
        if (response.data.length > 0) {
            if (response.data.length == 1) {
                $(".info .right #car1").attr('src', response.data[0].data_base64);
                $(".info .right #car2").attr('src', (window.isLoad4k ? "static/images/empty1@2x.jpg" : "static/images/empty1.jpg") + "?t=" + Math.random());
            } else if (response.data.length >= 2) {
                $(".info .right #car1").attr('src', response.data[0].data_base64);
                $(".info .right #car2").attr('src', response.data[1].data_base64);
            }
        } else {
            $(".info .right #car1").attr('src', (window.isLoad4k ? "static/images/empty1@2x.jpg" : "static/images/empty1.jpg") + "?t=" + Math.random());
            $(".info .right #car2").attr('src', (window.isLoad4k ? "static/images/empty2@2x.jpg" : "static/images/empty2.jpg") + "?t=" + Math.random());
        }
        $(".spinner").siblings('div').removeClass('hide').end().hide();
    }).catch((error) => {
        console.error(error);
        $(".spinner").siblings('div').removeClass('hide').end().hide();
    });
}

//运力地图-获取车辆详情30day
function transportGetPast30Chart() {
    //console.log("QueryMileageStatistics",$("#vehicleDetial").data("sim"));
    axios.post(
        window.BASE_URL + '/JT808WebApi/Statistics/QueryMileageStatistics', {"sim": $("#vehicleDetial").data("sim"),"day": 30}
    ).then((response) => {
        if (response.data) {
            Highcharts.chart('past-30-days-chart-mileage', {
                credits: {
                    enabled: false // 禁用版权信息
                },
                chart: {
                    zoomType: 'xy',
                    backgroundColor: 'transparent',
                },
                title: {
                    text: '车辆近30天行驶里程',
                    style: {
                        fontSize: window.isLoad4k ? '30px' : '15px',
                        color: '#fff'
                    }
                },
                xAxis: [{
                    categories:response.data.dates,
                    crosshair: true,
                    labels: {
                        style: {
                            color: '#fff',
                            fontSize: window.isLoad4k ? '16px' : '12px',
                        }
                    },
                }],
                yAxis: [{ // Secondary yAxis
                    title: {
                        style: {
                            color: '#ffffff',
                            fontSize: window.isLoad4k ? '24px' : '12px',
                        },
                        align: 'high',
                        offset: window.isLoad4k ? -60 : -30,
                        text: '行驶时间',
                        rotation: 0,
                        y: window.isLoad4k ? -40 : -20
                    },
                    labels: {
                        format: '{value} h',
                        style: {
                            color: '#fff',
                            fontSize: window.isLoad4k ? '18px' : '12px',
                        }
                    },
                    opposite: true,
                    lineColor: '#DCDCDC',
                    lineWidth: 1,
                    gridLineColor: '#DCDCDC',
                    max: 24,
                }, { // Primary yAxis
                    labels: {
                        format: '{value} km',
                        style: {
                            color: '#fff',
                            fontSize: window.isLoad4k ? '18px' : '12px',
                        }
                    },
                    title: {
                        style: {
                            color: '#ffffff',
                            fontSize: window.isLoad4k ? '24px' : '12px',
                        },
                        align: 'high',
                        offset: window.isLoad4k ? 60 :30,
                        text: '行驶里程',
                        rotation: 0,
                        y: window.isLoad4k ? -40 : -20,
                        x: window.isLoad4k ? 70 : 35,
                    },
                    lineColor: '#DCDCDC',
                    lineWidth: 1,
                    gridLineColor: '#DCDCDC',
                }],
                tooltip: {
                    shared: true
                },
                legend: {
                    x: window.isLoad4k ? 120 : 60,
                    y: window.isLoad4k ? 100 : 50,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                },
                series: [{
                    name: '行驶里程',
                    type: 'column',
                    yAxis: 1,
                    data: response.data.day_km_mileages,
                    tooltip: {
                        valueSuffix: ' km'
                    },
                    color: {
                        linearGradient: {x1: 0, y1: 1, x2: 0, y2: 0}, //纵向渐变效果,如果y1和y2值交换，渐变颜色逆向（2017年所示）
                        stops: [
                            [0, '#666666'], //起点0
                            [1, '#0e97ff']	//终点1
                        ]
                    }
                }, {
                    name: '行驶时间',
                    type: 'spline',
                    data: response.data.day_drive_hours,
                    tooltip: {
                        valueSuffix: ' h'
                    },
                    color: '#00FF9C'
                }]
            });
            Highcharts.chart('past-30-days-chart-oil', {
                credits: {
                    enabled: false // 禁用版权信息
                },
                chart: {
                    zoomType: 'xy',
                    backgroundColor: 'transparent',
                },
                title: {
                    text: '车辆近30天油耗',
                    style: {
                        fontSize: window.isLoad4k ? '30px' : '15px',
                        color: '#fff'
                    }
                },
                xAxis: [{
                    categories:response.data.dates,
                    crosshair: true,
                    labels: {
                        style: {
                            color: '#fff',
                            fontSize: window.isLoad4k ? '16px' : '12px',
                        }
                    },
                }],
                yAxis: [{ // Secondary yAxis
                    title: {
                        style: {
                            color: '#ffffff',
                            fontSize: window.isLoad4k ? '24px' : '12px',
                        },
                        align: 'high',
                        offset: window.isLoad4k ? -40 : -30,
                        text: '总油耗',
                        rotation: 0,
                        y: window.isLoad4k ? -40 : -20
                    },
                    labels: {
                        format: '{value} L',
                        style: {
                            color: '#fff',
                            fontSize: window.isLoad4k ? '18px' : '12px',
                        }
                    },
                    opposite: true,
                    lineColor: '#DCDCDC',
                    lineWidth: 1,
                    gridLineColor: '#DCDCDC'
                }, { // Primary yAxis
                    labels: {
                        format: '{value} L/100km',
                        style: {
                            color: '#fff',
                            fontSize: window.isLoad4k ? '18px' : '12px',
                        }
                    },
                    title: {
                        style: {
                            color: '#ffffff',
                            fontSize: window.isLoad4k ? '24px' : '12px',
                            // width:'220px'
                        },
                        align: 'high',
                        offset: window.isLoad4k ? -80 : -40,
                        text: '百公里油耗',
                        rotation: 0,
                        y: window.isLoad4k ? -40 : -20,
                        x: window.isLoad4k ? -140 : -70,
                    },
                    lineColor: '#DCDCDC',
                    lineWidth: 1,
                    gridLineColor: '#DCDCDC',
                }],
                tooltip: {
                    shared: true
                },
                legend: {
                    x: window.isLoad4k ? 120 : 60,
                    y: window.isLoad4k ? 100 : 50,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                },
                series: [{
                    name: '百公里油耗',
                    type: 'column',
                    yAxis: 1,
                    data: response.data.day_100km_l_oil,
                    tooltip: {
                        valueSuffix: '[L/100km]'
                    },
                    color: {
                        linearGradient: {x1: 0, y1: 1, x2: 0, y2: 0}, //纵向渐变效果,如果y1和y2值交换，渐变颜色逆向（2017年所示）
                        stops: [
                            [0, '#666666'], //起点0
                            [1, '#e83e8c']	//终点1
                        ]
                    }
                },{
                    name: '总油耗',
                    type: 'spline',
                    data: response.data.day_device_l_oil,
                    tooltip: {
                        valueSuffix: ' [L]'
                    },
                    color: '#00FF9C'
                }]
            });
        }
    }).catch((error) => {
        console.error(error);
    });
}

//运力地图-事件绑定
function transportBindEvent() {
    //运力地图-地图底图切换事件绑定
    transportSwitchiImageryBindEvent();
    //运力地图-轨迹查询事件绑定
    transportTrackQueryBindEvent();
    //运力地图-停车追踪事件绑定
    transportParkingPointBindEvent();
    //运力地图-实时视频事件绑定
    transportTempVideoBindEvent();
    //运力地图-车辆状态表格单机行事件
    $("#transportVehicleTable").on("click", "tbody tr", transportVehicleTableRowEventHandler);
    //运力地图-车辆报警表格单机行事件
    $("#tableWarning").on("click", "tbody tr", transportAlarmTableRowEventHandler);
    //运力地图-车辆详情
    $('#vehicleDetialModal').on('show.bs.modal', function (e) {
        $("#vehicleDetialTips").hide();
        transportGetCarDetail();
        transportGetPast30Chart();
    });
    //运力地图-模糊查询车辆
    $("#vnoKeywords").keydown(function (event) {
        if (event.keyCode === 13) {
            axios.post(
                window.BASE_URL + '/JT808WebApi/Vehicle/GetCarLocationToMap', {"vno": $("#vnoKeywords").val()}
            ).then((response) => {
                if (response.data) {
                    window.transportCarLocationMap = response.data;
                    $.xmMapViewer.entities.removeAll();
                    //运力地图-车辆状态表初始化
                    transportInitVehicleTable();
                }
                loadCenterPointAndFlyTo();
            }).catch((error) => {
                console.error(error);
            });
        }
    });
   /*  $("#vnoVideo").on('click',function(){
        if ($(this).prop("checked")) {

        } else {

        }
        //console.log(($(this).prop("checked")));
    }); */
   
    $("#vnoSearch").on('change', function (e) {
        var parameter={"vno": ""};
        if(e.target.value=='all'){

        }else if(e.target.value=='video'){
            parameter.car_video=0;
        }else if(e.target.value=='insurance'){
            parameter.car_insure=1;
        }
        axios.post(
            window.BASE_URL + '/JT808WebApi/Vehicle/GetCarLocationToMap', parameter
        ).then((response) => {
            if (response.data) {
                window.transportCarLocationMap = response.data;
                //运力地图-车辆状态表初始化
                $.xmMapViewer.entities.removeAll();
                transportInitVehicleTable();
            }
        }).catch((error) => {
            console.error(error);
        });
    });
    //运力地图-tips关闭按钮
    $("#vehicleDetialTipsClose").on('click', function () {
        if (window.prevTrackPolyLineId != null) {
            $.xmMapViewer.entities.removeById(window.prevTrackPolyLineId);
            window.prevTrackPolyLineId = null;
        }
        $.xmMapViewer.trackedEntity = undefined;
    });
}

//运力地图-地图底图切换事件绑定
function transportSwitchiImageryBindEvent() {
    //地图底图切换
    $("#switchImageryProvider1").on('click', function () {
        window.coordinateType.seleced = window.coordinateType.gcj02;
        $.xmMapViewer.imageryLayers.removeAll();
        $.xmMapViewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
            url: constant.ARCGIS
        }));
        $(this).siblings("button").removeClass("active").end().addClass("active");
        updatePrimitives();
        transportUpdateVehicleMark();
    });
    $("#switchImageryProvider2").on('click', function () {
        window.coordinateType.seleced = window.coordinateType.wgs84;
        $.xmMapViewer.imageryLayers.removeAll();
        let img__cia_LayerProvider = new Cesium.WebMapTileServiceImageryProvider({//调用影响中文注记服务
            url: constant.TDT_CIA_C,
            layer: 'constant.TDT_CIA_C',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
            maximumLevel: 16,
            show: true
        });
        $.xmMapViewer.imageryLayers.addImageryProvider(img_c_LayerProvider);
        $.xmMapViewer.imageryLayers.addImageryProvider(img__cia_LayerProvider);
        $(this).siblings("button").removeClass("active").end().addClass("active");
        transportUpdateVehicleMark();
        updatePrimitives();
    });
    $("#switchImageryProvider3").on('click', function () {
        window.coordinateType.seleced = window.coordinateType.wgs84;
        $.xmMapViewer.imageryLayers.removeAll();
        let vec_cLayerProvider = new Cesium.WebMapTileServiceImageryProvider({
            url: constant.TDT_VEC_C,
            layer: 'tdtVec_c',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            credit: new Cesium.Credit('天地图矢量服务'),
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            maximumLevel: 16,
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
        });
        let cva_cLayerProvider = new Cesium.WebMapTileServiceImageryProvider({//调用影响中文注记服务
            url: constant.TDT_CVA_C,
            layer: 'tdtCva_c',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
            maximumLevel: 16,
            show: true
        });
        $.xmMapViewer.imageryLayers.addImageryProvider(vec_cLayerProvider);
        $.xmMapViewer.imageryLayers.addImageryProvider(cva_cLayerProvider);
        $(this).siblings("button").removeClass("active").end().addClass("active");
        transportUpdateVehicleMark();
        updatePrimitives();
    });
}

//运力地图-轨迹查询事件绑定
function transportTrackQueryBindEvent() {
    //运力地图-轨迹查询
    $('#queryTrackBtn').on('click', function (e) {
        $("#queryTrackErrorMsg").text();
        if (!window.TrackStartDateTime || !window.TrackEndDateTime) {
            $("#queryTrackErrorMsg").text("请先选择时间噢！");
            return;
        }
        $('#queryTrackBtn').attr("disabled", true);
        $("#trackQueryTime").text(window.TrackStartDateTime + ' - ' + window.TrackEndDateTime);
        window.segmentTrack.days = [];
        {
            let start = dayjs(window.TrackStartDateTime);
            let end = dayjs(window.TrackEndDateTime);
            if (start.format("YYYYMMDD") === end.format("YYYYMMDD")) {//当天
                window.segmentTrack.days.push({
                    start: start.format("YYYY-MM-DD HH:mm:ss"),
                    end: end.format("YYYY-MM-DD HH:mm:ss")
                });
            } else {
                //跨天
                let day = end.diff(start, 'day');
                for (let index = 0; index <= day; index++) {
                    if (index === 0) {
                        window.segmentTrack.days.push({
                            start: start.format('YYYY-MM-DD HH:mm:ss'),
                            end: start.format("YYYY-MM-DD 23:59:59")
                        });
                    } else if (index === day) {
                        window.segmentTrack.days.push({
                            start: end.format("YYYY-MM-DD 00:00:00"),
                            end: end.format("YYYY-MM-DD HH:mm:ss")
                        });
                    } else {
                        window.segmentTrack.days.push({
                            start: start.add(index, "day").format("YYYY-MM-DD 00:00:00"),
                            end: start.add(index, "day").format("YYYY-MM-DD 23:59:59")
                        });
                    }
                }
            }
            $("#transportTrakLoad").empty();
            for (let index = 0; index < window.segmentTrack.days.length; index++) {
                const element = window.segmentTrack.days[index];
                let loadHtml = '<div class="alert alert-success  fade show" role="alert">';
                if (index === 0) {
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-check"></i>  已加载：</strong>';
                    loadHtml += ' <strong> <i class="fa fa-spinner fa-pulse"></i>  加载中：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-clock-o"></i>  待加载：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-close"></i>  无数据：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-check"></i>  已完成：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-exclamation-triangle"></i>  加载异常：</strong>';
                } else {
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-check"></i>  已加载：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-spinner fa-pulse"></i>  加载中：</strong>';
                    loadHtml += ' <strong> <i class="fa fa-clock-o"></i>  待加载：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-close"></i>  无数据：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-check"></i>  已完成：</strong>';
                    loadHtml += ' <strong style="display:none;"> <i class="fa fa-exclamation-triangle"></i>  加载异常：</strong>';
                }
                loadHtml += '<span>' + element.start + ' - ' + element.end + '</span>';
                loadHtml += '</div>';
                $("#transportTrakLoad").append(loadHtml);
            }
        }
        const vno = $("#queryTrack").data("vno");
        const sim = $("#queryTrack").data("sim");

        axios.post(
            window.BASE_URL + '/JT808WebApi/Vehicle/GetCarInfoDetialByVno', {"vno": vno}
        ).then((response) => {
            if (response.data) {
                let carInfo = response.data;
                $("#vehicleTrackTipsUl").empty()
                    .append("<li><span>车牌号：</span>" + carInfo.vno + "</li>")
                    .append("<li><span>物流企业：</span>" + carInfo.company || '无' + "/h</li>")
                    .append("<li><span>识别代码：</span>" + carInfo.driving_license_info.vin + "</li>")
                    .append("<li><span>发动机号：</span>" + carInfo.driving_license_info.engine_no || '无' + "</li>")
                    .append("<li><span>车辆类型：</span>" + carInfo.driving_license_info.car_type || '无' + "</li>");
            }
        }).catch((error) => {
            console.error(error);
        });
        // $("#transportTrakLoad>div").eq(0).children("strong").hide();
        // $("#transportTrakLoad>div").eq(0).children("strong").eq(3).show();
        window.segmentTrack.index = 0;
        window.segmentTrack.vno = vno;
        window.segmentTrack.sim = sim;
        axios.post(window.BASE_URL + '/JT808WebApi/Vehicle/QueryTrackBySimOrVno', {
            "vno": window.segmentTrack.vno,
            "sim": window.segmentTrack.sim,
            "start_time": window.segmentTrack.days[window.segmentTrack.index].start,
            "end_time": window.segmentTrack.days[window.segmentTrack.index].end
            //"start_time": "2020-01-05 00:00:00",
            //"end_time": "2020-01-05 23:59:59"
        }).then((response) => {
            let start = Cesium.JulianDate.fromDate(new Date());
            let stop = Cesium.JulianDate.addSeconds(start, 9999999, new Cesium.JulianDate());
            $.xmMapViewer.clock.startTime = start.clone();
            $.xmMapViewer.clock.currentTime = start.clone();
            $.xmMapViewer.clock.stopTime = stop.clone();
            $.xmMapViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
            $.xmMapViewer.clock.multiplier = 1;
            $.xmMapViewer.clock.onTick.addEventListener(transportQuerySegmentTrack);
            window.segmentTrack.startTime = start.clone();
            let ellipsoid = $.xmMapViewer.scene.globe.ellipsoid;
            let ds = new Cesium.CustomDataSource('track');
            window.segmentTrack.ds = ds;
            let property = new Cesium.SampledPositionProperty();
            window.segmentTrack.prevTimeOffset = 0;
            if (response.data.length > 0) {
                window.segmentTrack.timeOffset = response.data.length;
                window.segmentTrack.prevTimeOffset = response.data.length;
                window.segmentTrack.successed = true;
                $("#transportTrakLoad>div").eq(0).children("strong").hide();
                $("#transportTrakLoad>div").eq(0).children("strong").eq(1).show();
                for (let i = 0; i < response.data.length; i++) {
                    let item = response.data[i]
                    let cartographic = null;
                    if (window.coordinateType.seleced === window.coordinateType.gcj02) {
                        cartographic = Cesium.Cartographic.fromDegrees(item.longitude_gcj02, item.latitude_gcj02, 1);
                    } else {
                        cartographic = Cesium.Cartographic.fromDegrees(item.longitude, item.latitude, 1);
                    }
                    let position = ellipsoid.cartographicToCartesian(cartographic);
                    let time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
                    property.addSample(time, position);
                    //// 打点
                    ds.entities.add({
                        position: position,
                        point: {
                            pixelSize: 3,
                            color: Cesium.Color.TRANSPARENT,
                            outlineColor: Cesium.Color.YELLOW,
                            outlineWidth: 1
                        }
                    });
                }
                $("#transportTrakLoad>div").eq(0).children("strong").hide();
                $("#transportTrakLoad>div").eq(0).children("strong").eq(0).show();
            } else {
                window.segmentTrack.timeOffset = 0;
                window.segmentTrack.successed = false;
                $("#transportTrakLoad>div").eq(0).children("strong").hide();
                $("#transportTrakLoad>div").eq(0).children("strong").eq(3).show();
            }
            let entities = ds.entities.add({
                id: 'Vehicle',
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: start.clone(),
                    stop: stop.clone()
                })]),
                position: property,
                orientation: new Cesium.VelocityOrientationProperty(property),
                model: {
                    uri: window.BASE_URL_LIBS+'/gltf/car.glb',
                    minimumPixelSize: 100,
                    maximumScale: 500
                },
                viewFrom: new Cesium.Cartesian3(-2080, -1715, 779), //设置视角
                path: {
                    resolution: 3,//采样点每秒1个
                    material:
                        new Cesium.PolylineGlowMaterialProperty({
                            glowPower: 0.1,
                            color: Cesium.Color.YELLOW
                        }),
                    width: 10,
                    show: true
                }
            });
            if (!$.xmMapViewer.trackedEntity) {
                $.xmMapViewer.trackedEntity = $.xmMapViewer.vehicleTrackedEntity = entities;
            }
            $.xmMapViewer.dataSources.add(ds);
        }).catch((error) => {
            window.segmentTrack.timeOffset = 0;
            window.segmentTrack.successed = false;
            $("#transportTrakLoad>div").eq(0).children("strong").hide();
            $("#transportTrakLoad>div").eq(0).children("strong").eq(5).show();
            console.log(error);
        });
        //显示Tips
        $("#vehicleTrackTips").show();
        //显示工具栏
        $(".tool-video").show();
        //隐藏弹框
        $('#trackModal').modal('hide');
        //隐藏头部
        $(".header").hide();
        //隐藏左右
        $('.transport').hide();
        $('#queryTrackBtn').attr("disabled", false);
        $("#vehicleDetialTips").hide();
    });
    //运力地图-退出轨迹查询
    $("#exitTrack").click(function () {
        //轨迹查询退出需要清理资源
        $.xmMapViewer.dataSources.removeAll();
        $.xmMapViewer.clock.onTick.removeEventListener(transportQuerySegmentTrack);
        //$.xmMapViewer.dataSources.remove($.xmMapViewer.dataSources.getByName("track"),true);
        $.xmMapViewer.vehicleTrackedEntity = undefined;
        $.xmMapViewer.trackedEntity = undefined;
        $('.transport').show();
        $(".header").show();
        $("#vehicleTrackTips").hide();
        $(".tool-video").hide();
        $("#queryTrackErrorMsg").text();
        loadCenterPointAndFlyTo();
        initYunNanArea();
    });
    //运力地图-轨迹倍数播放
    $("#trackMultiplier").inputSpinner();
    //运力地图-轨迹倍数播放
    $("#trackMultiplier").on("change", function (event) {
        $.xmMapViewer.clock.multiplier = $(this).val();
    });
    //运力地图-轨迹摄像机模式
    $("#viewAircraft").click(function () {
        $.xmMapViewer.trackedEntity = $.xmMapViewer.vehicleTrackedEntity;
        console.log($.xmMapViewer.trackedEntity.position);
        $(this).css('display', 'none');
        $("#cancelviewAircraft").css('display', 'initial');
    });
    //运力地图-轨迹取消摄像机模式
    $("#cancelviewAircraft").click(function () {
        $.xmMapViewer.trackedEntity = undefined;
        $(this).css('display', 'none');
        $("#viewAircraft").css('display', 'initial');
    });
    //运力地图-轨迹弹框
    $('#trackModal').on('show.bs.modal', function (e) {

    });
    $('#trackModal').on('hide.bs.modal', function (e) {

    });
    //运力地图-轨迹时间范围
    $('#reportrange').daterangepicker({
        startDate: moment().startOf('day'),  //这里配置的起止时间将会决定在ranges中默认选中哪个时间段
        endDate: moment(),  //这里配置的起止时间将会决定在ranges中默认选中哪个时间段,如果不配置起止时间,则默认展示为今天
        minDate: '01/01/2012', //最小时间
        maxDate: moment(), //最大时间
        dateLimit: {
            days: 30
        }, //起止时间的最大间隔
        showDropdowns: true,
        showWeekNumbers: false, //是否显示第几周
        timePicker: true, //是否显示小时和分钟
        timePickerIncrement: 60, //时间的增量，单位为分钟
        timePicker12Hour: false, //是否使用12小时制来显示时间
        ranges: {
            '今日': [moment().subtract('days', 0).startOf('day'), moment()],
            '昨日': [moment().subtract('days', 1).startOf('day'), moment().subtract('days', 1).endOf('day')],
            '最近2日': [moment().subtract('days', 1).startOf('day'), moment().endOf('day')],
            '最近3日': [moment().subtract('days', 2).startOf('day'), moment().endOf('day')],
            '最近7日': [moment().subtract('days', 6).startOf('day'), moment().endOf('day')]
        },
        opens: 'right', //日期选择框的弹出位置
        buttonClasses: ['btn btn-default'],
        applyClass: 'btn-small btn-primary blue',
        cancelClass: 'btn-small',
        format: 'YYYY-MM-DD HH:mm:ss', //控件中from和to 显示的日期格式
        separator: ' to ',
        locale: {
            applyLabel: '确定',
            cancelLabel: '取消',
            fromLabel: '起始时间',
            toLabel: '结束时间',
            customRangeLabel: '自定义',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月',
                '七月', '八月', '九月', '十月', '十一月', '十二月'],
            firstDay: 1
        }
    }, function (start, end, label) {//格式化日期显示框
        $('#reportrange span.startDate').html(start.format('YYYY-MM-DD HH:mm:ss'));
        $('#reportrange span.endDate').html(end.format('YYYY-MM-DD HH:mm:ss'));
    });
    //运力地图-轨迹时间范围
    $('#reportrange').on('apply.daterangepicker', function (ev, picker) {
        window.TrackStartDateTime = picker.startDate.format('YYYY-MM-DD HH:mm:ss');
        window.TrackEndDateTime = picker.endDate.format('YYYY-MM-DD HH:mm:ss');
    });
}

//运力地图-停车追踪事件绑定
function transportParkingPointBindEvent() {
    //运力地图-轨迹查询
    window.ParkingDuration=5;
    $('#parkingPointModalBtn').on('click', function (e) {
        $("#parkingPointModalErrorMsg").text("");
        if (!window.ParkingStartDateTime || !window.ParkingEndDateTime) {
            $("#parkingPointModalErrorMsg").text("请先选择时间噢！");
            return;
        }
        $('#parkingPointModalBtn').attr("disabled", true);
        const sim = $("#queryTrack").data("sim");
        const vno = $("#queryTrack").data("vno");
        axios.post(
            window.BASE_URL + '/JT808WebApi/Statistics/QueryStopPointStatistics', {
                "sim": sim,
                "startTime":window.ParkingStartDateTime,
                "endTime":window.ParkingEndDateTime,
                "durationMinute":parseInt(window.ParkingDuration)
            }
        ).then((response) => {
            if (response.data && response.data.length>0) {
                if(window.parkingDataSource){
                    $.xmMapViewer.dataSources.remove(window.parkingDataSource,true);
                }
                window.parkingDataSource = new Cesium.CustomDataSource('parkingDataSource');
                for(let i=0;i<response.data.length;i++){
                    const element= response.data[i];
                    let text='【'+ vno+ '】' +'停车信息：\n\n';
                    text+='时间：'+element.start_time+' - '+element.end_time+'\n\n';
                    text+='地点：'+element.address+'\n\n';
                    text+='时长：' + (element.duration_seconds / 60.0).toFixed(1) + '分钟';
                    if (window.coordinateType.gcj02 === window.coordinateType.seleced) {
                        window.parkingDataSource.entities.add({
                            gcj02_position: coordinateToPosition(element.gcj02_coordinate,1),
                            wgs84_position: coordinateToPosition(element.wgs84_coordinate,1),
                            position: coordinateToPosition(element.wgs84_coordinate,1),
                            label: new Cesium.LabelGraphics({
                                scale: .8, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                text: text,
                                font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                verticalOrigin: Cesium.VerticalOrigin.TOP,
                                pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                showBackground:true,
                                backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                backgroundPadding:new Cesium.Cartesian2(15, 15),
                                disableDepthTestDistance:false,
                            })
                        });
                    }else{
                        window.parkingDataSource.entities.add({
                            gcj02_position: coordinateToPosition(element.gcj02_coordinate,1),
                            wgs84_position: coordinateToPosition(element.wgs84_coordinate,1),
                            position: coordinateToPosition(element.gcj02_coordinate,1),
                            label: new Cesium.LabelGraphics({
                                scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                text: text,
                                font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                verticalOrigin: Cesium.VerticalOrigin.TOP,
                                pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                showBackground:true,
                                backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                backgroundPadding:new Cesium.Cartesian2(15, 15),
                                disableDepthTestDistance:false,
                            })
                        });
                    }
                }
                $.xmMapViewer.dataSources.add(window.parkingDataSource);
                //隐藏弹框
                $('#parkingPointModal').modal('hide');
                $("#parkingPointModalErrorMsg").text("");
            }else{

                $("#parkingPointModalErrorMsg").text("暂无停车数据,请重新选择");
            }
            $('#parkingPointModalBtn').attr("disabled", false);
        }).catch((error) => {
            console.error(error);
            $('#parkingPointModalBtn').attr("disabled", false);
            $("#parkingPointModalErrorMsg").text("");
        });
    });
    //运力地图-停车时长
    $("#parkingPointMultiplier").inputSpinner();
    //运力地图-停车时长
    $("#parkingPointMultiplier").on("change", function (event) {
        window.ParkingDuration=$(this).val();
    });
    //运力地图-停车点弹框
    $('#parkingPointModal').on('show.bs.modal', function (e) {
        $("#parkingPointModalErrorMsg").text("");
    });
    $('#parkingPointModal').on('hide.bs.modal', function (e) {
        $("#parkingPointModalErrorMsg").text("");
    });
    //运力地图-停车时间范围
    $('#parkingPointReportrange').daterangepicker({
        startDate: moment().startOf('day'),  //这里配置的起止时间将会决定在ranges中默认选中哪个时间段
        endDate: moment(),  //这里配置的起止时间将会决定在ranges中默认选中哪个时间段,如果不配置起止时间,则默认展示为今天
        minDate: '01/01/2012', //最小时间
        maxDate: moment(), //最大时间
        dateLimit: {
            days: 30
        }, //起止时间的最大间隔
        showDropdowns: true,
        showWeekNumbers: false, //是否显示第几周
        timePicker: true, //是否显示小时和分钟
        timePickerIncrement: 60, //时间的增量，单位为分钟
        timePicker12Hour: false, //是否使用12小时制来显示时间
        ranges: {
            '今日': [moment().subtract('days', 0).startOf('day'), moment()],
            '昨日': [moment().subtract('days', 1).startOf('day'), moment().subtract('days', 1).endOf('day')],
            '最近2日': [moment().subtract('days', 1).startOf('day'), moment().endOf('day')],
            '最近3日': [moment().subtract('days', 2).startOf('day'), moment().endOf('day')],
            '最近7日': [moment().subtract('days', 6).startOf('day'), moment().endOf('day')]
        },
        opens: 'right', //日期选择框的弹出位置
        buttonClasses: ['btn btn-default'],
        applyClass: 'btn-small btn-primary blue',
        cancelClass: 'btn-small',
        format: 'YYYY-MM-DD HH:mm:ss', //控件中from和to 显示的日期格式
        separator: ' to ',
        locale: {
            applyLabel: '确定',
            cancelLabel: '取消',
            fromLabel: '起始时间',
            toLabel: '结束时间',
            customRangeLabel: '自定义',
            daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月',
                '七月', '八月', '九月', '十月', '十一月', '十二月'],
            firstDay: 1
        }
    }, function (start, end, label) {//格式化日期显示框
        $('#parkingPointReportrange span.startDate').html(start.format('YYYY-MM-DD HH:mm:ss'));
        $('#parkingPointReportrange span.endDate').html(end.format('YYYY-MM-DD HH:mm:ss'));
    });
    //运力地图-停车时间范围
    $('#parkingPointReportrange').on('apply.daterangepicker', function (ev, picker) {
        window.ParkingStartDateTime = picker.startDate.format('YYYY-MM-DD HH:mm:ss');
        window.ParkingEndDateTime = picker.endDate.format('YYYY-MM-DD HH:mm:ss');
    });
}

//运力地图-实时视频事件绑定
function transportTempVideoBindEvent() {
    $('#audioModal').draggable({
        cancel: "#myPlayer,.form-row"
    });
    //运力地图-视频播放
    $('#audioDetail').on('click', function () {
        $('#audioModal').show(300, function () {
            $("#vehicleDetialTips").hide();
            var videoVno = $("#audioDetail").data("vno");
            var sim = $("#audioDetail").data("sim");
            $('#audioModal .title').text(videoVno);
            var car_videos = window.transportCarLocationMap[sim].car_videos;
            var hdStr = '';
            for (var i = 0; i < car_videos.length; i++) {
                hdStr += car_videos[i].hd + ",";
            }
            hdStr = hdStr.substr(0, hdStr.length - 1);
            //临时视频播放
            try {
                window.player = new EZUIKit.EZUIPlayer({
                    id: 'myPlayer',
                    autoplay: true,
                    url: hdStr,
                    accessToken: window.YSYAccessToken,
                    decoderPath: '/static/libs',
                    width: window.isLoad4k ? 1200 : 600,
                    height: window.isLoad4k ? 800 : 400,
                    splitBasis: 2, // 1*1 2*2 3*3 4*4
                });
                window.player.play({});
            } catch (err) {
                console.log(err);
            }
        });
    });
    $('#audioModal .close').on('click', function (e) {
        //弹框隐藏
        $('#audioModal').hide();
        // 结束
        try {
            if (window.player) {
                window.player.stop(0);
                window.player.stop(1);
            }
        } catch (err) {
            console.log(err);
        }
    });
    // $("#jinyin").click(function(){
    //     axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/SetCameraVideoSoundStatus', {
    //         "device_serial": deviceID,
    //         "enable": window.soundStatus ? '1' : '0'
    //     }).then((response) => {
    //         let jinyinDom = $("#jinyin");
    //         if (window.soundStatus) {
    //             jinyinDom.addClass('xm-bofangzhong');
    //             jinyinDom.attr('title', '有声');
    //         } else {
    //             jinyinDom.addClass('xm-bofang');
    //             jinyinDom.attr('title', '无声');
    //         }
    //     });
    // });
    // $("#direation-up").click(function () {
    //     axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStart', {
    //         "device_serial": deviceID,
    //         "channelNo": channelID,
    //         "direction": 0, //操作命令：0-上，1-下，2-左，3-右，4-左上，5-左下，6-右上，7-右下，8-放大，9-缩小，10-近焦距，11-远焦距
    //         "speed": 1, //云台速度：0-慢，1-适中，2-快，海康设备参数不可为0
    //         "command": 2 //镜像方向：0-上下, 1-左右, 2-中心
    //     }).then((response) => {
    //         axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStop', {
    //             "device_serial": deviceID,
    //             "channelNo": channelID,
    //             "direction": 0
    //         }).then((response) => {
    //             // if(window.soundStatus) {
    //             //   $("#jinyin").addClass('xm-bofangzhong');
    //             //   $("#jinyin").attr('title','有声');
    //             // }else{
    //             //     $("#jinyin").addClass('xm-bofang');
    //             //     $("#jinyin").attr('title','无声');
    //             // }
    //         });
    //     });
    // });
    // $("#direation-down").click(function () {
    //     axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStart', {
    //         "device_serial": deviceID,
    //         "channelNo": channelID,
    //         "direction": 1, //操作命令：0-上，1-下，2-左，3-右，4-左上，5-左下，6-右上，7-右下，8-放大，9-缩小，10-近焦距，11-远焦距
    //         "speed": 1, //云台速度：0-慢，1-适中，2-快，海康设备参数不可为0
    //         "command": 2 //镜像方向：0-上下, 1-左右, 2-中心
    //     }).then((response) => {
    //         axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStop', {
    //             "device_serial": deviceID,
    //             "channelNo": channelID,
    //             "direction": 1
    //         }).then((response) => {
    //             // if(window.soundStatus) {
    //             //   $("#jinyin").addClass('xm-bofangzhong');
    //             //   $("#jinyin").attr('title','有声');
    //             // }else{
    //             //     $("#jinyin").addClass('xm-bofang');
    //             //     $("#jinyin").attr('title','无声');
    //             // }
    //         });
    //     });
    // });
    // $("#direation-left").click(function () {
    //     axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStart', {
    //         "device_serial": deviceID,
    //         "channelNo": channelID,
    //         "direction": 2, //操作命令：0-上，1-下，2-左，3-右，4-左上，5-左下，6-右上，7-右下，8-放大，9-缩小，10-近焦距，11-远焦距
    //         "speed": 1, //云台速度：0-慢，1-适中，2-快，海康设备参数不可为0
    //         "command": 2 //镜像方向：0-上下, 1-左右, 2-中心
    //     }).then((response) => {
    //         axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStop', {
    //             "device_serial": deviceID,
    //             "channelNo": channelID,
    //             "direction": 2
    //         }).then((response) => {
    //             // if(window.soundStatus) {
    //             //   $("#jinyin").addClass('xm-bofangzhong');
    //             //   $("#jinyin").attr('title','有声');
    //             // }else{
    //             //     $("#jinyin").addClass('xm-bofang');
    //             //     $("#jinyin").attr('title','无声');
    //             // }
    //         });
    //     });
    // });
    // $("#direation-right").click(function () {
    //     axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStart', {
    //         "device_serial": deviceID,
    //         "channelNo": channelID,
    //         "direction": 3, //操作命令：0-上，1-下，2-左，3-右，4-左上，5-左下，6-右上，7-右下，8-放大，9-缩小，10-近焦距，11-远焦距
    //         "speed": 1, //云台速度：0-慢，1-适中，2-快，海康设备参数不可为0
    //         "command": 2 //镜像方向：0-上下, 1-左右, 2-中心
    //     }).then((response) => {
    //         axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/DevicePtzStop', {
    //             "device_serial": deviceID,
    //             "channelNo": channelID,
    //             "direction": 3
    //         }).then((response) => {
    //             // if(window.soundStatus) {
    //             //   $("#jinyin").addClass('xm-bofangzhong');
    //             //   $("#jinyin").attr('title','有声');
    //             // }else{
    //             //     $("#jinyin").addClass('xm-bofang');
    //             //     $("#jinyin").attr('title','无声');
    //             // }
    //         });
    //     });
    // });
    // $("#direation-stop").click(function () {
    //     try {
    //         if (window.player) {
    //             window.player.stop();
    //         }
    //     } catch (err) {
    //         console.log(err);
    //     }
    // });
    // $("#direation-play").click(function () {
    //     try {
    //         let source = document.createElement('source');
    //         source.src = "rtmp://rtmp01open.ys7.com/openlive/8d1c8848b22941b982755769dbc6bafc.hd";
    //         source.type = "rtmp/flv";
    //         document.getElementById("myPlayer").appendChild(source);
    //         window.player = new EZuikit.EZUIPlayer('myPlayer');
    //         window.player.play();
    //     } catch (err) {
    //         console.log(err);
    //     }
    // });
    // $("#video-normal").click(function () {
    //     try {
    //         window.player.stop();
    //         let source = document.createElement('source');
    //         source.src = "rtmp://rtmp01open.ys7.com/openlive/8d1c8848b22941b982755769dbc6bafc";
    //         source.type = "rtmp/flv";
    //         document.getElementById("myPlayer").appendChild(source);
    //         window.player = new EZuikit.EZUIPlayer('myPlayer');
    //         window.player.play();
    //     } catch (err) {
    //         console.log(err);
    //     }
    // });
    // $("#video-hight").click(function () {
    //     try {
    //         window.player.stop();
    //         let source = document.createElement('source');
    //         source.src = "rtmp://rtmp01open.ys7.com/openlive/8d1c8848b22941b982755769dbc6bafc.hd";
    //         source.type = "rtmp/flv";
    //         document.getElementById("myPlayer").appendChild(source);
    //         window.player = new EZuikit.EZUIPlayer('myPlayer');
    //         window.player.play();
    //     } catch (err) {
    //         console.log(err);
    //     }
    // });

    //获取音频声音状态
    // function GetCameraVideoSoundStatus() {
    //     axios.post(window.BASE_URL + '/JT808WebApi/YSSDK/GetCameraVideoSoundStatus', {
    //         "device_serial": deviceID
    //     }).then((response) => {
    //         window.soundStatus = response.data;
    //         let jinyinDom = $("#jinyin");
    //         if (response.data) {
    //             jinyinDom.addClass('xm-bofangzhong');
    //             jinyinDom.attr('title', '有声');
    //         } else {
    //             jinyinDom.addClass('xm-bofang');
    //             jinyinDom.attr('title', '无声');
    //         }
    //     });
    // }

    $('#audio-datetime').daterangepicker({
        opens:'left',
        timePicker: true,
        timePicker24Hour: true,
        locale: {
            format:'YYYY-MM-DD hh:mm:ss'
        }
    }, function(start, end, label) {
        $('#audio-datetime').data("start",start.format('YYYYMMDDHHmmss'));
        $('#audio-datetime').data("end",end.format('YYYYMMDDHHmmss'));
    });

    $('#queryAudio').on('click',(e)=>{
        var videoVno=$("#audioDetail").data("vno");
        var sim = $("#audioDetail").data("sim");
        var car_videos = window.transportCarLocationMap[sim].car_videos;
        var hdStr='';
        var backUrl="ezopen://open.ys7.com/{1}/1.rec?begin={2}&end={3}";
        for(var i=0;i<car_videos.length;i++){
            var tmp=backUrl.replace("{1}",car_videos[i].channelId)
                           .replace("{2}", $('#audio-datetime').data("start"))
                           .replace("{3}", $('#audio-datetime').data("end"))
            hdStr+=tmp+",";
        }
        hdStr=hdStr.substr(0,hdStr.length-1);
        try {
            if (window.player) {
                window.player.stop(0);
                window.player.stop(1);
            }
        } catch (err) {
            console.log(err);
        }
        //临时视频播放
        try {
            window.player = new EZUIKit.EZUIPlayer({
                id: 'myPlayer',
                autoplay: true,
                url: hdStr,
                accessToken: window.YSYAccessToken,
                decoderPath: '/static/libs',
                width: window.isLoad4k ? 1200 : 600,
                height: window.isLoad4k ? 800 : 400,
                splitBasis: 2,
            });
            window.player.play({});
        } catch (err) {
            console.log(err);
        }
    });
}

//运力地图-定时语音播报报警信息
function transportTimer() {
    window.AlarmVoiceArray = [];
    window.AlarmVoiceLock = true;
    setInterval(() => {
        setTimeout(()=>{
            let audioDom = document.getElementById("transportAlarmVoice");
            if (audioDom.ended) {
                let url = window.AlarmVoiceArray.shift();
                if (url) {
                    audioDom.src = url;
                    audioDom.load();
                    audioDom.play();
                    window.AlarmVoiceLock = false;
                } else {
                    window.AlarmVoiceLock = true;
                }
            } else {
                if (window.AlarmVoiceLock) {
                    let url = window.AlarmVoiceArray.shift();
                    if (url) {
                        audioDom.src = url;
                        audioDom.load();
                        audioDom.play();
                        window.AlarmVoiceLock = false;
                    } else {
                        window.AlarmVoiceLock = true;
                    }
                }
            }
        },35000);
    }, 45000);
}

//运力地图 -右键菜单
function transportLoadRightMenu(e) {
    let eText = [{
        text: "清除停车点",
        type: 'transport_clear_parking_points'
    }];
    let con, lis = '';
    for (let i = 0; i < eText.length; i++) {
        lis += `<li class="li-item" data-index="` + i + `"  data-type="` + eText[i].type + `"> ` + eText[i].text + ` </li>`;
    }
    con = `<ul class="contextmenu-ul">` + lis + `</ul>`;
    transportRemoveRightDom();
    let div = null;
    div = document.createElement('div');
    div.className = "contextmenu";
    div.style.top = e.position.y + 'px';
    div.style.left = e.position.x + 'px';
    div.style.position = 'fixed';
    div.innerHTML = con;
    cesiumContainer.append(div);
    $(".contextmenu-ul").on('click', "li", function (e) {
        let type = $(this).data('type');
        transportRightLiClick(type);
        e.stopPropagation();
    });
    $(document).on('click', ':not(.contextmenu-ul)', function () {
        transportRemoveRightDom();
        return;
    })
}

function transportRemoveRightDom() {
    let div = document.querySelectorAll(".contextmenu");
    if (div.length !== 0) {
        cesiumContainer.removeChild(div[0])
    }
}

function transportRightLiClick(type) {
    transportRemoveRightDom();
    switch (type) {
        case 'transport_clear_parking_points':
            if(window.parkingDataSource){
                $.xmMapViewer.dataSources.remove(window.parkingDataSource,true);
            }
            break;
    }
}

/********************************************************************************************************/
/*******************************************运力地图结束**************************************************/
/********************************************************************************************************/

/********************************************************************************************************/
/*******************************************物流地图开始**************************************************/
/********************************************************************************************************/

//物流地图-物流联盟地图初始化
function logisticsInitCompany() {
    let coordinate = coordtransform.wgs84togcj02(102.56640672589998, 24.380873368750965);
    let wgs84_coordinate = {
        longitude: coordinate[0],
        latitude: coordinate[1]
    };
    wgs84_coordinate.longitude = coordinate[0];
    wgs84_coordinate.latitude = coordinate[1];
    let gcj02_coordinate = Cesium.Cartographic.fromDegrees(coordinate[0], coordinate[1]);
    let centerPoint = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(gcj02_coordinate);
    $.xmMapViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(102.56640672589998, 24.380873368750965, 15000.0)
    });
    $.xmMapViewer.entities.add({
        id: '小马国炬',
        // wgs84_position:coordinateToPosition(wgs84_coordinate),
        // gcj02_position:coordinateToPosition(gcj02_coordinate),
        position: centerPoint,
        label: new Cesium.LabelGraphics({
            scale: 1,
            text: '小马国炬',
            font: window.isLoad4k ? '32px sans-serif' : '24px sans-serif',
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP
        }),
        billboard: {
            image: window.isLoad4k ? '/static/images/logistics/cyclization@2x.png' : '/static/images/logistics/cyclization.png'
        }
    });
    axios.get('/static/json/logisticsLeagueCompany.json').then((response) => {
        if (response.data) {
            $.xmMapViewer.entities.suspendEvents();
            response.data.map((point, index) => {
                let typeImage = index % 2;
                let trailImage = window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png";
                let billboardImage = window.isLoad4k ? "/static/images/logistics/wllm-icon" + (typeImage + 1) + "@2x.png" : "/static/images/logistics/wllm-icon" + (typeImage + 1) + ".png";
                let material = new Cesium.PolylineTrailMaterialProperty({
                    color: Cesium.Color.GREEN,
                    duration: 3000,
                    trailImage: trailImage
                });
                let wgs84togcj02 = coordtransform.wgs84togcj02(point.lon, point.lat);
                let cartographic = Cesium.Cartographic.fromDegrees(wgs84togcj02[0], wgs84togcj02[1], 0);
                let endPoint = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
                window.logisticsCompany[point.name] = {
                    longitude_gcj02: wgs84togcj02[0],
                    latitude_gcj02: wgs84togcj02[1]
                };
                $.xmMapViewer.entities.add({
                    id: point.name,
                    clickType: "company",
                    position: endPoint,
                    billboard: {
                        image: billboardImage
                    }
                });
                $.xmMapViewer.entities.add({
                    polyline: {
                        positions: logisticsGenerateCurve(centerPoint, endPoint),
                        width: point.level,
                        material: material
                    }
                });
            });
            $.xmMapViewer.entities.resumeEvents();
        }
    })
}

//物流地图-运输路线地图初始化
function logisticsInitRoute() {
    axios.post(window.BASE_URL + '/JT808WebApi/Route/GetRoutes').then((response) => {
        if (response.data) {
            let tbodStr = '';
            response.data.map((item) => {
                let trStr = "<tr route-id=" + item.id + ">";
                trStr += "<td><p style=''>" + item.origin_name + "</p></td>";
                trStr += "<td><p style=''>" + item.destination_name + "</p></td>";
                trStr += "<td><p style=''>" + item.goods_type + "</p></td>";
                trStr += "<td>" + (item.distance / 1000.0).toFixed(1) + "公里</td>";
                trStr += "<td>" + (item.duration / 3600.0).toFixed(1) + "小时</td>";
                trStr + "</tr>";
                tbodStr += trStr;
            });
            $("#logisticsRouteCount").html(response.data.length);
            $("#logisticsTypeTable>tbody").html(tbodStr);
        }
    }).catch((error) => {
        console.log(error);
    });
    $.xmMapViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(102.543907, 24.350461, 6000),
        orientation: {
            heading: Cesium.Math.toRadians(20.0),
            pitch: Cesium.Math.toRadians(-35.0),
            roll: 0
        }
    });
}

//物流地图-服务客户地图初始化
function logisticsInitCustomerService() {
    let wgs84togcj02 = coordtransform.wgs84togcj02(102.56640672589998, 24.380873368750965);
    let cartographic = Cesium.Cartographic.fromDegrees(wgs84togcj02[0], wgs84togcj02[1], 0);
    let centerPoint = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
    $.xmMapViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(102.56640672589998, 24.380873368750965, 15000.0)
    });
    $.xmMapViewer.entities.add({
        id: '小马国炬',
        position: centerPoint,
        label: new Cesium.LabelGraphics({
            scale: 1,
            text: '小马国炬',
            font: window.isLoad4k ? '32px sans-serif' : '24px sans-serif',
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP
        }),
        billboard: {
            image: window.isLoad4k ? '/static/images/transport/company-icon@2x.png' : '/static/images/transport/company-icon@1x.png'
        }
    })
    axios.get('/static/json/logisticsCustomerService.json').then((response) => {
        if (response.data) {
            $.xmMapViewer.entities.suspendEvents();
            response.data.map((point, index) => {
                let material = new Cesium.PolylineTrailMaterialProperty({
                    color: Cesium.Color.GREEN,
                    duration: 3000,
                    trailImage: window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png"
                });
                let wgs84togcj02 = coordtransform.wgs84togcj02(point.lon, point.lat);
                let cartographic = Cesium.Cartographic.fromDegrees(wgs84togcj02[0], wgs84togcj02[1], 0);
                let endPoint = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
                window.logisticsCompany[point.name] = {
                    longitude_gcj02: wgs84togcj02[0],
                    latitude_gcj02: wgs84togcj02[1]
                };
                $.xmMapViewer.entities.add({
                    id: point.name,
                    clickType: "company",
                    position: endPoint,
                    billboard: {
                        image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                    }
                });
                $.xmMapViewer.entities.add({
                    polyline: {
                        positions: logisticsGenerateCurve(centerPoint, endPoint),
                        width: point.level,
                        material: material
                    }
                });
            });
            $.xmMapViewer.entities.resumeEvents();
        }
    })
}

//炫酷的流线型运动
function logisticsGenerateCurve(startPoint, endPoint) {
    let addPointCartesian = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(startPoint, endPoint, addPointCartesian);
    let midPointCartesian = new Cesium.Cartesian3();
    Cesium.Cartesian3.divideByScalar(addPointCartesian, 2, midPointCartesian);
    let midPointCartographic = Cesium.Cartographic.fromCartesian(midPointCartesian);
    //除以的这个数越小 开始的位置聚集的位置就越陡，越大 开始的位置线就越平缓，
    midPointCartographic.height = Cesium.Cartesian3.distance(startPoint, endPoint) / 10;
    let midPoint = new Cesium.Cartesian3();
    Cesium.Ellipsoid.WGS84.cartographicToCartesian(
        midPointCartographic,
        midPoint
    );
    let spline = new Cesium.CatmullRomSpline({
        times: [0.0, 0.5, 1.0],
        points: [startPoint, midPoint, endPoint]
    });
    let curvePoints = [];
    for (let i = 0, len = 200; i < len; i++) {
        curvePoints.push(spline.evaluate(i / len));
    }
    return curvePoints;
}

//物流地图-地图底图切换事件绑定
function logisticstSwitchiImageryBindEvent() {
    //地图底图切换
    $("#logisticsSwitchImageryProvider1").on('click', function () {
        window.coordinateType.seleced = window.coordinateType.gcj02;
        $.xmMapViewer.imageryLayers.removeAll();
        $.xmMapViewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
            url: constant.ARCGIS
        }));
        $(this).siblings("button").removeClass("active").end().addClass("active");
        updatePrimitives();
        setTimeout(function () {
            logisticstUpdateVehicleMark();
            logisticsUpdatePrimitives();
        }, 500);
    });
    $("#logisticsSwitchImageryProvider2").on('click', function () {
        window.coordinateType.seleced = window.coordinateType.wgs84;
        $.xmMapViewer.imageryLayers.removeAll();
        let img__cia_LayerProvider = new Cesium.WebMapTileServiceImageryProvider({//调用影响中文注记服务
            url: constant.TDT_CIA_C,
            layer: 'constant.TDT_CIA_C',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
            maximumLevel: 16,
            show: true
        });
        $.xmMapViewer.imageryLayers.addImageryProvider(img_c_LayerProvider);
        $.xmMapViewer.imageryLayers.addImageryProvider(img__cia_LayerProvider);
        $(this).siblings("button").removeClass("active").end().addClass("active");
        updatePrimitives();
        setTimeout(function () {
            logisticstUpdateVehicleMark();
            logisticsUpdatePrimitives();
        }, 500);
    });
    $("#logisticsSwitchImageryProvider3").on('click', function () {
        window.coordinateType.seleced = window.coordinateType.wgs84;
        $.xmMapViewer.imageryLayers.removeAll();
        let vec_cLayerProvider = new Cesium.WebMapTileServiceImageryProvider({
            url: constant.TDT_VEC_C,
            layer: 'tdtVec_c',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            credit: new Cesium.Credit('天地图矢量服务'),
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            maximumLevel: 16,
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19']
        });
        let cva_cLayerProvider = new Cesium.WebMapTileServiceImageryProvider({//调用影响中文注记服务
            url: constant.TDT_CVA_C,
            layer: 'tdtCva_c',
            style: 'default',
            format: 'tiles',
            tileMatrixSetID: 'c',
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
            maximumLevel: 16,
            show: true
        });
        $.xmMapViewer.imageryLayers.addImageryProvider(vec_cLayerProvider);
        $.xmMapViewer.imageryLayers.addImageryProvider(cva_cLayerProvider);
        $(this).siblings("button").removeClass("active").end().addClass("active");
        updatePrimitives();
        setTimeout(function () {
            logisticstUpdateVehicleMark();
            logisticsUpdatePrimitives();
        }, 500);
    });
}

//物流地图-更新车辆最后定位mark点
function logisticstUpdateVehicleMark() {
    let yunnanDataSource = $.xmMapViewer.dataSources.getByName("yunnan_area");
    let yunnanPolyLine;
    if (yunnanDataSource.length > 0) {
        yunnanPolyLine = yunnanDataSource[0].entities.getById("yunnan_polyline");
    }
    let logisticsRoutePolyline = $.xmMapViewer.entities.getById("logistics_route_polyline");
    let logistics_route_turnDataSources = $.xmMapViewer.dataSources.getByName("logistics_route_turn");
    if (window.coordinateType.seleced === window.coordinateType.wgs84) {
        if (yunnanPolyLine != null) {
            yunnanPolyLine._polyline.show = false;
            yunnanPolyLine._polyline.positions._value = yunnanPolyLine.wgs84_positions;
            yunnanPolyLine._polyline.show = true;
        }
        if (logisticsRoutePolyline) {
            logisticsRoutePolyline._polyline.show = false;
            logisticsRoutePolyline._polyline.positions._value = logisticsRoutePolyline.wgs84_positions;
            logisticsRoutePolyline._polyline.show = true;
        }
        if (logistics_route_turnDataSources.length > 0) {
            let logistics_route_turnDataSource = logistics_route_turnDataSources[0];
            for (let i = 0; i < logistics_route_turnDataSource.entities.values.length; i++) {
                let entity = logistics_route_turnDataSource.entities.values[i];
                if (entity['entity_type'] === "polyline") {
                    entity._polyline.show = false;
                    entity._polyline.positions._value = entity.wgs84_positions;
                    entity._polyline.show = true;
                } else {
                    entity.position = entity.wgs84_position;
                }
            }
        }
    } else if (window.coordinateType.seleced === window.coordinateType.gcj02) {
        if (yunnanPolyLine != null) {
            yunnanPolyLine._polyline.show = false;
            yunnanPolyLine._polyline.positions._value = yunnanPolyLine.gcj02_positions;
            yunnanPolyLine._polyline.show = true;
        }
        if (logisticsRoutePolyline) {
            logisticsRoutePolyline._polyline.show = false;
            logisticsRoutePolyline._polyline.positions._value = logisticsRoutePolyline.gcj02_positions;
            logisticsRoutePolyline._polyline.show = true;
        }
        if (logistics_route_turnDataSources.length > 0) {
            let logistics_route_turnDataSource = logistics_route_turnDataSources[0];
            for (let i = 0; i < logistics_route_turnDataSource.entities.values.length; i++) {
                let entity = logistics_route_turnDataSource.entities.values[i];
                if (entity['entity_type'] === "polyline") {
                    entity._polyline.show = false;
                    entity._polyline.positions._value = entity.gcj02_positions;
                    entity._polyline.show = true;
                } else {
                    entity.position = entity.gcj02_position;
                }
            }

        }
    }
    for (let i = 0; i < $.xmMapViewer.entities.values.length; i++) {
        let entity = $.xmMapViewer.entities.values[i];
        if (entity.id === "logistics_route_polyline") {
            continue;
        }
        if (window.coordinateType.seleced === window.coordinateType.wgs84) {
            entity.position = entity.wgs84_position;
        } else if (window.coordinateType.seleced === window.coordinateType.gcj02) {
            entity.position = entity.gcj02_position;
        }
    }
}

function logisticsUpdatePrimitives() {
    if (window.coordinateType.seleced == window.coordinateType.gcj02) {
        if(window.logistics_route_gas_station_poi_collection){
            for (var i = 0; i < window.logistics_route_gas_station_poi_collection._instances.length; i++) {
                var primitive = window.logistics_route_gas_station_poi_collection._instances[i];
                primitive.modelMatrix = primitive.element.gcj02_modelMatrix;
            }
        }
    } else {
        if(window.logistics_route_gas_station_poi_collection){
            for (var i = 0; i < window.logistics_route_gas_station_poi_collection._instances.length; i++) {
                var primitive = window.logistics_route_gas_station_poi_collection._instances[i];
                primitive.modelMatrix = primitive.element.wgs84_modelMatrix;
            }
        }
    }
}

//物流地图-事件绑定
function logisticsBindEvent() {
    //物流地图切换选项
    $("#logisticsCompany").on('click', function () {
        dispose();
        window.menu.seleced = window.menu.logistics;
        //物流地图-云南省行政区域
        initYunNanArea();
        logisticsInitCompany();
        $(".transport").hide();
        $(".logistics").hide();
        $(".financial").hide();
        $(this).parent().siblings("li").removeClass("active").end().addClass("active");
        $(this).parents(".dropdown").children('a').addClass("active");
        $(this).parents(".dropdown").siblings("li").children().removeClass("active");
        setTimeout(function () {
            $("#logisticsSwitchImageryProvider1").click();
        }, 500)
    });
    $("#logisticsRoute").on('click', function () {
        dispose();
        window.menu.seleced = window.menu.logistics;
        //物流地图-云南省行政区域
        initYunNanArea();
        logisticsInitRoute();
        $(".transport").hide();
        $(".logistics").show();
        $(".financial").hide();
        $(this).parent().siblings("li").removeClass("active").end().addClass("active");
        $(this).parents(".dropdown").children('a').addClass("active");
        $(this).parents(".dropdown").siblings("li").children().removeClass("active");
        setTimeout(function () {
            $("#logisticsSwitchImageryProvider1").click();
        }, 500)
    });
    $("#logisticsCustomer").on('click', function () {
        dispose();
        window.menu.seleced = window.menu.logistics;
        //物流地图-云南省行政区域
        initYunNanArea();
        logisticsInitCustomerService();
        $(".transport").hide();
        $(".logistics").hide();
        $(".financial").hide();
        $(this).parent().siblings("li").removeClass("active").end().addClass("active");
        $(this).parents(".dropdown").children('a').addClass("active");
        $(this).parents(".dropdown").siblings("li").children().removeClass("active");
        setTimeout(function () {
            $("#logisticsSwitchImageryProvider1").click();
        }, 500)
    });
    //物流地图-地图底图切换事件绑定
    logisticstSwitchiImageryBindEvent();
    //表格点击行事件
    $("#logisticsTypeTable").on('click', "tbody tr", function () {
        let routeId = $(this).attr("route-id");
        axios.post(window.BASE_URL + '/JT808WebApi/Route/GetRouteById', {id: routeId}).then((response) => {
            if (response.data) {
                $.xmMapViewer.entities.removeAll();
                console.log(response.data);
                let point = response.data;
                if (window.coordinateType.wgs84 === window.coordinateType.seleced) {
                    $.xmMapViewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(point.wgs84_origin.longitude, point.wgs84_origin.latitude, 25000),
                        //     orientation: {//默认情况下，指向中心位置
                        //     heading : Cesium.Math.toRadians(20.0),
                        //     pitch : Cesium.Math.toRadians(-35.0),//相机倾斜35度
                        //     roll : 0
                        // }
                    });
                    $.xmMapViewer.entities.add({
                        id: "logistics_" + point.id + "_origin",
                        gcj02_position: coordinateToPosition(point.gcj02_origin),
                        wgs84_position: coordinateToPosition(point.wgs84_origin),
                        position: coordinateToPosition(point.wgs84_origin),
                        label: new Cesium.LabelGraphics({
                            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                            text: "起始地：" + point.origin_name + "\n" + point.origin_address,
                            font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0.0, -60),
                            pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                            showBackground:true,
                            backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                            backgroundPadding:new Cesium.Cartesian2(15, 15),
                        }),
                        billboard: {
                            image: window.isLoad4k ? '/static/images/transport/error-active@2x.png' : '/static/images/transport/error-active@1x.png'
                        }
                    });
                    $.xmMapViewer.entities.add({
                        id: "logistics_" + point.id + "_destination",
                        gcj02_position: coordinateToPosition(point.gcj02_destination),
                        wgs84_position: coordinateToPosition(point.wgs84_destination),
                        position: coordinateToPosition(point.wgs84_origin),
                        label: new Cesium.LabelGraphics({
                            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                            text: "目的地：" + point.destination_name + "\n" + point.destination_address,
                            font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0.0, -60),
                            pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                            showBackground:true,
                            backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                            backgroundPadding:new Cesium.Cartesian2(15, 15),
                            disableDepthTestDistance:false,

                        }),
                        billboard: {
                            image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                        }
                    });
                    $.xmMapViewer.entities.add({
                        id: "logistics_route_polyline",
                        gcj02_positions: Cesium.Cartesian3.fromDegreesArray(point.gcj02_polylines),
                        wgs84_positions: Cesium.Cartesian3.fromDegreesArray(point.wgs84_polylines),
                        polyline: {
                            show: true,
                            positions: Cesium.Cartesian3.fromDegreesArray(point.wgs84_polylines),
                            material: new Cesium.PolylineTrailMaterialProperty({
                                color: Cesium.Color.GREEN,
                                duration: 3000,
                                trailImage: window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png"
                            }),
                            width: 5
                        }
                    });
                    if (point.gas_station_pois.length > 0) {
                        let ulStr = '';
                        point.gas_station_pois.map((item) => {
                            let liStr = '  <li class="media" poi-id=' + item.poi_id + '>\n' +
                                '                    <img src="static/images/logistics/position.png" class="mr-3" >\n' +
                                '                    <div class="media-body">\n' +
                                '                        <h5 class="mt-0 mb-1">' + item.name + '</h5>\n' +
                                '                        <p>' + item.detail_address + '</p>\n' +
                                '                        <p> <i class="fa fa-phone"></i> ' + (item.tel || "-") + '</p>\n' +
                                '                    </div>\n' +
                                '                </li>';
                            ulStr += liStr;
                            $.xmMapViewer.entities.add({
                                id: item.poi_id,
                                adcode: item.adcode,
                                gcj02_coordinate: item.gcj02_coordinate,
                                wgs84_coordinate: item.wgs84_coordinate,
                                clickType: "logistics_route_gas_station",
                                gcj02_position: coordinateToPosition(item.gcj02_coordinate),
                                wgs84_position: coordinateToPosition(item.wgs84_coordinate),
                                position: coordinateToPosition(item.wgs84_coordinate),
                                label: new Cesium.LabelGraphics({
                                    scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                    text: item.name,
                                    font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                                    pixelOffset: new Cesium.Cartesian2(0.0, -30),
                                    pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                    showBackground:true,
                                    backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                    backgroundPadding:new Cesium.Cartesian2(15, 15),
                                }),
                                model: {
                                    uri: window.BASE_URL_LIBS+'/gltf/gas_station.glb',
                                    minimumPixelSize : 128,
                                    maximumScale : 10000
                                }
                            });
                        });
                        $("#logisticsGasStationList").html(ulStr);
                    }
                } else if (window.coordinateType.gcj02 === window.coordinateType.seleced) {
                    $.xmMapViewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(point.gcj02_origin.longitude, point.gcj02_origin.latitude, 25000),
                        //     orientation: {
                        //     heading : Cesium.Math.toRadians(20.0),
                        //     pitch : Cesium.Math.toRadians(-35.0),
                        //     roll : 0
                        // }
                    });
                    $.xmMapViewer.entities.add({
                        id: "logistics_" + point.id + "_origin",
                        gcj02_position: coordinateToPosition(point.gcj02_origin),
                        wgs84_position: coordinateToPosition(point.wgs84_origin),
                        position: coordinateToPosition(point.gcj02_origin),
                        label: new Cesium.LabelGraphics({
                            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                            text: "起始地：" + point.origin_name + "\n" + point.origin_address,
                            font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0.0, -60),
                            pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                            showBackground:true,
                            backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                            backgroundPadding:new Cesium.Cartesian2(15, 15),
                        }),
                        billboard: {
                            image: window.isLoad4k ? '/static/images/transport/error-active@2x.png' : '/static/images/transport/error-active@1x.png'
                        }
                    });
                    $.xmMapViewer.entities.add({
                        id: "logistics_" + point.id + "_destination",
                        gcj02_position: coordinateToPosition(point.gcj02_destination),
                        wgs84_position: coordinateToPosition(point.wgs84_destination),
                        position: coordinateToPosition(point.gcj02_destination),
                        label: new Cesium.LabelGraphics({
                            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                            text: "目的地：" + point.destination_name + "\n" + point.destination_address,
                            font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0.0, -60),
                            pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                            showBackground:true,
                            backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                            backgroundPadding:new Cesium.Cartesian2(15, 15),
                            disableDepthTestDistance:false ,
                        }),
                        billboard: {
                            image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                        }
                    });
                    $.xmMapViewer.entities.add({
                        id: "logistics_route_polyline",
                        gcj02_positions: Cesium.Cartesian3.fromDegreesArray(point.gcj02_polylines),
                        wgs84_positions: Cesium.Cartesian3.fromDegreesArray(point.wgs84_polylines),
                        polyline: {
                            show: true,
                            positions: Cesium.Cartesian3.fromDegreesArray(point.gcj02_polylines),
                            material: new Cesium.PolylineTrailMaterialProperty({
                                color: Cesium.Color.GREEN,
                                duration: 3000,
                                trailImage: window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png"
                            }),
                            width: 5
                        }
                    });
                    if (point.gas_station_pois.length > 0) {
                        let ulStr = '';
                        point.gas_station_pois.map((item) => {
                            let liStr = '  <li class="media" poi-id=' + item.poi_id + '>\n' +
                                '                    <img src="static/images/logistics/position.png" class="mr-3" >\n' +
                                '                    <div class="media-body">\n' +
                                '                        <h5 class="mt-0 mb-1">' + item.name + '</h5>\n' +
                                '                        <p>' + item.detail_address + '</p>\n' +
                                '                        <p> <i class="fa fa-phone"></i> ' + (item.tel || "-") + '</p>\n' +
                                '                    </div>\n' +
                                '                </li>';
                            ulStr += liStr;
                            $.xmMapViewer.entities.add({
                                id: item.poi_id,
                                adcode: item.adcode,
                                gcj02_coordinate: item.gcj02_coordinate,
                                wgs84_coordinate: item.wgs84_coordinate,
                                clickType: "logistics_route_gas_station",
                                gcj02_position: coordinateToPosition(item.gcj02_coordinate),
                                wgs84_position: coordinateToPosition(item.wgs84_coordinate),
                                position: coordinateToPosition(item.gcj02_coordinate),
                                label: new Cesium.LabelGraphics({
                                    scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                    text: item.name,
                                    font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                                    pixelOffset: new Cesium.Cartesian2(0.0, -30),
                                    pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                }),
                                model: {
                                    uri: window.BASE_URL_LIBS+'/gltf/gas_station.glb',
                                    minimumPixelSize : 128,
                                    maximumScale : 10000
                                }
                            });
                        });
                        $("#logisticsGasStationList").html(ulStr);
                    }
                }
            }
        }).catch((error) => {
            console.log(error);
        });
    });
    //物流地图-显示所有加油站
    $(".logistics-mk4").on('change', '#logisticsShowAllGasStation', function (e) {
        if(window.logistics_route_gas_station_poi_collection){
            $.xmMapViewer.scene.primitives.remove(window.logistics_route_gas_station_poi_collection);
            window.logistics_route_gas_station_poi_collection=null;
        }else{
            axios.post(window.BASE_URL + '/JT808WebApi/Poi/GetGasStationPoi').then((response) => {
                if (response.data) {
                    console.time("poi_gas_station");
                    var instances = [];
                    response.data.map((item) => {
                        var heading = 180;
                        var pitch = 0;
                        var roll = 0;
                        var scale = 25;
                        if (window.coordinateType.gcj02 === window.coordinateType.seleced) { 
                            var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(coordinateToPosition(item.gcj02_coordinate), new Cesium.HeadingPitchRoll(heading, pitch, roll));
                            Cesium.Matrix4.multiplyByUniformScale(modelMatrix, scale, modelMatrix);
                            instances.push({
                                modelMatrix : modelMatrix
                            });
                        } else {
                            var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(coordinateToPosition(item.wgs84_coordinate), new Cesium.HeadingPitchRoll(heading, pitch, roll));
                            Cesium.Matrix4.multiplyByUniformScale(modelMatrix, scale, modelMatrix);
                            instances.push({
                                modelMatrix : modelMatrix
                            });
                        }
                    });
                    window.logistics_route_gas_station_poi_collection = $.xmMapViewer.scene.primitives.add(new Cesium.ModelInstanceCollection({
                        url : window.BASE_URL_LIBS+'/gltf/gas_station.glb',
                        instances : instances,
                    }));  
                    window.logistics_route_gas_station_poi_collection.readyPromise.then(function(collection) {
                        for(var i=0;i<collection.length;i++){
                            let instance=collection._instances[i];
                            let item=response.data[i];
                            var heading = 180;
                            var pitch = 0;
                            var roll = 0;
                            var scale = 25;
                            let wgs84_modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(coordinateToPosition(item.wgs84_coordinate), new Cesium.HeadingPitchRoll(heading, pitch, roll));
                            Cesium.Matrix4.multiplyByUniformScale(wgs84_modelMatrix, scale, wgs84_modelMatrix);
                            let gcj02_modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(coordinateToPosition(item.gcj02_coordinate), new Cesium.HeadingPitchRoll(heading, pitch, roll));
                            Cesium.Matrix4.multiplyByUniformScale(gcj02_modelMatrix, scale, gcj02_modelMatrix);
                            instance.clickType="logistics_route_gas_station_poi";
                            instance.element={
                                wgs84_modelMatrix:wgs84_modelMatrix,
                                gcj02_modelMatrix:gcj02_modelMatrix,
                                id: item.poi_id,
                                adcode: item.adcode,
                                gcj02_coordinate: item.gcj02_coordinate,
                                wgs84_coordinate: item.wgs84_coordinate,
                                wgs84_position: coordinateToPosition(item.wgs84_coordinate),
                                gcj02_position: coordinateToPosition(item.gcj02_coordinate)
                            };
                        }
                    }).otherwise(function(error){
                        console.error(error);
                    });
                    console.timeEnd("poi_gas_station");
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    });
    //物流地图-查询附近加油站
    $(".logistics-mk3").keydown(function (e) {
        if (e.keyCode === 13) {
            let keyword = $("#logisticsGasKeywords").val();
            console.log(keyword);
            let data = {};
            if (keyword.length > 0) {
                let keywords = keyword.split(",");
                if (keywords.length === 2 && parseFloat(keywords[0].trim()) && parseFloat(keywords[1].trim())) {
                    data.gcj02_coordinate = {};
                    if (window.coordinateType.gcj02 === window.coordinateType.seleced) {
                        data.gcj02_coordinate.longitude = parseFloat(keywords[0].trim());
                        data.gcj02_coordinate.latitude = parseFloat(keywords[1].trim());
                    } else if (window.coordinateType.wgs84 === window.coordinateType.seleced) {
                        let wgs84togcj02 = coordtransform.wgs84togcj02(parseFloat(keywords[0].trim()), parseFloat(keywords[1].trim()));
                        data.gcj02_coordinate.longitude = wgs84togcj02[0];
                        data.gcj02_coordinate.latitude = wgs84togcj02[1];
                    }
                } else {
                    data.address = keywords.toString();
                }
                axios.post(
                    window.BASE_URL + '/JT808WebApi/Poi/QueryPlaceText', data
                ).then((response) => {
                    if (response.data.length > 0) {
                        let searchAddrResult = response.data;
                        let ulStr = '';
                        searchAddrResult.map((item) => {
                            let liStr = '<li class="media" data-gcj02-coordinate=' + JSON.stringify(item.gcj02_coordinate) + '>\n' +
                                '                    <img src="static/images/logistics/position.png" class="mr-3" >\n' +
                                '                    <div class="media-body">\n' +
                                '                        <h5 class="mt-0 mb-1">' + item.name + '</h5>\n' +
                                '                        <p class="address">' + item.detial_address + '</p>\n' +
                                '                    </div>\n' +
                                '                </li>';
                            ulStr += liStr;
                        });
                        $("#logisticsSearchList").html(ulStr);
                    }
                }).catch((error) => {
                    console.error(error);
                });


            }
        }
    });
    //物流地图 -点击某条查询结果
    $("#logisticsSearchList").on('click', "li", function () {
        let detail_address = $(this).find('.address').text();
        let gcj02_coordinate = $(this).data('gcj02-coordinate');
        let wgs84_arr = coordtransform.wgs84togcj02(gcj02_coordinate.longitude, gcj02_coordinate.latitude);
        let wgs84_coordinate = {longitude: wgs84_arr[0], latitude: wgs84_arr[1]};
        console.log(gcj02_coordinate);
        console.log(detail_address);
        let data = {gcj02_coordinate};
        axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryPoiByKeyword', data
        ).then((response) => {
            console.log(response);
            let ds = $.xmMapViewer.dataSources.getByName("logistics_route_turn");
            if (ds.length > 0) {
                $.xmMapViewer.dataSources.remove(ds[0], true);
            }
            ds = new Cesium.CustomDataSource('logistics_route_turn');
            var heading = Cesium.Math.toRadians(135);
            var pitch = 0;
            var roll = 0;
            var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
            if (response.data.length > 0) {
                if (window.coordinateType.gcj02 === window.coordinateType.seleced) {
                    $.xmMapViewer.camera.flyTo({
                        destination: coordinateToPosition(response.data[0].gcj02_origin, 6000)
                    });
                    for (var i = 0; i < response.data.length; i++) {
                        let element = response.data[i];
                        ds.entities.add({
                            entity_type: "entity",
                            distance: element.distance,
                            duration: element.duration,
                            detail_address: element.origin_address,
                            gcj02_position: coordinateToPosition(element.gcj02_origin),
                            wgs84_position: coordinateToPosition(element.wgs84_origin),
                            position: coordinateToPosition(element.gcj02_origin),
                            label: new Cesium.LabelGraphics({
                                scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                text: "司机之家\n" + "总时长：" + (element.duration / 60.0).toFixed(1) + "分钟" + "\n" + "路程：" + (element.distance / 1000.0).toFixed(1) + "公里",
                                font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                verticalOrigin: Cesium.VerticalOrigin.TOP,
                                pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                showBackground:true,
                                backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                backgroundPadding:new Cesium.Cartesian2(15, 15),
                                disableDepthTestDistance:false,

                            }),
                            model: {
                                uri: window.BASE_URL_LIBS+'/gltf/gas_station.glb',
                                minimumPixelSize : 128,
                                maximumScale : 10000
                            }
                        });
                        ds.entities.add({
                            distance: element.distance,
                            duration: element.duration,
                            entity_type: "entity",
                            orientation: Cesium.Transforms.headingPitchRollQuaternion(coordinateToPosition(element.gasStationPoi.gcj02_coordinate), hpr),
                            detail_address: element.gasStationPoi.detail_address,
                            gcj02_position: coordinateToPosition(element.gasStationPoi.gcj02_coordinate),
                            wgs84_position: coordinateToPosition(element.gasStationPoi.wgs84_coordinate),
                            position: coordinateToPosition(element.gasStationPoi.gcj02_coordinate),
                            label: new Cesium.LabelGraphics({
                                scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                text: "目的地：" + element.origin_address,
                                font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                verticalOrigin: Cesium.VerticalOrigin.TOP,
                                pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                showBackground:true,
                                backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                backgroundPadding:new Cesium.Cartesian2(15, 15),
                                disableDepthTestDistance:false,
                            }),               
                            billboard: {
                                image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                            }
                        });
                        ds.entities.add({
                            entity_type: "polyline",
                            gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polylines),
                            wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polylines),
                            polyline: {
                                show: true,
                                positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polylines),
                                material: new Cesium.PolylineTrailMaterialProperty({
                                    color: Cesium.Color.GREEN,
                                    duration: 3000,
                                    trailImage: window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png"
                                }),
                                width: 5
                            }
                        });
                    }
                } else if (window.coordinateType.wgs84 === window.coordinateType.seleced) {
                    $.xmMapViewer.camera.flyTo({
                        destination: coordinateToPosition(response.data[0].wgs84_origin, 6000)
                    });
                    for (var i = 0; i < response.data.length; i++) {
                        let element = response.data[i];
                        ds.entities.add({
                            distance: element.distance,
                            duration: element.duration,
                            detail_address: element.origin_address,
                            gcj02_position: coordinateToPosition(element.gcj02_origin),
                            wgs84_position: coordinateToPosition(element.wgs84_origin),
                            position: coordinateToPosition(element.wgs84_origin),

                            label: new Cesium.LabelGraphics({
                                scale: 1, 
                                text: "目的地：" + element.origin_address,
                                font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                verticalOrigin: Cesium.VerticalOrigin.TOP,
                                pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                showBackground:true,
                                backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                backgroundPadding:new Cesium.Cartesian2(15, 15),
                                disableDepthTestDistance:false,
                            }),
                            billboard: {
                                image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                            }
                        });
                        ds.entities.add({
                            distance: element.distance,
                            duration: element.duration,
                            orientation: Cesium.Transforms.headingPitchRollQuaternion(coordinateToPosition(element.gasStationPoi.wgs84_coordinate), hpr),
                            label: new Cesium.LabelGraphics({
                                scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                text: "司机之家\n" + "总时长：" + (element.duration / 60.0).toFixed(1) + "分钟" + "\n" + "路程：" + (element.distance / 1000.0).toFixed(1) + "公里",
                                font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                verticalOrigin: Cesium.VerticalOrigin.TOP,
                                pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                showBackground:true,
                                backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                backgroundPadding:new Cesium.Cartesian2(15, 15),
                                disableDepthTestDistance:false,
                            }),
                            model: {
                                uri: window.BASE_URL_LIBS+ '/gltf/gas_station.glb',
                                minimumPixelSize : 128,
                                maximumScale : 10000
                            },
                            detail_address: element.gasStationPoi.detail_address,
                            gcj02_position: coordinateToPosition(element.gasStationPoi.gcj02_coordinate),
                            wgs84_position: coordinateToPosition(element.gasStationPoi.wgs84_coordinate),
                            position: coordinateToPosition(element.gasStationPoi.wgs84_coordinate),
                        });
                        ds.entities.add({
                            id: "logistics_route_turn_polyline_" + i,
                            entity_type: "polyline",
                            gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polylines),
                            wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polylines),
                            polyline: {
                                show: true,
                                positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polylines),
                                material: new Cesium.PolylineTrailMaterialProperty({
                                    color: Cesium.Color.GREEN,
                                    duration: 3000,
                                    trailImage: window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png"
                                }),
                                width: 5
                            }
                        });
                    }
                }
                $.xmMapViewer.dataSources.add(ds);
                console.log(response.data);
            } else {
                $('#toastInfo').toast({
                    delay: 3000,
                    autohide: true
                });
                $('#toastInfo').toast('show');
                if (window.coordinateType.gcj02 === window.coordinateType.seleced) {
                    ds.entities.add({
                        detail_address: detail_address,
                        gcj02_position: coordinateToPosition(gcj02_coordinate),
                        wgs84_position: coordinateToPosition(wgs84_coordinate),
                        position: coordinateToPosition(gcj02_coordinate),
                        label: new Cesium.LabelGraphics({
                            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                            text: "目的地：" + detail_address,
                            font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0.0, -40),
                            pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                            showBackground:true,
                            backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                            backgroundPadding:new Cesium.Cartesian2(15, 15),
                            disableDepthTestDistance:false,            
                        }),
                        billboard: {
                            image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                        }
                    });
                    $.xmMapViewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(gcj02_coordinate.longitude, gcj02_coordinate.latitude, 15000.0)
                    });
                } else if (window.coordinateType.wgs84 === window.coordinateType.seleced) {
                    ds.entities.add({
                        detail_address: detail_address,
                        gcj02_position: coordinateToPosition(gcj02_coordinate),
                        wgs84_position: coordinateToPosition(wgs84_coordinate),
                        position: coordinateToPosition(wgs84_coordinate),
                        label: new Cesium.LabelGraphics({
                            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                            text: "目的地：" + detail_address,
                            font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0.0, -40),
                            pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                            showBackground:true,
                            backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                            backgroundPadding:new Cesium.Cartesian2(15, 15),
                            disableDepthTestDistance:false,
                        }),
                        billboard: {
                            image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                        }
                    });
                    $.xmMapViewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(wgs84_coordinate.longitude, wgs84_coordinate.latitude, 15000.0)
                    });
                }
                $.xmMapViewer.dataSources.add(ds);
            }
        }).catch((error) => {
            console.error(error);
        })
    });
    // 倾斜摄影表格点击切换视角
    $(".titles").on('click','li',function (e) {
        if($(this).attr("data-id") == 0){
            loadCenterPointAndFlyTo()
        }else {
            const targetText = window.cameraConfig[$(this).text()] 
            $.xmMapViewer.flyTo(window[targetText])
        }
    })
}

//物流地图 -右键菜单
function logisticsLoadRightMenu(e) {
    let eText = [{
        text: "附近配送点",
        type: 'distribution_points'
    },{
        text: "清除覆盖物",
        type: 'logistics_clear_points'
    }];
    let con, lis = '';
    for (let i = 0; i < eText.length; i++) {
        lis += `<li class="li-item" data-index="` + i + `"  data-type="` + eText[i].type + `"> ` + eText[i].text + ` </li>`;
    }
    con = `<ul class="contextmenu-ul">` + lis + `</ul>`;
    logisticsRemoveRightDom();
    let div = null;
    div = document.createElement('div');
    div.className = "contextmenu";
    div.style.top = e.position.y + 'px';
    div.style.left = e.position.x + 'px';
    div.style.position = 'fixed';
    div.innerHTML = con;
    cesiumContainer.append(div);

    $(".contextmenu-ul").on('click', "li", function (e) {
        let type = $(this).data('type');
        logisticsRightLiClick(type);
        e.stopPropagation();
    });
    $(document).on('click', ':not(.contextmenu-ul)', function () {
        logisticsRemoveRightDom();
        return;
    })
}

function logisticsRemoveRightDom() {
    let div = document.querySelectorAll(".contextmenu");
    if (div.length !== 0) {
        cesiumContainer.removeChild(div[0])
    }
}

function logisticsRightLiClick(type) {
    logisticsRemoveRightDom();
    switch (type) {
        case 'distribution_points':
            let gcj02_coordinate = window.logisticsRightCoordinate;
            let wgs84_arr = coordtransform.wgs84togcj02(gcj02_coordinate.longitude, gcj02_coordinate.latitude);
            let wgs84_coordinate = {longitude: wgs84_arr[0], latitude: wgs84_arr[1]};
            let ds = $.xmMapViewer.dataSources.getByName("logistics_route_turn");
            if (ds.length > 0) {
                $.xmMapViewer.dataSources.remove(ds[0], true);
            }
            ds = new Cesium.CustomDataSource('logistics_route_turn');
            let radius=5000;
            window.radarScanId="radarScanId";
            $.xmMapViewer.entities.removeById(window.radarScanId);
            if (window.coordinateType.seleced === window.coordinateType.gcj02) {
                $.xmMapViewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(gcj02_coordinate.longitude, gcj02_coordinate.latitude, 25000)
                });
                window.radarScan = addRadarScan($.xmMapViewer, {
                    lon: gcj02_coordinate.longitude,//经度
                    lat: gcj02_coordinate.latitude, //纬度
                    scanColor: new Cesium.Color(0, 0, 1, 1),//红，绿，蓝，透明度
                    //scanColor:new Cesium.Color(1.0, 0.1, 0.1, 1),//红，绿，蓝，透明度
                    r: radius,//扫描半径
                    interval: 4000//时间间隔
                });
                setTimeout(function () {
                    $.xmMapViewer.scene.postProcessStages.remove(window.radarScan); //消除;
                    $.xmMapViewer.scene.globe.depthTestAgainstTerrain = false;
                    $.xmMapViewer.entities.add({
                        id: window.radarScanId,
                        gcj02_position: coordinateToPosition(gcj02_coordinate),
                        wgs84_position: coordinateToPosition(gcj02_coordinate),
                        position: coordinateToPosition(gcj02_coordinate),
                        ellipse: {
                            semiMinorAxis: radius,//指定半长轴的数值属性
                            semiMajorAxis: radius,//指定半短轴的数字属性。
                            height: 0,//一个数字属性，指定椭圆相对于椭球表面的高度。
                            fill: false,//一个布尔属性，指定椭圆是否填充了所提供的材料。空心
                            outline: true,//一个布尔属性，指定是否勾勒出椭圆。 height must be set for outline to display
                            outlineColor: Cesium.Color.BLUE,//一个属性，指定轮廓的 颜色 。
                            outlineWidth: 10 //一个数字属性，指定轮廓的宽度。
                        }
                    });
                    axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryBicyclingPoiBetweenAddress', {gcj02_coordinate}
                    ).then((response) => {
                        console.log(response);
                        var heading = Cesium.Math.toRadians(135);
                        var pitch = 0;
                        var roll = 0;
                        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                        if (response.data.length > 0) {
                            $.xmMapViewer.camera.flyTo({
                                destination: coordinateToPosition(response.data[0].gcj02_origin, 6000)
                            });
                            for (var i = 0; i < response.data.length; i++) {
                                let element = response.data[i];
                                ds.entities.add({
                                    entity_type: "entity",
                                    distance: element.distance,
                                    duration: element.duration,
                                    detail_address: element.origin_address,
                                    gcj02_position: coordinateToPosition(element.gcj02_origin),
                                    wgs84_position: coordinateToPosition(element.wgs84_origin),
                                    position: coordinateToPosition(element.gcj02_origin),
                                    model: {
                                        uri: window.BASE_URL_LIBS+'/gltf/gas_station.glb',
                                        minimumPixelSize : 128,
                                        maximumScale : 10000
                                    },
                                    label: new Cesium.LabelGraphics({
                                        scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                        text: "司机之家\n" + "总时长：" + (element.duration / 60.0).toFixed(1) + "分钟" + "\n" + "路程：" + (element.distance / 1000.0).toFixed(1) + "公里",
                                        font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                                        pixelOffset: new Cesium.Cartesian2(0.0, -90),
                                        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
                                        showBackground:true,
                                        backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                        backgroundPadding:new Cesium.Cartesian2(15, 15),                  
                                    })
                                });
                                ds.entities.add({
                                    distance: element.distance,
                                    duration: element.duration,
                                    entity_type: "entity",
                                    orientation: Cesium.Transforms.headingPitchRollQuaternion(coordinateToPosition(element.gasStationPoi.gcj02_coordinate), hpr),
                                    detail_address: element.gasStationPoi.detail_address,
                                    gcj02_position: coordinateToPosition(element.gasStationPoi.gcj02_coordinate),
                                    wgs84_position: coordinateToPosition(element.gasStationPoi.wgs84_coordinate),
                                    position: coordinateToPosition(element.gasStationPoi.gcj02_coordinate),
                                    label: new Cesium.LabelGraphics({
                                        scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                        text: "目的地：" + element.origin_address,
                                        font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                                        pixelOffset: new Cesium.Cartesian2(0.0, -90),
                                        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                        showBackground:true,
                                        backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                        backgroundPadding:new Cesium.Cartesian2(15, 15),
                                    }),
                                    billboard: {
                                        image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                                    }
                                });
                                ds.entities.add({
                                    entity_type: "polyline",
                                    gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polylines),
                                    wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polylines),
                                    polyline: {
                                        show: true,
                                        positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polylines),
                                        material : window.LogisticsTurnMapColors[i%10],
                                        clampToGround : true,
                                        width: 5
                                    }
                                });
                            }
                            $.xmMapViewer.dataSources.add(ds);
                        } else {
                            $('#toastInfo').toast({
                                delay: 3000,
                                autohide: true
                            });
                            $('#toastInfo').toast('show');
                            ds.entities.add({
                                detail_address: detail_address,
                                gcj02_position: coordinateToPosition(gcj02_coordinate),
                                wgs84_position: coordinateToPosition(wgs84_coordinate),
                                position: coordinateToPosition(gcj02_coordinate),
                                label: new Cesium.LabelGraphics({
                                    scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                    text: "目的地：" + detail_address,
                                    font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                                    pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                    pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                    showBackground:true,
                                    backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                    backgroundPadding:new Cesium.Cartesian2(15, 15),
                                }),
                                billboard: {
                                    image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                                }
                            });
                            $.xmMapViewer.camera.flyTo({
                                destination: Cesium.Cartesian3.fromDegrees(gcj02_coordinate.longitude, gcj02_coordinate.latitude, 15000.0)
                            });
                            $.xmMapViewer.dataSources.add(ds);
                        }
                    }).catch((error) => {
                        console.error(error);
                    })
                }, 5000)
            } else if (window.coordinateType.seleced === window.coordinateType.wgs84) {
                $.xmMapViewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(wgs84_coordinate.longitude, wgs84_coordinate.latitude, 25000)
                });
                window.radarScan = addRadarScan($.xmMapViewer, {
                    lon: wgs84_coordinate.longitude,//经度
                    lat: wgs84_coordinate.latitude, //纬度
                    scanColor: new Cesium.Color(0, 0, 1, 1),//红，绿，蓝，透明度
                    r: radius,//扫描半径
                    interval: 4000//时间间隔
                });
                setTimeout(function () {
                    $.xmMapViewer.scene.postProcessStages.remove(window.radarScan); //消除;
                    $.xmMapViewer.scene.globe.depthTestAgainstTerrain = false;
                    $.xmMapViewer.entities.add({
                        id: window.radarScanId,
                        gcj02_position: coordinateToPosition(gcj02_coordinate),
                        wgs84_position: coordinateToPosition(wgs84_coordinate),
                        position: coordinateToPosition(wgs84_coordinate),
                        ellipse: {
                            semiMinorAxis: radius,//指定半长轴的数值属性
                            semiMajorAxis: radius,//指定半短轴的数字属性。
                            height: 0,//一个数字属性，指定椭圆相对于椭球表面的高度。
                            fill: false,//一个布尔属性，指定椭圆是否填充了所提供的材料。空心
                            outline: true,//一个布尔属性，指定是否勾勒出椭圆。 height must be set for outline to display
                            outlineColor: Cesium.Color.BLUE,//一个属性，指定轮廓的 颜色 。
                            outlineWidth: 10 //一个数字属性，指定轮廓的宽度。
                        }
                    });
                    axios.post(window.BASE_URL + '/JT808WebApi/Poi/QueryBicyclingPoiBetweenAddress',  {gcj02_coordinate}
                    ).then((response) => {
                        console.log(response);
                        var heading = Cesium.Math.toRadians(135);
                        var pitch = 0;
                        var roll = 0;
                        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                        if (response.data.length > 0) {
                            $.xmMapViewer.camera.flyTo({
                                destination: coordinateToPosition(response.data[0].wgs84_origin, 6000)
                            });
                            for (var i = 0; i < response.data.length; i++) {
                                let element = response.data[i];
                                ds.entities.add({
                                    distance: element.distance,
                                    duration: element.duration,
                                    detail_address: element.origin_address,
                                    gcj02_position: coordinateToPosition(element.gcj02_origin),
                                    wgs84_position: coordinateToPosition(element.wgs84_origin),
                                    position: coordinateToPosition(element.wgs84_origin),
                                    label: new Cesium.LabelGraphics({
                                        scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                        text: "司机之家\n" + "总时长：" + (element.duration / 60.0).toFixed(1) + "分钟" + "\n" + "路程：" + (element.distance / 1000.0).toFixed(1) + "公里",
                                        font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                                        pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                        showBackground:true,
                                        backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                        backgroundPadding:new Cesium.Cartesian2(15, 15),
                                    }),
                                    model: {
                                        uri: window.BASE_URL_LIBS+'/gltf/gas_station.glb',
                                        minimumPixelSize : 128,
                                        maximumScale : 10000
                                    }

                                });
                                ds.entities.add({
                                    distance: element.distance,
                                    duration: element.duration,
                                    orientation: Cesium.Transforms.headingPitchRollQuaternion(coordinateToPosition(element.gasStationPoi.wgs84_coordinate), hpr),
                                    label: new Cesium.LabelGraphics({
                                        scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
                                        text: "目的地：" + element.origin_address,
                                        font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                                        pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                        showBackground:true,
                                        backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                        backgroundPadding:new Cesium.Cartesian2(15, 15),       
                                    }),
                                    billboard: {
                                        image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                                    },
                                    detail_address: element.gasStationPoi.detail_address,
                                    gcj02_position: coordinateToPosition(element.gasStationPoi.gcj02_coordinate),
                                    wgs84_position: coordinateToPosition(element.gasStationPoi.wgs84_coordinate),
                                    position: coordinateToPosition(element.gasStationPoi.wgs84_coordinate),
                                });
                                ds.entities.add({
                                    id: "logistics_route_turn_polyline_" + i,
                                    entity_type: "polyline",
                                    gcj02_positions: Cesium.Cartesian3.fromDegreesArray(element.gcj02_polylines),
                                    wgs84_positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polylines),
                                    polyline: {
                                        show: true,
                                        positions: Cesium.Cartesian3.fromDegreesArray(element.wgs84_polylines),
                                        material : window.LogisticsTurnMapColors[i%10],
                                        clampToGround : true,
                                        width: 5
                                    }
                                });
                            }
                            $.xmMapViewer.dataSources.add(ds);
                        } else {
                            $('#toastInfo').toast({
                                delay: 3000,
                                autohide: true
                            });
                            $('#toastInfo').toast('show');
                                ds.entities.add({
                                    detail_address:detail_address,
                                    gcj02_position: coordinateToPosition(gcj02_coordinate),
                                    wgs84_position: coordinateToPosition(wgs84_coordinate),
                                    position: coordinateToPosition(wgs84_coordinate),
                                    label: new Cesium.LabelGraphics({
                                        scale: 1,
                                        text: "目的地：" + detail_address,
                                        font: window.isLoad4k ? '24px sans-serif' : '16px sans-serif',
                                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                                        pixelOffset: new Cesium.Cartesian2(0.0, -40),
                                        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                                        showBackground:true,
                                        backgroundColor:new Cesium.Color(74, 107, 202, 0.4) ,
                                        backgroundPadding:new Cesium.Cartesian2(15, 15),
                                    }),
                                    billboard: {
                                        image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                                    }
                                });
                                $.xmMapViewer.camera.flyTo({
                                    destination: Cesium.Cartesian3.fromDegrees(wgs84_coordinate.longitude, wgs84_coordinate.latitude, 15000.0)
                                });
                            $.xmMapViewer.dataSources.add(ds);
                        }
                    }).catch((error) => {
                        console.error(error);
                    })
                }, 5000)
            }
            break;
        case 'logistics_clear_points':
            let ds1 = $.xmMapViewer.dataSources.getByName("logistics_route_gas_station");
            if (ds1.length > 0) {
                $.xmMapViewer.dataSources.remove(ds1[0], true);
            }
            window.radarScanId="radarScanId";
            $.xmMapViewer.entities.removeById(window.radarScanId);
            break;
    }
}

/********************************************************************************************************/
/*******************************************物流地图结束**************************************************/
/********************************************************************************************************/

/********************************************************************************************************/
/*******************************************金融地图开始**************************************************/
/********************************************************************************************************/

//金融地图-初始化地图数据
function initFinancialCustomerService() {
    let wgs84togcj02 = coordtransform.wgs84togcj02(102.56640672589998, 24.380873368750965);
    let cartographic = Cesium.Cartographic.fromDegrees(wgs84togcj02[0], wgs84togcj02[1], 0);
    let centerPoint = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
    $.xmMapViewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(102.56640672589998, 24.380873368750965, 15000.0)
    });
    $.xmMapViewer.entities.add({
        id: '小马国炬',
        position: centerPoint,
        label: new Cesium.LabelGraphics({
            scale: 1, //这里非常巧妙的先将字体大小放大一倍在缩小一倍
            text: '小马国炬',
            font: window.isLoad4k ? '32px sans-serif' : '24px sans-serif',
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP
        }),
        billboard: {
            image: window.isLoad4k ? '/static/images/transport/company-icon@2x.png' : '/static/images/transport/company-icon@1x.png'
        },
        // ellipse: {
        //     height:0,
        //     semiMinorAxis:100,
        //     semiMajorAxis:100,
        //     material:new Cesium.CircleWaveMaterialProperty({
        //         duration:2e3,
        //         gradient:5,
        //         color:new Cesium.Color(1.0, 0.0, 0.0, 1.0),
        //         count:3})
        // }
    });
    axios.get('/static/json/financialCustomerService.json').then((response) => {
        if (response.data) {
            $.xmMapViewer.entities.suspendEvents();
            response.data.map((point, index) => {
                let material = new Cesium.PolylineTrailMaterialProperty({
                    color: Cesium.Color.GREEN,
                    duration: 3000,
                    trailImage: window.isLoad4k ? "/static/images/logistics/linear-gradient1@2x.png" : "/static/images/logistics/linear-gradient1.png"
                });
                let wgs84togcj02 = coordtransform.wgs84togcj02(point.lon, point.lat);
                let cartographic = Cesium.Cartographic.fromDegrees(wgs84togcj02[0], wgs84togcj02[1], 0);
                let endPoint = $.xmMapViewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
                window.logisticsCompany[point.name] = {
                    longitude_gcj02: wgs84togcj02[0],
                    latitude_gcj02: wgs84togcj02[1]
                };
                $.xmMapViewer.entities.add({
                    id: point.name,
                    clickType: "company",

                    position: endPoint,
                    // point: new Cesium.PointGraphics({
                    //     color: Cesium.Color.RED,
                    //     pixelSize: 10
                    // }),
                    billboard: {
                        image: window.isLoad4k ? '/static/images/logistics/position@2x.png' : '/static/images/logistics/position.png'
                    },
                    ellipse: {
                        height: 0,
                        semiMinorAxis: 100,
                        semiMajorAxis: 100,
                        material: new Cesium.CircleWaveMaterialProperty({
                            duration: 2e3,
                            gradient: 5,
                            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
                            count: 3
                        })
                    }
                });
                $.xmMapViewer.entities.add({
                    polyline: {
                        positions: logisticsGenerateCurve(centerPoint, endPoint),
                        width: point.level,
                        material: material
                    }
                });
            });
            $.xmMapViewer.entities.resumeEvents();
        }
    })
}

//初始化金融统计图表
function initFinancialChart() {
    loadPieData();
    financialCobwebChart();
    loadAmountCandlestickData();
    loadOilCandlestickData();
}

//金融地图-保理业务占比
function loadPieData() {
    axios.get('./static/json/financialPieData.json').then((response) => {
        if (response.data) {
            financialPieChart(response.data)
        }
    });

    function financialPieChart(data) {
        Highcharts.chart('financialPieCharts', {
            credits: {
                enabled: false // 禁用版权信息
            },
            chart: {
                style: {
                    fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
                },
                backgroundColor: 'transparent',
                type: 'variablepie',
                // type: 'pie',

            },
            colors: Highcharts.map(['#A8FD3B', '#25A0F4', '#45E4A6', '#F9CD33', '#E46045', '#3FB1EF'], function (color) {
                return {
                    radialGradient: {cx: 0.5, cy: 0.3, r: 0.7},
                    stops: [
                        [0, color],
                        // [1, color] // darken
                        [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
                    ]
                }
            }),
            title: {
                text: ''
            },
            tooltip: {
                style: {
                    'fontSize': '17px',
                    'fontWeight': 'bold',
                    'whiteSpace': 'nowrap'
                },
                headerFormat: '<span style="color:{point.color}">\u25CF</span><span style="font-size: 18px;color:{point.color}>{point.key}</span><br/>',
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                variablepie: {
                    borderWidth: 0,
                    allowPointSelect: true,
                    cursor: 'pointer',
                    depth: window.isLoad4k ? 50 : 25,
                    dataLabels: {
                        enabled: true,
                        inside: true,
                        distance: window.isLoad4k ? 45 : 22,
                        // x:45,
                        // y:45,
                        useHTML: true,
                        format: '{name}<b>{y}%</b>',
                        style: {
                            color: '#eee',
                            fontSize: window.isLoad4k ? '24px' : '12px',
                            textOutline: 'none',
                            fontWeight: '600'
                        }
                    },
                    center: ['50%', '50%'],
                    showInLegend: true
                }
            },
            legend: {
                // width: 480,
                padding: 3,
                symbolPadding: window.isLoad4k ? 15 : 7,//图例与文字之间的间距
                itemMarginTop: 5,
                itemMarginBottom: 5,
                // itemWidth:150,
                itemStyle: {
                    fontSize: window.isLoad4k ? '24px' : '12px',
                    lineHeight: window.isLoad4k ? '20px' : '10px',
                    color: '#B5C4D0',
                    fontWeight: '500'
                },
                itemHoverStyle: {
                    color: '#fff'
                }

            },

            series: [{
                minPointSize: 10,
                innerSize: '30%',
                zMin: 0,
                name: '占比',
                data: data
            }]
        });
    }
}

function financialCobwebChart() {
    //金融地图-应收账款保理业务分析
    function randeColor(color) {
        return {
            radialGradient: {cx: 0.5, cy: 0.3, r: 0.7},
            stops: [
                [0, color],
                [1, color] // darken
            ]
        }
    }

    Highcharts.chart('financialCobwebCharts', {
        credits: {
            enabled: false // 禁用版权信息
        },
        chart: {
            style: {
                fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
            },
            backgroundColor: 'transparent',
            polar: true,
            type: 'line'
        },

        title: {
            text: '',
        },
        pane: {
            size: '80%'
        },
        xAxis: {
            categories: ['融资额', '还款额', '税收', '收益率', '风控'],
            tickmarkPlacement: 'on',
            lineWidth: 0,
            labels: {
                style: {
                    color: '#FFFFFF',//颜色
                    fontSize: window.isLoad4k ? '30px' : '15px',  //字体
                    fontWeight: '400'
                }
            },
            gridLineColor: '#112244',
            gridLineWidth: window.isLoad4k ? 3 : 1
        },
        yAxis: {
            gridLineInterpolation: 'polygon',//'circle',
            lineWidth: 0,
            min: 0,
            labels: {
                style: {
                    color: '#ccc',//颜色
                    fontSize: '14px',  //字体
                    fontWeight: '400'
                }
            },
            gridLineColor: '#112244',
            gridLineWidth: window.isLoad4k ? 3 : 1
        },
        tooltip: {
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: <b>${point.y:,.0f}</b><br/>'
        },
        legend: {
            align: 'center',
            layout: 'horizontal',
            // width: 480,
            padding: 3,
            symbolPadding: window.isLoad4k ? 15 : 7,//图例与文字之间的间距
            itemMarginTop: window.isLoad4k ? 5 : 2,
            itemMarginBottom: window.isLoad4k ? 5 : 2,
            itemWidth: window.isLoad4k ? 150 : 95,
            itemStyle: {
                fontSize: window.isLoad4k ? '24px' : '12px',
                lineHeight: window.isLoad4k ? '20px' : '10px',
                color: '#B5C4D0',
                fontWeight: '500'
            },
            itemHoverStyle: {
                color: '#fff'
            }
        },
        series: [{
            type: 'area',
            // color: 'rgba(0,148,48,1)',
            color: '#94ee39',
            name: '一季度',
            data: [43000, 19000, 70000, 35000, 17000],
            marker: {
                symbol: 'circle',
                radius: window.isLoad4k ? 4 : 2
            }
        }, {
            type: 'area',
            color: randeColor('#28acff'),
            name: '二季度',
            data: [43000, 19000, 3000, 35000, 17000],
            marker: {
                symbol: 'circle',
                radius: window.isLoad4k ? 4 : 2
            }
        }, {
            type: 'area',
            color: randeColor('#ffba31'),
            name: '三季度',
            data: [43000, 19000, 50000, 35000, 17000],
            marker: {
                symbol: 'circle',
                radius: window.isLoad4k ? 4 : 2
            }

        }, {
            type: 'area',
            color: randeColor('#ff6a4e'),
            name: '四季度',
            data: [50000, 39000, 42000, 31000, 26000],
            marker: {
                symbol: 'circle',
                radius: window.isLoad4k ? 4 : 2
            }
        }]
    });
}

//金融地图-油卡保理业务趋势图
// ---消费金额统计（元）
function loadAmountCandlestickData() {
    axios.get('./static/json/financialSpendKlineData.json').then((response) => {
        if (response.data) {
            financialAmountCandlestickChart(response.data)
        }
    });

    function financialAmountCandlestickChart(data) {
        Highcharts.chart('financialAmountCandlestickCharts', {
            credits: {
                enabled: false // 禁用版权信息
            },
            chart: {
                style: {
                    fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
                },
                backgroundColor: 'transparent',
                zoomType: 'x'
            },
            title: {
                text: '消费金额统计（元）',
                align: 'left',
                style: {
                    color: '#00FFFF',
                    fontWeight: '400',
                    fontSize: window.isLoad4k ? '30px' : '15px',
                    fontStyle: 'italic',
                    background: "#35517D",
                }
            },
            xAxis: {
                lineWidth: 0,
                tickWidth: 0,
                type: 'category',
                // type: 'datetime',
                // dateTimeLabelFormats: {
                //     millisecond: '%H:%M:%S.%L',
                //     second: '%H:%M:%S',
                //     minute: '%H:%M',
                //     hour: '%H:%M',
                //     day: '%m-%d',
                //     week: '%m-%d',
                //     month: '%Y-%m',
                //     year: '%Y'
                // },
                labels: {
                    style: {
                        color: '#FFFFFF',//颜色
                        fontSize: window.isLoad4k ? '20px' : '12px',  //字体
                        fontWeight: '400'
                    }
                }
            },
            tooltip: {
                dateTimeLabelFormats: {
                    millisecond: '%H:%M:%S.%L',
                    second: '%H:%M:%S',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%Y-%m-%d',
                    week: '%m-%d',
                    month: '%Y-%m',
                    year: '%Y'
                }
            },
            yAxis: {
                gridLineWidth: 3,
                gridLineColor: '#112244',
                labels: {
                    style: {
                        color: '#FFFFFF',//颜色
                        fontSize: window.isLoad4k ? '20px' : '12px',  //字体
                        fontWeight: '400'
                    },
                    x: -15
                },
                tickPositioner: function () {
                    let positions = [],
                        tick = Math.floor(this.dataMin),
                        increment = Math.ceil((this.dataMax - this.dataMin) / 6);
                    for (tick; tick - increment <= this.dataMax; tick += increment) {
                        positions.push(tick);
                    }
                    return positions;
                },
                title: {
                    text: ''
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, "#2BC8D6"],
                            // [1, "#2BC8D6"]
                            [1, Highcharts.Color("#2BC8D6").setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 1.5
                    },
                    lineWidth: 3,
                    lineColor: '#00FFFF',
                    color: '#00FFFF',
                    states: {
                        hover: {
                            lineWidth: 1,
                            radius: 0.5
                        }
                    },

                    threshold: null
                }
            },
            series: [{
                type: 'area',
                name: '消费金额',
                data: data
            }]
        });
    }
}

//---油量统计（升）
function loadOilCandlestickData() {
    axios.get('./static/json/financiaOilKlineData.json').then((response) => {
        if (response.data) {
            financialOilCandlestickChart(response.data)
        }
    });

    function financialOilCandlestickChart(data) {
        Highcharts.chart('financialOilCandlestickCharts', {
            credits: {
                enabled: false // 禁用版权信息
            },
            chart: {
                style: {
                    fontFamily: 'Avenir, Helvetica, Arial, sans-serif',
                },
                backgroundColor: 'transparent',
                zoomType: 'x'
            },
            title: {
                text: '油量统计（升）',
                align: 'left',
                style: {
                    color: '#F33BFF',
                    fontWeight: '400',
                    fontSize: window.isLoad4k ? '30px' : '15px',
                    fontStyle: 'italic',
                    background: "#35517D",
                }
            },
            xAxis: {
                lineWidth: 0,
                tickWidth: 0,
                type: 'category',
                // type: 'datetime',
                // dateTimeLabelFormats: {
                //     millisecond: '%H:%M:%S.%L',
                //     second: '%H:%M:%S',
                //     minute: '%H:%M',
                //     hour: '%H:%M',
                //     day: '%m-%d',
                //     week: '%m-%d',
                //     month: '%Y-%m',
                //     year: '%Y'
                // },
                labels: {
                    style: {
                        color: '#FFFFFF',//颜色
                        fontSize: window.isLoad4k ? '20px' : '12px',  //字体
                        fontWeight: '400'
                    }
                }
            },
            tooltip: {
                dateTimeLabelFormats: {
                    millisecond: '%H:%M:%S.%L',
                    second: '%H:%M:%S',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%Y-%m-%d',
                    week: '%m-%d',
                    month: '%Y-%m',
                    year: '%Y'
                }
            },
            yAxis: {
                gridLineWidth: 3,
                gridLineColor: '#112244',
                labels: {
                    style: {
                        color: '#FFFFFF',//颜色
                        fontSize: window.isLoad4k ? '20px' : '12px',  //字体
                        fontWeight: '400'
                    },
                    x: -15
                },
                tickPositioner: function () {
                    let positions = [],
                        tick = Math.floor(this.dataMin),
                        increment = Math.ceil((this.dataMax - this.dataMin) / 6);
                    for (tick; tick - increment <= this.dataMax; tick += increment) {
                        positions.push(tick);
                    }
                    return positions;
                },
                title: {
                    text: ''
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, "#DB2FE6"],
                            // [1, "#DB2FE6"]
                            [1, Highcharts.Color("#DB2FE6").setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 1.5
                    },
                    lineWidth: 3,
                    lineColor: '#F33BFF',
                    color: '#F33BFF',
                    states: {
                        hover: {
                            lineWidth: 1,
                            radius: 0.5
                        }
                    },
                    threshold: null
                }
            },
            series: [{
                type: 'area',
                name: '消耗油量',
                data: data
            }]
        });
    }
}

/********************************************************************************************************/
/*******************************************金融地图结束**************************************************/
/********************************************************************************************************/

/********************************************************************************************************/
/*******************************************地图组件******************************************************/

/********************************************************************************************************/

/**
 *圆形扩大扫描圈
 **/
function AddCircleScanPostStage(viewer, cartographicCenter, maxRadius, scanColor, duration) {
    let ScanSegmentShader =
        "uniform sampler2D colorTexture;\n" +
        "uniform sampler2D depthTexture;\n" +
        "varying vec2 v_textureCoordinates;\n" +
        "uniform vec4 u_scanCenterEC;\n" +
        "uniform vec3 u_scanPlaneNormalEC;\n" +
        "uniform float u_radius;\n" +
        "uniform vec4 u_scanColor;\n" +
        "vec4 toEye(in vec2 uv, in float depth)\n" +
        " {\n" +
        " vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n" +
        " vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n" +
        " posInCamera =posInCamera / posInCamera.w;\n" +
        " return posInCamera;\n" +
        " }\n" +
        "vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n" +
        "{\n" +
        "vec3 v01 = point -planeOrigin;\n" +
        "float d = dot(planeNormal, v01) ;\n" +
        "return (point - planeNormal * d);\n" +
        "}\n" +
        "float getDepth(in vec4 depth)\n" +
        "{\n" +
        "float z_window = czm_unpackDepth(depth);\n" +
        "z_window = czm_reverseLogDepth(z_window);\n" +
        "float n_range = czm_depthRange.near;\n" +
        "float f_range = czm_depthRange.far;\n" +
        "return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n" +
        "}\n" +
        "void main()\n" +
        "{\n" +
        "gl_FragColor = texture2D(colorTexture, v_textureCoordinates);\n" +
        "float depth = getDepth( texture2D(depthTexture, v_textureCoordinates));\n" +
        "vec4 viewPos = toEye(v_textureCoordinates, depth);\n" +
        "vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n" +
        "float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n" +
        "if(dis < u_radius)\n" +
        "{\n" +
        "float f = 1.0 -abs(u_radius - dis) / u_radius;\n" +
        "f = pow(f, 4.0);\n" +
        "gl_FragColor = mix(gl_FragColor, u_scanColor, f);\n" +
        "}\n" +
        "}\n";

    let _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
    let _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1);
    let _CartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500);
    let _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1);
    let _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1);
    let _time = (new Date()).getTime();
    let _scratchCartesian4Center = new Cesium.Cartesian4();
    let _scratchCartesian4Center1 = new Cesium.Cartesian4();
    let _scratchCartesian3Normal = new Cesium.Cartesian3();
    let ScanPostStage = new Cesium.PostProcessStage({
        fragmentShader: ScanSegmentShader,
        uniforms: {
            u_scanCenterEC: function () {
                return Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
            },
            u_scanPlaneNormalEC: function () {
                let temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                let temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
                _scratchCartesian3Normal.x = temp1.x - temp.x;
                _scratchCartesian3Normal.y = temp1.y - temp.y;
                _scratchCartesian3Normal.z = temp1.z - temp.z;
                Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
                return _scratchCartesian3Normal;

            },
            u_radius: function () {
                return maxRadius * (((new Date()).getTime() - _time) % duration) / duration;
            },
            u_scanColor: scanColor
        }
    });
    viewer.scene.postProcessStages.add(ScanPostStage);
    return (ScanPostStage);

}

function addCircleScan(viewer, data) {
    viewer.scene.globe.depthTestAgainstTerrain = false; //防止移动、放大缩小会视觉偏移depthTestAgainstTerrain // 设置该属性为true之后，标绘将位于地形的顶部；如果设为false（默认值），那么标绘将位于平面上。缺陷：开启该属性有可能在切换图层时会引发标绘消失的bug。
    if (data.cartographic) {
        return AddCircleScanPostStage(viewer, data.cartographic, data.r, data.scanColor, data.interval);
    } else {
        let CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(data.lon), Cesium.Math.toRadians(data.lat), 0); //中心位子
        return AddCircleScanPostStage(viewer, CartographicCenter, data.r, data.scanColor, data.interval);
    }
}

/**
 *区域雷达扫描
 * */
function AddRadarScanPostStage(viewer, cartographicCenter, radius, scanColor, duration) {
    let ScanSegmentShader =
        "uniform sampler2D colorTexture;\n" +
        "uniform sampler2D depthTexture;\n" +
        "varying vec2 v_textureCoordinates;\n" +
        "uniform vec4 u_scanCenterEC;\n" +
        "uniform vec3 u_scanPlaneNormalEC;\n" +
        "uniform vec3 u_scanLineNormalEC;\n" +
        "uniform float u_radius;\n" +
        "uniform vec4 u_scanColor;\n" +
        "vec4 toEye(in vec2 uv, in float depth)\n" +
        " {\n" +
        " vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));\n" +
        " vec4 posInCamera =czm_inverseProjection * vec4(xy, depth, 1.0);\n" +
        " posInCamera =posInCamera / posInCamera.w;\n" +
        " return posInCamera;\n" +
        " }\n" +
        "bool isPointOnLineRight(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt)\n" +
        "{\n" +
        "vec3 v01 = testPt - ptOnLine;\n" +
        "normalize(v01);\n" +
        "vec3 temp = cross(v01, lineNormal);\n" +
        "float d = dot(temp, u_scanPlaneNormalEC);\n" +
        "return d > 0.5;\n" +
        "}\n" +
        "vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point)\n" +
        "{\n" +
        "vec3 v01 = point -planeOrigin;\n" +
        "float d = dot(planeNormal, v01) ;\n" +
        "return (point - planeNormal * d);\n" +
        "}\n" +
        "float distancePointToLine(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt)\n" +
        "{\n" +
        "vec3 tempPt = pointProjectOnPlane(lineNormal, ptOnLine, testPt);\n" +
        "return length(tempPt - ptOnLine);\n" +
        "}\n" +
        "float getDepth(in vec4 depth)\n" +
        "{\n" +
        "float z_window = czm_unpackDepth(depth);\n" +
        "z_window = czm_reverseLogDepth(z_window);\n" +
        "float n_range = czm_depthRange.near;\n" +
        "float f_range = czm_depthRange.far;\n" +
        "return (2.0 * z_window - n_range - f_range) / (f_range - n_range);\n" +
        "}\n" +
        "void main()\n" +
        "{\n" +
        "gl_FragColor = texture2D(colorTexture, v_textureCoordinates);\n" +
        "float depth = getDepth( texture2D(depthTexture, v_textureCoordinates));\n" +
        "vec4 viewPos = toEye(v_textureCoordinates, depth);\n" +
        "vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);\n" +
        "float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);\n" +
        "float twou_radius = u_radius * 2.0;\n" +
        "if(dis < u_radius)\n" +
        "{\n" +
        "float f0 = 1.0 -abs(u_radius - dis) / u_radius;\n" +
        "f0 = pow(f0, 64.0);\n" +
        "vec3 lineEndPt = vec3(u_scanCenterEC.xyz) + u_scanLineNormalEC * u_radius;\n" +
        "float f = 0.0;\n" +
        "if(isPointOnLineRight(u_scanCenterEC.xyz, u_scanLineNormalEC.xyz, prjOnPlane.xyz))\n" +
        "{\n" +
        "float dis1= length(prjOnPlane.xyz - lineEndPt);\n" +
        "f = abs(twou_radius -dis1) / twou_radius;\n" +
        "f = pow(f, 3.0);\n" +
        "}\n" +
        "gl_FragColor = mix(gl_FragColor, u_scanColor, f + f0);\n" +
        "}\n" +
        "}\n";

    let _Cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
    let _Cartesian4Center = new Cesium.Cartesian4(_Cartesian3Center.x, _Cartesian3Center.y, _Cartesian3Center.z, 1);
    let _CartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500);
    let _Cartesian3Center1 = Cesium.Cartographic.toCartesian(_CartographicCenter1);
    let _Cartesian4Center1 = new Cesium.Cartesian4(_Cartesian3Center1.x, _Cartesian3Center1.y, _Cartesian3Center1.z, 1);
    let _CartographicCenter2 = new Cesium.Cartographic(cartographicCenter.longitude + Cesium.Math.toRadians(0.001), cartographicCenter.latitude, cartographicCenter.height);
    let _Cartesian3Center2 = Cesium.Cartographic.toCartesian(_CartographicCenter2);
    let _Cartesian4Center2 = new Cesium.Cartesian4(_Cartesian3Center2.x, _Cartesian3Center2.y, _Cartesian3Center2.z, 1);
    let _RotateQ = new Cesium.Quaternion();
    let _RotateM = new Cesium.Matrix3();
    let _time = (new Date()).getTime();
    let _scratchCartesian4Center = new Cesium.Cartesian4();
    let _scratchCartesian4Center1 = new Cesium.Cartesian4();
    let _scratchCartesian4Center2 = new Cesium.Cartesian4();
    let _scratchCartesian3Normal = new Cesium.Cartesian3();
    let _scratchCartesian3Normal1 = new Cesium.Cartesian3();
    let ScanPostStage = new Cesium.PostProcessStage({
        fragmentShader: ScanSegmentShader,
        uniforms: {
            u_scanCenterEC: function () {
                return Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
            },
            u_scanPlaneNormalEC: function () {
                let temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                let temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
                _scratchCartesian3Normal.x = temp1.x - temp.x;
                _scratchCartesian3Normal.y = temp1.y - temp.y;
                _scratchCartesian3Normal.z = temp1.z - temp.z;
                Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
                return _scratchCartesian3Normal;

            },
            u_radius: radius,
            u_scanLineNormalEC: function () {
                let temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center, _scratchCartesian4Center);
                let temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center1, _scratchCartesian4Center1);
                let temp2 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, _Cartesian4Center2, _scratchCartesian4Center2);
                _scratchCartesian3Normal.x = temp1.x - temp.x;
                _scratchCartesian3Normal.y = temp1.y - temp.y;
                _scratchCartesian3Normal.z = temp1.z - temp.z;
                Cesium.Cartesian3.normalize(_scratchCartesian3Normal, _scratchCartesian3Normal);
                _scratchCartesian3Normal1.x = temp2.x - temp.x;
                _scratchCartesian3Normal1.y = temp2.y - temp.y;
                _scratchCartesian3Normal1.z = temp2.z - temp.z;
                let tempTime = (((new Date()).getTime() - _time) % duration) / duration;
                Cesium.Quaternion.fromAxisAngle(_scratchCartesian3Normal, tempTime * Cesium.Math.PI * 2, _RotateQ);
                Cesium.Matrix3.fromQuaternion(_RotateQ, _RotateM);
                Cesium.Matrix3.multiplyByVector(_RotateM, _scratchCartesian3Normal1, _scratchCartesian3Normal1);
                Cesium.Cartesian3.normalize(_scratchCartesian3Normal1, _scratchCartesian3Normal1);
                return _scratchCartesian3Normal1;
            },
            u_scanColor: scanColor
        }
    });
    viewer.scene.postProcessStages.add(ScanPostStage);
    return (ScanPostStage);

}

function addRadarScan(viewer, data) {

    viewer.scene.globe.depthTestAgainstTerrain = true; //防止移动、放大缩小会视觉偏移depthTestAgainstTerrain
    // 设置该属性为true之后，标绘将位于地形的顶部；如果设为false（默认值），那么标绘将位于平面上。
    // 缺陷：开启该属性有可能在切换图层时会引发标绘消失的bug。

    let CartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(data.lon), Cesium.Math.toRadians(data.lat), 0); //中心位子
    return AddRadarScanPostStage(viewer, CartographicCenter, data.r, data.scanColor, data.interval);
}