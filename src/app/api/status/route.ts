import { NextResponse } from 'next/server';

// GET /api/status
export async function GET() {
  try {
    // Test simple sans dépendance Prisma
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api: 'OrderSpot Pro API',
      version: '1.0.0',
      routes: [
        'GET /api/status',
        'GET /api/products',
        'POST /api/products',
        'GET /api/orders',
        'POST /api/orders',
        'GET /api/hosts',
        'POST /api/hosts',
        'GET /api/clients',
        'POST /api/clients'
      ]
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'API health check failed'
    }, { status: 500 });
  }
}
