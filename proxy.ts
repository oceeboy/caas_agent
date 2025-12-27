import { NextResponse, type NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
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

  // rate limiting

  const { pathname } = req.nextUrl;
  // Example response for demonstration purposes
  // return new NextResponse(`Dashboard middleware response for ${pathname}`);

  return NextResponse.next();
}
