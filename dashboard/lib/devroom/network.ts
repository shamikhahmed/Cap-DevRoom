import os from "os";

const PORT = Number(process.env.PORT || 3000);

/** Private LAN IPv4 addresses (Wi‑Fi / Ethernet) for iPhone access on same network */
export function getLanAddresses(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return [...new Set(ips)];
}

export function getNetworkInfo() {
  const ips = getLanAddresses();
  const primary = ips[0] ?? null;
  return {
    port: PORT,
    localhost: `http://127.0.0.1:${PORT}`,
    lan: primary ? `http://${primary}:${PORT}` : null,
    allLan: ips.map((ip) => `http://${ip}:${PORT}`),
    phoneReady: ips.length > 0,
  };
}
