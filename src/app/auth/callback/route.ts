import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Supabase is not used. Redirect to login or home.
    return NextResponse.redirect(new URL('/login', request.url));
}
