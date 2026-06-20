import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";
import { uploadToSupabase, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/supabase-storage";

export async function POST(req: NextRequest) {
  const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("type") as string | null;

    if (!file || !docType) {
      return apiError("File and document type are required", 400);
    }

    if (!["aadhaar", "pan", "property"].includes(docType)) {
      return apiError("Invalid document type", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Only JPEG, PNG, and PDF files are allowed", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("File size must be under 5MB", 413);
    }

    const buffer = await file.arrayBuffer();
    const path = await uploadToSupabase(user!.userId, docType as "aadhaar" | "pan" | "property", buffer, file.type, file.name);

    return apiResponse({ path, documentType: docType });
  } catch (err) {
    console.error("Upload error:", err);
    return apiError("Failed to upload file", 500);
  }
}
