import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    let configs = await prisma.platformConfig.findMany();

    if (configs.length === 0) {
      await prisma.platformConfig.create({
        data: { key: "commission_percent", value: "5", description: "Platform commission percentage deducted from each booking" },
      });
      configs = await prisma.platformConfig.findMany();
    }

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    return apiResponse(configMap);
  } catch (err) {
    console.error("Get config error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { configs } = await req.json();

    if (!Array.isArray(configs)) {
      return apiError("Invalid request body", 400);
    }

    const upserts = configs.map((c: { key: string; value: string }) =>
      prisma.platformConfig.upsert({
        where: { key: c.key },
        update: { value: c.value },
        create: { key: c.key, value: c.value },
      })
    );

    await Promise.all(upserts);

    const updated = await prisma.platformConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const c of updated) {
      configMap[c.key] = c.value;
    }

    return apiResponse(configMap);
  } catch (err) {
    console.error("Update config error:", err);
    return apiError("Internal server error", 500);
  }
}
