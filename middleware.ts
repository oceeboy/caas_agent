import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Middleware logic here
  //   const response = new NextResponse('Middleware response');
  //   return response;

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    return handleDashboardMiddleware(req);
  }
  // Add your dashboard-specific middleware logic here
}

function handleDashboardMiddleware(req: NextRequest) {
  // LOGIC FOR DASHBOARD ROUTE GOES HERE

  return NextResponse.next();
}
