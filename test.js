import Scan from "./lib/main.js";

const PORT = 80;

console.log("Local IP:", Scan.getLocalIp());

const scan = new Scan(PORT);
const openIps = await scan.scanNetwork();
console.log("Open IPs:", openIps);
