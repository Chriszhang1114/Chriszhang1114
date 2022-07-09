/* eslint-disable */
/**
 * Name oyoJsBridge
 * Version 1.0.0
 * Create 2019-03-13
 * Contributor wanlixin gongguodong zhanglei
 * Function Interactive communication between H5 and Native
 */
 (function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : ((global = global || self), (global.jsBridge = factory()));
})(this, function() {
  "use strict";
  var userAgent = navigator.userAgent;
  var jsBridge = {
    // 记录添加的监听器
    _listeners: {},
    isIos: /Mac OS/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isOyoIosApp:
      /oyo-consumer-ios/.test(userAgent) || /App\/iOS/.test(userAgent),
    isOyoAndroidApp:
      /oyo-consumer-android/.test(userAgent) || /App\/Android/.test(userAgent),
    isPolestarIosApp:
      /polestar-consumer-ios/.test(userAgent) || /App\/iOS/.test(userAgent),
    isPolestarAndroidApp:
      /polestar-consumer-android/.test(userAgent) ||
      /App\/Android/.test(userAgent),
    // 判断ua是android还是ios的标识
    UAIdentifierAndroid: "com.oyohotels.consumer,",
    UAIdentifierIOSConsumer: "cn.oyohotels.oyo.china,",
    UAIdentifierIOSTest: "cn.oyohotels.enterprise.oyo.china,",
    // 判断新旧版本scheme
    UASchemeNew: "cnoyoconsumer://",
    UASchemeOld: "oyohotels://",
    // 区分新老版本 临界 1.7.5及以上为新版本
    versionCritical: {
      x: 1,
      y: 7,
      z: 5
    },
    // 老版本使用的是base64加码, 所以还需要兼容老版本
    base64: {
      _keyStr:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      _utf8_encode: function _utf8_encode(string) {
        var _string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < _string.length; n++) {
          var c = _string.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          } else if (c > 127 && c < 2048) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          } else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }
        }
        return utftext;
      },
      encode: function encode(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        var _input = this._utf8_encode(input);
        while (i < _input.length) {
          chr1 = _input.charCodeAt(i++);
          chr2 = _input.charCodeAt(i++);
          chr3 = _input.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;
          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }
          output =
            output +
            this._keyStr.charAt(enc1) +
            this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) +
            this._keyStr.charAt(enc4);
        }
        return output;
      },
      _utf8_decode: function _utf8_decode(utftext) {
        var string = "";
        var i = 0;
        var c = 0;
        var c1 = 0;
        var c2 = 0;
        var c3 = 0;
        while (i < utftext.length) {
          c = utftext.charCodeAt(i);
          if (c < 128) {
            string += String.fromCharCode(c);
            i++;
          } else if (c > 191 && c < 224) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
          } else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(
              ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
            );
            i += 3;
          }
        }
        return string;
      },
      decode: function decode(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        var _input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < _input.length) {
          enc1 = this._keyStr.indexOf(_input.charAt(i++));
          enc2 = this._keyStr.indexOf(_input.charAt(i++));
          enc3 = this._keyStr.indexOf(_input.charAt(i++));
          enc4 = this._keyStr.indexOf(_input.charAt(i++));
          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;
          output = output + String.fromCharCode(chr1);
          if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
          }
        }
        output = this._utf8_decode(output);
        return output;
      }
    },
    // 所有原生端对h5提供的可交互scheme
    mappingScheme: function(key) {
      var scheme =
        this.isOyoIosApp && !this.isNewVersion()
          ? this.UASchemeOld
          : this.UASchemeNew;
      var schemes = {
        login: scheme + "account/loginIdentifier", // android 1.7.5开始支持
        token: scheme + "account/tokenIdentifier", // android 1.7.5开始支持
        guid: scheme + "consumer/guidIdentifier", // android 1.7.5开始支持
        homepage: scheme + "home/homepageIdentifier",
        hotelSearch: scheme + "hotel/hotelSearchResultIdentifier",
        // 1.8.5 开始都是以Service命名
        share: scheme + "Service/share", // 分享好友 ,分享朋友圈,保存照片到本地 , 粘贴  shareType 对应值分别是  1,2,3,4
        newToken: scheme + "Service/tokenIdentifier", // 1.8.5 使用这个scheme获取token；易善亮保证不会再改
        newGuid: scheme + "Service/guidIdentifier", // 1.8.5 使用这个scheme获guid；易善亮保证不会再改
        hotelDetail: scheme + "hotel/hotelDetailIdentifier", // 1.8.5 开始支持 全日房
        hourRoomDetail: scheme + "hotel/HourRoomDetailIdentifier" // 1.8.5 开始支持 钟点房
      };
      return schemes[key];
    },
    // 所有原生端对h5提供的可交互scheme
    mappingPolestarScheme: function(key) {
      var schemes = {
        goBack: "polestar://webview/goBack"
      };
      return schemes[key];
    },
    isNewVersion: function() {
      var UAIdentifier = "";
      if (this.isAndroid) {
        UAIdentifier = this.UAIdentifierAndroid;
      } else if (this.isIos) {
        if (userAgent.indexOf(this.UAIdentifierIOSConsumer) > -1) {
          UAIdentifier = this.UAIdentifierIOSConsumer;
        } else if (userAgent.indexOf(this.UAIdentifierIOSTest) > -1) {
          UAIdentifier = this.UAIdentifierIOSTest;
        }
      }
      var version = userAgent.split(UAIdentifier)[1].split(" ")[0];
      var versionNumberList = version.split(".");
      var x = +versionNumberList[0];
      var y = +versionNumberList[1];
      var z = +versionNumberList[2];
      return (
        x > this.versionCritical.x ||
        y > this.versionCritical.y ||
        (y === this.versionCritical.y && z >= this.versionCritical.z)
      );
    },
    // 暴露出去的调用方法
    callNative: function(opt) {
      var _this = this;
      var _url = this.mappingScheme(opt.scheme);
      var params = opt.data;
      var success = opt.success || function() {};
      var fail = opt.fail || function() {};
      // if (!_url) {console.warn('请确认您传入的schemeIdentifier是否符合APP端要求！');return}
      try {
        // 与微信小程序通讯
        window.wx &&
          window.wx.miniProgram.getEnv(function(res) {
            // params有值就是向小程序发送数据，反之则是从小程序获取数据
            if (res.miniprogram) {
              // 向小程序发送消息，会在特定时机（小程序后退、组件销毁、分享）触发组件的message事件; 小程序固定写死通过miniappdata字段传值过来
              var miniappdata = _this.getParamsByUrl().miniappdata;
              if (miniappdata) {
                var _params = JSON.parse(decodeURIComponent(miniappdata));
                success(_params);
              } else {
                window.wx.miniProgram.postMessage({
                  data: JSON.stringify(params)
                });
              }
            }
          });
        // 与native app通讯
        if (this.isOyoAndroidApp || this.isOyoIosApp) {
          this.isNewVersion()
            ? this.newVersionCallback(_url, params, success)
            : this.oldVersionCallback(_url, params, success);
        }
        // this.newVersionCallback(_url, params, success)
      } catch (error) {
        fail(error);
      }
    },
    //  android和ios会直接回调这个方法并把数据带过来，所以不能用this
    _oyoBridgeCb: function(res) {
      try {
        var _res = jsBridge.isNewVersion()
          ? JSON.parse(decodeURI(res))
          : JSON.parse(jsBridge.base64.decode(res));
        var callbackId = _res.callbackId;
        jsBridge._listeners[callbackId](_res.result);
        delete jsBridge._listeners[callbackId];
      } catch (err) {
        console.warn(err.message);
      }
    },
    //  android和ios会直接回调这个方法并把数据带过来，所以不能用this
    polestarBridgeCb: function(res) {
      // console.log(res, 'res')
      // console.log(JSON.parse(decodeURI(res)), 'res====')
      try {
        var _res = JSON.parse(decodeURI(res));
        var callbackId = _res.callbackId;
        var result = _res.result;
        jsBridge._listeners[callbackId](result);
        delete jsBridge._listeners[callbackId];
      } catch (err) {
        console.warn(err.message);
      }
    },
    polestarCallback: function(opt, params) {
      var _this = this;
      var _url = this.mappingPolestarScheme(opt.scheme);
      var success = opt.success || function() {};
      var callbackId = "cb" + Date.now();
      var request = _this.assign(params, {
        callbackId: callbackId
      });
      _this._listeners[callbackId] = success;
      _url = _url + "?data=" + encodeURI(JSON.stringify(request));
      if (_this.isAndroid) {
        window.chromium
          ? window.chromium.postMessage(_url)
          : document.addEventListener(
              "chromiumReady",
              function() {
                window.chromium.postMessage(_url);
              },
              false
            );
      } else if (_this.isIos) {
        window.webkit &&
          window.webkit.messageHandlers.dispatch.postMessage(_url);
      }
    },
    newVersionCallback: function(url, params, success) {
      var _this = this;
      var _url;
      var callbackId = "cb" + Date.now();
      var request = _this.assign(params, {
        callbackId: callbackId
      });
      _this._listeners[callbackId] = success;
      _url = url + "?data=" + encodeURI(JSON.stringify(request));
      // console.log(_url, "-url=======");
      if (_this.isOyoAndroidApp) {
        window.chromium
          ? window.chromium.postMessage(_url, _this._oyoBridgeCb)
          : document.addEventListener(
              "chromiumReady",
              function() {
                window.chromium.postMessage(_url, _this._oyoBridgeCb);
              },
              false
            );
      } else if (_this.isOyoIosApp) {
        window.webkit &&
          window.webkit.messageHandlers.dispatch.postMessage(_url);
      }
    },
    oldVersionCallback: function(url, params, success) {
      var _url;
      var callbackId = "cb" + Date.now();
      // 历史遗留问题：只要老版本调用homepage时候，data值必须为''
      var param =
        url.indexOf("homepageIdentifier") > -1 ? "" : this.assign(params);
      var request = {
        callback: {
          callbackId: callbackId,
          callback: "jsBridge._oyoBridgeCb"
        },
        params: param
      };
      _url =
        url +
        "?params=" +
        encodeURI(this.base64.encode(JSON.stringify(request)));
      if (this.isIos || this.isOyoIosApp) {
        this._listeners[callbackId] = success;
        window.webkit &&
          window.webkit.messageHandlers.dispatch.postMessage(_url);
      } else if (this.isAndroid || this.isOyoAndroidApp) {
        // 历史遗留问题，兼容春雷行动老版本的调用方法
        var method =
          url.indexOf("hotelSearchResultIdentifier") > -1
            ? "openHotelList"
            : "h5callNative";
        window.oyo && window.oyo[method](_url);
      }
    },
    // 仅支持最多两个参数的克隆、合并
    assign: function(targetObj, newObj) {
      var _targetObj = this.isObject(targetObj) ? targetObj : {};
      var _newObj = this.isObject(newObj) ? newObj : {};
      var _obj = new Object();
      for (var i in _targetObj) {
        _obj[i] = _targetObj[i];
      }
      for (var j in _newObj) {
        _obj[j] = _newObj[j];
      }
      return _obj;
    },
    isObject: function(obj) {
      return Object.prototype.toString.call(obj) === "[object Object]";
    },
    // 解析url里面的参数
    getParamsByUrl: function() {
      var url = location.href;
      var query = new Object();
      if (url.indexOf("?") !== -1) {
        var str = url.split("?")[1];
        var strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
          var item = strs[i].split("=");
          query[item[0]] = decodeURI(item[1]);
        }
      }
      return query;
    }
  };
  return jsBridge;
});
