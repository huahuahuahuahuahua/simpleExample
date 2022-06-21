// 1;//已扫描等待确定  2;//移动端确定登陆 3移动端确定超时,请刷新网页 4二维码过期,请刷新网页 5;//移动端拒绝
const crypto = require('crypto');
const QRCode = require('qrcode');
const fs = require('fs');


module.exports = {
    //生成Id
    randID() {
        function rand(len) {
            var hex = "0123456789abcdef",
                str = "",
                index = 0;
            for (len = len || 32; len > index; index++) {
                str += hex.charAt(Math.ceil(1e8 * Math.random()) % hex.length);
            }
            return str;
        }
        return (new Date).getTime() + "_" + rand();
    },
    //Md5编码
    md5(str) {
        if (Array.isArray(str)) str = str.join("__");
        let md5 = crypto.createHash('md5');
        return md5.update(str).digest('hex');
    },
    //生成二维码
    QRCode(s, opt) {
        return QRCode.toDataURL(s, opt);
    },
    //时间戳
    timestamp(a) {
        return (+new Date()) + (a || 0);
    },
    //读取文件
    readFile(a, b) {
        return fs.readFileSync(a, b);
    },
    //转base64
    base64En(str) {
        return Buffer.from(str).toString("base64");
    }
};