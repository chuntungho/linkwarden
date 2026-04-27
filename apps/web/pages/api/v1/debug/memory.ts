import type { NextApiRequest, NextApiResponse } from "next";
import verifyUser from "@/lib/api/verifyUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await verifyUser({ req, res });
  if (!user) return;

  const mem = process.memoryUsage();
  const toMB = (b: number) => (b / 1024 / 1024).toFixed(1) + " MB";

  return res.status(200).json({
    rss: toMB(mem.rss),
    heapTotal: toMB(mem.heapTotal),
    heapUsed: toMB(mem.heapUsed),
    external: toMB(mem.external),
    arrayBuffers: toMB(mem.arrayBuffers),
    pid: process.pid,
    uptime: Math.floor(process.uptime()) + "s",
  });
}
