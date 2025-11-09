type Params = { params: { customerId: string } };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { customerId } = params;
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customerId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://cytotoxic-peptonelike-dannie.ngrok-free.dev';

    const res = await fetch(`${targetBase}/api/calls/${encodeURIComponent(customerId)}`, {
      method: 'POST',
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (e: any) {
    console.error('Proxy /api/proxy/calls error:', e);
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


