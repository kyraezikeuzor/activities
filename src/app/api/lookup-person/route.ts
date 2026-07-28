import { NextResponse } from "next/server";
import { getPersonByEmail } from "@/lib/peopleCache";

export const dynamic = "force-dynamic";

/**
 * Look up a People record by email.
 * POST /api/lookup-person  { email: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim() ?? "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const person = await getPersonByEmail(email);
    if (!person) {
      return NextResponse.json({ found: false, person: null });
    }

    return NextResponse.json({
      found: true,
      person: {
        id: person.id,
        email: person.email,
        displayName: person.displayName,
        initials: person.initials,
        firstName: person.firstName,
        lastName: person.lastName,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
