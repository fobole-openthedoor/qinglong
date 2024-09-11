/**
 * 任务名称
 * name: 妖火新私信通知
 * 定时规则
 * cron: * * * * *
 */


const { sendNotify } = require('./sendNotify.js'); // commonjs

// 需要安装cheerio依赖
const fs = require('fs');
const cheerio = require('cheerio');
const path = './notifiedMessages.json';

// 使用chrome导出的 fetch 
async function checkMessages() {
    try {
        // 从环境变量中获取 cookie
        const cookie = process.env.YAOHUO_COOKIE;
        //console.log(cookie);
        if (!cookie) {
            console.log("请在环境变量中设置 cookie。环境名为YAOHUO_COOKIE 值为 cookie");
            return;
        }
        const response = await fetch("https://yaohuo.me/bbs/messagelist.aspx?action=class&siteid=1000&classid=0&types=0&issystem=", {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=0, i",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Microsoft Edge\";v=\"126\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cookie": cookie 
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET"
        });

        const html = await response.text();
        const $ = cheerio.load(html);
        if ($('a[href="/myfile.aspx"]').length === 0) {
            console.log("无法访问私信页面,请尝试更新cookie。");
            return;
        }
        // 读取已通知的私信
        const notifiedMessages = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
        let newMessageFound = false;
        $('div.listmms').each((index, element) => {
            const isEvent = $(element).find('img[src="/NetImages/msg.png"]').length > 0; //新增非私信通知，包括评论回复、加为好友、打赏妖精
            const isNew = $(element).find('img[src="/NetImages/new.gif"]').length > 0;
            //const imgSrc = $(element).find('img').attr('src'); //取消 img 标签判断
            if (isNew) {
                newMessageFound = true;
                const messageContent = $(element).find('a').first().text().trim();
                const sender = $(element).find('span.laizi').get(0).nextSibling.nodeValue.trim();
                const timeMatch = $(element).text().match(/\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}/);
                const time = timeMatch ? timeMatch[0] : '未知时间';
                const detailLink = $(element).find('a').first().attr('href');

                // 提取最后一个 ID
                const idMatch = detailLink.match(/id=(\d+)/g);
                const messageId = idMatch ? idMatch[idMatch.length - 1].split('=')[1] : null;
                if (!notifiedMessages[messageId]) {
                    notifiedMessages[messageId] = true;
                    const type = isEvent ? "事件" : "私信";
                    const notificationContent = `来自: ${sender}\n内容: ${messageContent}\n\n时间: ${time}\n链接: https://yaohuo.me${detailLink}`;
                    notify(type,notificationContent);
                }else{
                    console.log(messageId+'已经通知过了');
                }
            }
        });
        if (!newMessageFound) {
            console.log("未获取到新私信。");
        }
        // 更新私信记录
        fs.writeFileSync(path, JSON.stringify(notifiedMessages));
    } catch (error) {
        console.error('Error checking messages:', error);
    }
}

function notify(type,message) {
    // 使用青龙的通知功能
    console.log(message); 
    sendNotify('妖火新'+type,message);
}

// 运行脚本
checkMessages();
