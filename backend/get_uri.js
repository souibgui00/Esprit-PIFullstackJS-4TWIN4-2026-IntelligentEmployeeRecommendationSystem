const dns = require('dns');
const fs = require('fs');
dns.setServers(['8.8.8.8']);
const user = 'sarra_mrabet';
const pass = 'sarra';
const srvHost = 'montaha.thpvndq.mongodb.net';

dns.resolveTxt(srvHost, (err, txt) => {
  if (err) return console.error('TXT ERR:', err);
  dns.resolveSrv('_mongodb._tcp.' + srvHost, (err2, srv) => {
    if (err2) return console.error('SRV ERR:', err2);
    
    const hosts = srv.map(s => `${s.name}:${s.port}`).sort().join(',');
    const options = txt[0][0];
    
    const standardUri = `mongodb://${user}:${pass}@${hosts}/test?${options}&tls=true&retryWrites=true&w=majority`;
    fs.writeFileSync('full_uri.txt', standardUri);
    console.log('URI written to full_uri.txt');
  });
});
