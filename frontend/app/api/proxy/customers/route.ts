export async function POST(req: Request) {
  try {
    const body = await req.text();
    const targetBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://cytotoxic-peptonelike-dannie.ngrok-free.dev';

    const res = await fetch(`${targetBase}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      // No need for credentials; this runs server-side
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (e: any) {
    console.error('Proxy /api/proxy/customers error:', e);
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


