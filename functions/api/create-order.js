
export async function onRequestPost({ request, env }) {
  const json = (body, status = 200) =>
    Response.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });

  try {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay configuration missing");
      return json({ error: "Payment configuration missing" }, 500);
    }

    // Temporary test: ₹50 = 5000 paise
    const body = await request.json().catch(() => null);

    if (!body || body.amount !== 5000) {
      return json(
        { error: "Invalid test amount. Use amount: 5000." },
        400
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 5000,
          currency: "INR",
          receipt: `yd_test_${crypto.randomUUID()
            .replace(/-/g, "")
            .slice(0, 20)}`,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Razorpay order creation failed", {
        httpStatus: response.status,
        code: data?.error?.code || "RAZORPAY_API_ERROR",
        description:
          data?.error?.description || "No description returned",
      });

      return json(
        {
          error: "Could not create payment order",
          razorpayStatus: response.status,
          code: data?.error?.code || "RAZORPAY_API_ERROR",
        },
        502
      );
    }

    return json({
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create-order handler failed", {
      message:
        error instanceof Error ? error.message : "Unknown error",
    });

    return json({ error: "Invalid request" }, 400);
  }
}
