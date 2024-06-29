import net from "net";
import os from "os";

class LanScan {
	private readonly port: number;
	private readonly timeout: number;

	/**
	 * Creates a new LanScan instance.
	 *
	 * @param port - The port to scan for. It must be a number between 1 and
	 *     65535. If a string is provided, it will be converted to a number.
	 * @param timeout - Optional. Timeout in milliseconds for each port
	 *     connection attempt. Default is 2000 ms.
	 */
	public constructor(port: number | string, timeout = 2000) {
		this.port = Number(port);
		if (!this.port || this.port <= 0 || this.port > 65535) {
			throw new Error("Invalid port number");
		}
		this.timeout = timeout;
	}

	#checkPortOpen(ip: string): Promise<{
		ip: string;
		open: boolean;
	}> {
		return new Promise((resolve) => {
			const socket = new net.Socket();
			socket.setTimeout(this.timeout);
			socket
				.on("connect", () => {
					socket.destroy();
					resolve({
						ip: ip,
						open: true,
					});
				})
				.on("error", () => {
					socket.destroy();
					resolve({
						ip: ip,
						open: false,
					});
				})
				.on("timeout", () => {
					socket.destroy();
					resolve({
						ip: ip,
						open: false,
					});
				})
				.connect(this.port, ip);
		});
	}

	/**
	 * Gets the local IP address of the machine. It will skip virtual interfaces
	 * like `vEthernet` and `VMware`.
	 *
	 * @returns the local IP address of the machine, or `null` if not found.
	 */
	public static getLocalIp(): string | null {
		const interfaces = os.networkInterfaces();
		let result = null;
		for (const key in interfaces) {
			const iface = interfaces[key];
			if (
				!iface ||
				key.includes("CloudflareWARP") ||
				key.includes("vEthernet") ||
				key.includes("VMware")
			) {
				continue;
			}
			for (const info of iface) {
				if (!info.internal && info.family === "IPv4") {
					result = info.address;
					if (result.startsWith("192.168.")) {
						return result;
					}
				}
			}
		}
		return result;
	}

	#ipRange(baseIp: string): {
		end: string;
		start: string;
	} {
		const parts = baseIp.split(".").map((part) => {
			return parseInt(part, 10);
		});
		parts[3] = 1;
		const start = parts.join(".");
		parts[3] = 254;
		const end = parts.join(".");
		return {
			end: end,
			start: start,
		};
	}

	/**
	 * Performs a scan on the network.
	 *
	 * @returns a promise that resolves to an array of IP addresses where the
	 *     specified port is open.
	 */
	public async scanNetwork(): Promise<string[]> {
		const localIp = LanScan.getLocalIp();
		if (!localIp) {
			return [];
		}
		const { start, end } = this.#ipRange(localIp);
		const startParts = start.split(".").map((part) => {
			return parseInt(part, 10);
		});
		const endParts = end.split(".").map((part) => {
			return parseInt(part, 10);
		});
		const promises = [];
		for (let i = startParts[2]; i <= endParts[2]; i++) {
			for (let j = startParts[3]; j <= endParts[3]; j++) {
				const ip = `${startParts[0]}.${startParts[1]}.${i}.${j}`;
				if (ip === localIp) {
					continue;
				}
				promises.push(this.#checkPortOpen(ip));
			}
		}
		const results = await Promise.allSettled(promises);
		const openIps = results
			.filter((result) => {
				return result.status === "fulfilled" && result.value.open;
			})
			.map((result) => {
				if (result.status !== "fulfilled") {
					return "";
				}
				return result.value.ip;
			});
		return openIps;
	}
}

export default LanScan;
