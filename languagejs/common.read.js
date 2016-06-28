if (!common) {
    var common = {};
}
//多语言读取文件
common.read = {
    /**
    * 本站点的根路径
    **/
    rootUrl: '/',
    /**
    * JS包的根路径
    **/
    jsUrl: 'Scripts/epr.language/',
    /**
    * 保存的cookie名称
    **/
    cookieName: 'language',
    /**
    * 当前语言
    **/
    curLan:null,
    /**
    * 默认语言
    **/
    defaultLan: 'zh-CN',
    /**
    * 支持的语言
    */
    portLans: ['zh-CN' , 'ko-kr' , 'en-GB' , 'vi-VN' ],
    /**
    * 当前需加载的语言文件地址
    **/
    filePath: [],
    /**
    * 用于接受外部定义
    **/
    paths: [],
    /**
    * 外界传入的参数
    **/
    options:undefined
}

/**
* 加载当前文件需要加载语言包位置
* 参数:
*   { 
*    paths:相对epr.language文件下文件路径  比如:["Shared/_Layout","Production/List"],
*    curLan:当前语言
*    loaded:语言包加载完成的回调函数
*   }
**/
common.read.loadLan = function (option) {
    var option = this.options = (typeof option !== "undefined") ? option : {},
        f = this.filePath = [],
        paths = option.paths;
    if (typeof paths === "undefind") return;
    //如果不是数组,则当作string直接push
    if (paths.constructor != Array) {
        f.push(paths);
    } else {
        for (var i = 0; i < paths.length; i++) {
            f.push(paths[i]);
        }
    }
    common.read.readLan(typeof option.curLan !=="undefined"?option.curLan:null);
}

/**
* 读取当前语言
* 参数:当前语言缩写(也可以不填)
**/
common.read.readLan = function (lan) {
    var self = this;
    //获得外部文件引用
    common.read.filePath = common.read.paths;

    //处理传入的语言,如果不支持,则给予其默认的语言
    common.read.revise(lan);

    //初始化语言变量
    common.language = [];

    //引入语言包
    this.load(function () {
        //如果外部有传入loaded回调函数
        self.options?self.options.loaded? self.options.loaded(common.language):0:0;
        //语言包引入完成后,html转换内容
        self.run();
    });
}

/**
* 处理传入的语言,如果不支持,则给予其默认的语言
* 参数:语言缩写;  如果没有传入,则取cookie
**/
common.read.revise = function (lan) {
    var r = common.read,
        lan = typeof lan === "undefined" ? r.curLan ? r.curLan : r.defaultLan : lan,
        inArr = function (arr, value) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === value)
                    return true;
            }
            return false
        };
    //如果不支持,则给予其默认的语言
    r.curLan = lan = inArr(r.portLans, lan) ? lan : r.defaultLan;
}

/**
* 引入文件
**/
common.read.load = function (callback) {
    if(!common.language) common.language = [];
    this.filePath = this.paths;
    this.setLoadJS();
    this.loadJSFile(callback);
}

/**
* 定位具体要引用的是哪一个语言包
**/
common.read.setLoadJS = function () {
    var curLan = this.curLan, f = this.filePath;

    for (var i = 0; i < f.length; i++) {
        //如果含有.js尾椎 则不必处理
        if (f[i].match('.js\\b')) continue; 
        f[i] += "_" + curLan + ".js";
    }
}

/** 
* 获取JS文件
* 参数:加载完成后的回调函数
**/
common.read.loadJSFile = function (callback) {
    var f = this.filePath, num = f.length, url = common.read.rootUrl+common.read.jsUrl;
    for (var i = 0; i < num; i++) {
        var file = document.createElement('script');
        file.setAttribute('src', url + f[i]);
        document.getElementsByTagName('head')[0].appendChild(file);
        //如果最后一个文件加载完成,执行callback回调函数
        common.read.onload(file, function () {
            num--;
            if (num === 0) {
                if (callback) callback();
            }
        });
    }
}

/** 
* dom元素状态监听
* 参数:dom元素,回调函数
**/
common.read.onload = function (dom,callback) {
    if (!dom) {
        if (callback) callback();
        return;
    }
    if (dom.onreadystatechange) {
        dom.onreadystatechange = function () {
            if (callback) callback();

        }
    } else {
        dom.onload = function () {
            if (callback) callback();
        }
        dom.onerror = function () {
            if (callback) callback();
        }
    }
}


/*
* 遍历Html,转换成当前语言
* 规则:1.找属性值data-lanid的节点,替换其innerHTML;2.匹配属性值{lanKey[x]}规则的元素,替换其对应的属性值,如果其没有子节点则还需匹配其innerHTML;
*/
common.read.run = function () {
    var self = this,
       func = function () {
           var bodys = document.getElementsByTagName('body'),
               //reg1 = /\b[\s*<]\s*[^>/]+\s*>/,      //获得该节点最外层元素html
               reg = /{\s*lanKey\[['|"]*[^\]\}]+['|"]*\s*\]\s*}/g,  //{lanKey[xx]} 格式规则
               attrMatch = function (elemBute, attr, reg) {   //reg的规则 替换节点指定的属性值
                   var value = elemBute[attr],
                       match = value.match(reg); //匹配多个 {lanKey[x]}

                   if (match) {
                       for (var i = 0; i < match.length; i++) {
                           var key = match[i].replace(/{\s*lanKey\[\s*['|"]*/, "").replace(/['|"]*\s*\]\s*}/, ""),
                               msg = common.read.getMsgByLanKey(key),
                               reg2 = new RegExp("{\\s*lanKey\\[\\s*[\'|\"]*" + key + "[\'|\"]*\\s*\\]\\s*}", 'g');
                           value = value.replace(reg2, msg);
                           elemBute[attr] = value; //用msg替换对应的 整体的{lanKey[x]}
                           
                       }
                   }
               };
           for (var i = 0; i < bodys.length; i++) {
               var curBody = bodys[i],
                   lans = curBody.getElementsByTagName("*");
               for (var j = 0; j < lans.length; j++) {
                   var lan = lans[j].attributes["data-lanid"];
 
                   //循环该节点的各个属性
                   for (var i = 0; i < lans[j].attributes.length; i++) {
                       //国际化该属性的name   
                       attrMatch(lans[j].attributes[i], 'name', reg);
                       //国际化该属性的value
                       attrMatch(lans[j].attributes[i], 'value', reg);
                   }
                   //如果没有子节点,进行内容匹配
                   if (lans[j].children.length == 0) {
                       var innerHtml = common.read.trim(lans[j].innerHTML);
                       if (innerHtml.length > 0) {
                           //国际化该innerHTML
                           attrMatch(lans[j], 'innerHTML', reg);
                       }
                   }

                   //如果有定义属性data-lanid
                   if (lan) {
                       
                       var msg = self.getMsgByLanId(lan.value);
 
                       //如果返回的是 null,那么就没有意义赋值给该Html
                       if (msg === null) {
                           //lans[j].innerHTML = '-';
                           continue;
                       }
                       lans[j].innerHTML = msg;

                   }
               }

           }
       };
    //如果此时插件是在没有页面加载完成是执行,则等到页面加载完成后再执行
    if (window.document.readyState !== "complete") {
        //由于页面可能没有加载完成,body还没有加载完成和生成对象,故等到页面加载完成再执行body遍历
        if (window.document.addEventListener) {
            window.addEventListener('load', func, false);
        } else {
            window.attachEvent('onload', func);
        }
        //页面已经加载完成
    } else {
        func();
    }

}

/**
** 去除字符串的左右两边空格
** 参数:字符串
**/
common.read.trim = function (str) {
    if (typeof str !== "string") return '';
    var reg = /(^\s*)|(\s*$)/g;
    if (str.length > 0) {
        str = str.replace(reg, "");
    }
    return str;
}

/**
* 根据lanId,返回对应的msg
* 参数:lanId
**/
common.read.getMsgByLanId = function (lanId) {
    if (!lanId) return "";
    var l = common.language;
    for (var i = 0; i < l.length; i++) {
        for (var j = 0; j < l[i].length; j++) {
            var lan = l[i][j];
            if (typeof lan.lanId === "undefined") continue;
            if (lan.lanId.toString() === lanId) {
                return lan.msg;
            }
        }
    }
    return null;
}

/**
* 根据参数lanKey,获得对应的msg值
**/
common.read.getMsgByLanKey = function (lanKey) {
    if (!lanKey) return "";
    var l = common.language;
    if (!l) return null;
    for (var i = 0; i < l.length; i++) {
        for (var j = 0; j < l[i].length; j++) {
            var lan = l[i][j];
            if (typeof lan.lanKey === "undefined") continue;
            if (lan.lanKey.toString() === lanKey) {
                return lan.msg;
            }
        }
    }
    return null;
}

;(function () {
    var scr = document.getElementsByTagName('head')[0].getElementsByTagName('script');
    //执行当前(最后一个js)标签元素的代码
    new Function(scr[scr.length - 1].innerHTML)();
    
    //如果路径被定义,则执行引入语言包
    if (common.read.paths) { common.read.filePath = common.read.paths; common.read.load(); }
    
    //等到页面加载完成后执行html多语言
    var run = function () {
        //等待外部定义浏览路径,如果没有定义路径,则不必执行
        if (common.read.paths.length < 1) return;
        common.read.readLan();
    };
    //页面加载完成后,插件执行引用语言包
    $(function () { common.read.readLan(); });

})();
