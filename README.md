# lan-scan

A Node.js library for scanning local networks to find IP addresses that have a
specific port open.

## Installation

```bash
npm install lan-scan
```

## Usage

```javascript
import LanScan from "lan-scan";

const PORT = 80;

const lanScan = new LanScan(PORT);
const openIps = await lanScan.scanNetwork();
console.log(openIps); // ["192.168.1.1"]
```

## API

`constructor(port: number | string, timeout?: number)`

-   `port`: The port to scan for. It must be a number between 1 and 65535. If a
    string is provided, it will be converted to a number.
-   `timeout`: Optional. Timeout in milliseconds for each port connection attempt.
    Default is 2000 ms.

`async scanNetwork(): Promise<string[]>`

-   Performs a scan on the network. Returns a promise that resolves to an array of
    IP addresses where the specified port is open.

`static getLocalIp(): string | null`

-   Gets the local IP address of the machine. It will skip virtual interfaces like
    `vEthernet` and `VMware`.
-   Returns the local IP address of the machine or `null` if not found.

## License

[MIT](LICENSE).
