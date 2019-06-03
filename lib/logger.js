'use strict';

const Database = require('better-sqlite3');
const config = require('config');
const db = new Database(config.get('logs'));

const logfields = ['start', 'end', 'status', 'resource', 'query', 'message'];
const insert = db.prepare(`INSERT INTO log (${logfields.join(', ')}) VALUES (${logfields.map(e => '?').join(', ')})`);

module.exports = {

    log: function(params) {

        let logparams = [];
        logfields.forEach(el => {
            logparams.push(params[el])
        });

        insert.run(logparams);
    }

};

// request = { 
//     headers: { 
//         host: 'localhost:3030',
//        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:67.0) Gecko/20100101 Firefox/67.0',
//        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
//        'accept-language': 'en-US,en;q=0.5',
//        'accept-encoding': 'gzip, deflate',
//        connection: 'keep-alive',
//        'upgrade-insecure-requests': '1',
//        'cache-control': 'max-age=0' 
//     },
//     info: { 
//         received: 1559564795546,
//         remoteAddress: '127.0.0.1',
//         remotePort: 50999,
//         referrer: '',
//         host: 'localhost:3030',
//         hostname: 'localhost',
//         id: '1559564795546:lucknow.local:32455:jwgclzyj:10000',
//         acceptEncoding: 'gzip',
//         cors: { isOriginMatch: true },
//         responded: 1559564795589,
//         completed: 1559564795590 
//     },
//     method: 'get',
//     orig: { 
//         query: {
//           size: '30',
//           communities: 'biosyslit',
//           access_right: 'open',
//           type: 'image',
//           summary: 'false',
//           images: 'true',
//           q: 'maratus',
//           page: '1' 
//         } 
//     },
//     path: '/v1/records',
//     raw: { 
//         req: {
//             url: '/v1/records?size=30&communities=biosyslit&access_right=open&type=image&summary=false&images=true&q=maratus&page=1',
//             method: 'GET'
//         },
//        res: {
//             _header: 'HTTP/1.1 200 OK\r\ncontent-type: application/json; charset=utf-8\r\nvary: origin,accept-encoding\r\naccess-control-expose-headers: WWW-Authenticate,Server-Authorization\r\ncache-control: no-cache\r\ncontent-encoding: gzip\r\nDate: Mon, 03 Jun 2019 12:26:35 GMT\r\nConnection: keep-alive\r\nTransfer-Encoding: chunked\r\n\r\n' 
//         } 
//     },
//     response: { statusCode: 200 },
//     route: {
//         method: 'get',
//         path: '/v1/records'
//     },
//     query: {
//        size: 30,
//        communities: 'biosyslit',
//        access_right: 'open',
//        type: 'image',
//        summary: false,
//        images: true,
//        q: 'maratus',
//        page: 1,
//        refreshCache: false 
//     },
//     server: { 
//         info: { 
//             created: 1559564793163,
//             started: 1559564794322,
//             host: 'localhost',
//             port: 3030,
//             protocol: 'http',
//             id: 'lucknow.local:32455:jwgclzyj',
//             uri: 'http://localhost:3030',
//             address: '127.0.0.1' 
//         }
//     },
//     url: {
//         href: 'http://localhost:3030/v1/records?size=30&communities=biosyslit&access_right=open&type=image&summary=false&images=true&q=maratus&page=1',
//        origin: 'http://localhost:3030',
//        protocol: 'http:',
//        username: '',
//        password: '',
//        host: 'localhost:3030',
//        hostname: 'localhost',
//        port: '3030',
//        pathname: '/v1/records',
//        search: '?size=30&communities=biosyslit&access_right=open&type=image&summary=false&images=true&q=maratus&page=1',
//        searchParams: {
//             'size' => '30',
//             'communities' => 'biosyslit',
//             'access_right' => 'open',
//             'type' => 'image',
//             'summary' => 'false',
//             'images' => 'true',
//             'q' => 'maratus',
//             'page' => '1' 
//         },
//        hash: '' 
//     }
// }