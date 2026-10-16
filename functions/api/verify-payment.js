export async function onRequestPost({ request, env }) {
  try {
    if (!env.RAZORPAY_KEY_SECRET) {
      return Response.json(
        { error: "Payment configuration missing" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      typeof orderId !== "string" ||
      !/^order_[A-Za-z0-9]+$/.test(orderId) ||
      typeof paymentId !== "string" ||
      !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
      typeof signature !== "string" ||
      !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      return Response.json(
        { error: "Invalid payment details" },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signedData = encoder.encode(`${orderId}|${paymentId}`);
    const digest = await crypto.subtle.sign(
      "HMAC",
      key,
      signedData
    );

    const expectedSignature = Array.from(
      new Uint8Array(digest),
      byte => byte.toString(16).padStart(2, "0")
    ).join("");

    if (expectedSignature !== signature.toLowerCase()) {
      return Response.json(
        { verified: false, error: "Signature verification failed" },
        { status: 400 }
      );
    }

    return Response.json({ verified: true });
  } catch {
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}