export async function onRequestPost({ request, env }) {
  try {
    const { amount } = await request.json();

    if (
      !Number.isInteger(amount) ||
      amount < 100 ||
      amount > 1000000
    ) {
      return Response.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return Response.json(
        { error: "Payment configuration missing" },
        { status: 500 }
      );
    }

    const auth = btoa(
      `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`
    );

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `yd_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
  const errorData = data?.error?.code || "RAZORPAY_API_ERROR";
  const errorMessage = data?.error?.description || "Payment provider error";

  console.error("Razorpay order creation failed", {
    status: response.status,
    code: errorData
  });

  return Response.json(
    {
      error: "Could not create payment order",
      razorpayStatus: response.status,
      code: errorData
    },
    { status: 502 }
  );
}
    }

    return Response.json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: env.RAZORPAY_KEY_ID
    });
  } catch {
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}