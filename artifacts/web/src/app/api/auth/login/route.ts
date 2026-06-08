import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS } from "@/lib/constants";
import { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = MOCK_USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid credentials" },
      { status: 401 }
    );
  }
  const { password: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser, token: user.id });
}
