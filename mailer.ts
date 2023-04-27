import { CourierClient } from "@trycourier/courier";

const courier = CourierClient({ authorizationToken: process.env['authToken'] }); // get from the Courier UI

// Example: send a basic message to an email recipient
export async function mail() {
  const { requestId } = await courier.send({
    message: {
      to: {
        email: "betatester1025@protonmail.com",
      },
      content: {
        title: "This is a test ",
        body: "Self-test one oh one",
      },
      routing: {
        method: "single",
        channels: ["email"],
      },
    },
  });
  console.log(requestId);
}