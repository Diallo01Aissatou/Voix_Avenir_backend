const dns = require('dns');

dns.setServers(['8.8.8.8']);

dns.resolveSrv('_mongodb._tcp.voixavenir.nmv0roe.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('SRV Resolution failed with Google DNS:', err);
    } else {
        console.log('SRV Addresses with Google DNS:', addresses);
        
        // Resolve one of the addresses to IP
        if (addresses.length > 0) {
            dns.resolve4(addresses[0].name, (err, ips) => {
                if (err) {
                    console.error(`Failed to resolve IP for ${addresses[0].name}:`, err);
                } else {
                    console.log(`IPs for ${addresses[0].name}:`, ips);
                }
            });
        }
    }
    
    dns.resolveTxt('voixavenir.nmv0roe.mongodb.net', (err, txts) => {
        if (err) {
            console.error('TXT Resolution failed with Google DNS:', err);
        } else {
            console.log('TXT Records with Google DNS:', txts);
        }
    });
});
