const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const cookieParser = require('cookie-parser')
const Session = require('express-session');
const utils = require("./utils");
const APP_DOMAIN = "172.17.14.137";//<==自行修改
const APP_URL = "http://" + APP_DOMAIN + ":8080";
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(Session({
    name: "sid",
    secret: 'key',
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: { "maxAge": 60000 }
}));
//保存一些扫码会话信息
const CacheSession = {};
const Users = [
    { id: "01", name: "root", rname: "超级管理员", pwd: "root", mail: "cjgly@233.com", age: "28" },
    { id: "02", name: "admin", rname: "管理员", pwd: "admin", mail: "gly@233.com", age: "27" },
    { id: "03", name: "test1", rname: "测试1", pwd: "test1", mail: "cs1@233.com", age: "18" },
    { id: "04", name: "test2", rname: "测试2", pwd: "test2", mail: "cs2@233.com", age: "18" },
];

app.get('/jsQR.js', function (req, res) {
    res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" })
    res.write(utils.readFile("./jsQR.js"))
    res.send()
})

//电脑首页面
app.get('/', function (req, res) {
    if (!req.session.user) return res.redirect('/login');
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.write(`<p>用户名：${req.session.user.name}</p>
        <p>真实名：${req.session.user.rname}</p>
        <p>邮箱：${req.session.user.mail}</p>
        <p>年龄：${req.session.user.age}</p>
        <a href="/login">退出</a>`);
    res.send();
});

//电脑登陆页面
app.get('/login', function (req, res) {
    let userAgent = req.headers["user-agent"]
    let ctoken = req.session.ctoken
    if (ctoken && CacheSession[ctoken]) delete CacheSession[ctoken]
    ctoken = utils.md5(userAgent + "__" + utils.timestamp())
    CacheSession[ctoken] = {
        ip: req.ip,
        userAgent: userAgent,
        userAgentMd5: utils.md5(userAgent),
        qrcode: { expires_at: utils.timestamp(10 * 1000) }
    }
    req.session.ctoken = ctoken;
    res.session.sflag = utils.rangID()
    res.cookie('sflag', req.session.sflag, { domain: APP_DOMAIN, path: "/" });
    res.writeHead(200, { "content-type": "text.html;charset=utf-8" })
    res.write(utils.readFile("./pc_login.html"));
    res.send();
})

//获取二维码信息
app.post('/qrcode', upload.array(), function (req, res) {//  
    let ctoken = req.session.ctoken;
    if (!ctoken || !CacheSession[ctoken]) return res.json({});
    let token = req.headers["user-agent"] + (+new Date());
    token = utils.md5(token);
    CacheSession[ctoken].qrcode = { "token": token, "expires_at": utils.timestamp(60 * 1000)/*过期时间戳*/ };
    res.json(CacheSession[ctoken].qrcode);
});

app.post('/qrcode/img/:code', upload.array(), async function (req, res) {
    let userAgent = req.headers["user-agent"]
    let csession = CacheSession[req.session.ctoken]
    if (req.cookies.sflag == req.session.sflag && csession && req.params.code == csession && csession.userAgentMd5 == utils.md5(userAgent)) {
        csession.qr_url = APP_URL + "/account/scan/" + req.session.ctoken;
        csession.scan_info = { status: 0 };
        try {
            csession.img = await utils.QRCode(csession.qr_url);
            res.writeHead(200, { "content-type": "text/plain" });
            res.write(csession.img);
        } catch (error) {
            res.writeHead(404, { "content-type": "text/plain" });
        }
    }
    res.send();
})
//获取扫描状态
app.post('/qrcode/scan_info/:code',upload.array(),function (req,res) {
    let ctoken = req.session.ctoken;
    let cSession = CacheSession[ctoken];
    let scan_info = cSession ? cSession.scan_info : { status: 0 };
    if (!cSession || req.params.code != cSession.qrcode.token) return res.json({ status: -1 });
    if (cSession.qrcode.expires_at < utils.timestamp()) {
        scan_info.status = scan_info.status == 1 ? 3 : 4;
        delete CacheSession[ctoken];
    }
    if (scan_info.status == 2) {
        req.session.user = Users.find(u => u.id == cSession.data.userId);
    }
    if ([2, 3, 4, 5].indexOf(scan_info.status) >= 0 && cSession) delete CacheSession[ctoken];
    return res.json(scan_info);
})
//================================================
//假设是app首页
app.get('/app_home', function (req, res) {
    let user = req.session.user;
    if (user) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write((utils.readFile("./app_home.html", "utf8")).replace("{{uname}}", user.rname));
        res.send();
    } else {
        res.redirect('/app_login');
    }
});
//假设是app的登陆页面
app.get('/app_login', function (req, res) {
    let send = function () {
        res.write(`<html> 
        <head>
        <meta charset="UTF-8">
        </head>
        <body> <h1>APP:手机登录</h1>
            <form action="/onlogin" method="post">
                用户名: <input name="name" type="text" /><br />
                密码: <input name="pwd" type="password" />
                <input value="提交" type="submit" />
            </form>
        </body>
        </html>`);
        res.send();
    };
    req.session.destroy(function (error) {
        if (error) console.error(error);
        send();
    });
});
//提交登陆 
app.post('/onLogin', upload.array(), function (req, res) {
    let name = req.body.name;
    let pwd = req.body.pwd;
    if (name && pwd) {
        req.session.user = Users.find(u => name == u.name && pwd == u.pwd);
        if (req.session.user) return res.send(`正在跳转....<script>setTimeout(function(){location.href="/app_home";},1000);</script>`);
    }
    res.send(`<html> 
    <head>  <meta charset="UTF-8"> </head>
    <body> 登陆失败<br/><a href="/">返回首页</a></body>
    </html>`);
});

app.get('/account/scan/:code', function (req, res) {
    let code = req.params.code;
    let cSession = CacheSession[code];
    if (cSession && req.session.user) {
        //二维码是否过期
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        if (cSession.qrcode.expires_at > utils.timestamp()) {
            cSession.scan_info.status = 1;//已扫描等待确定
            cSession.qrcode.expires_at = utils.timestamp(20 * 1000);//扫码后等待手机端确定的时间
            res.write((utils.readFile("./app_auth.html", "utf8"))
                .replace("{{info_html}}", `<p>浏览器标识:${cSession.userAgent}</p><p>ip地址:${cSession.ip}</p>`)
                .replace("{{uname}}", req.session.user.rname).replace("{{code}}", code));
            return res.send();
        } else {
            cSession.scan_info.status = 4;//移动端确定超时
            res.write(`二维码已过期,请重新扫描`);
            return res.send();
        }
    }
    res.redirect('/app_home');
});
app.post("/confirm/scan/:code", upload.array(), function (req, res) {
    let code = req.params.code;
    let confirm = req.body.confirm;
    let cSession = CacheSession[code];
    if (cSession && req.session.user) {
        if (confirm) {
            cSession.scan_info.status = 2;//确定登陆
            cSession.data = { userId: req.session.user.id };
        } else {
            cSession.scan_info.status = 5;//移动端拒绝
        }
        return res.json({ res: true });
    }
    res.json({ res: false });
})