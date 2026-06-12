const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.voixavenir.nmv0roe.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('SRV Resolution failed:', err);
    } else {
        console.log('SRV Addresses:', addresses);
    }
    
    dns.resolveTxt('voixavenir.nmv0roe.mongodb.net', (err, txts) => {
        if (err) {
            console.error('TXT Resolution failed:', err);
        } else {
            console.log('TXT Records:', txts);
        }
        process.exit();
    });
});
