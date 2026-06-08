import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = MOCK_USERS.find((u) => u.id === token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}
