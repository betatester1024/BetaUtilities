import { CourierClient } from "@trycourier/courier";
const courier = CourierClient({ authorizationToken: process.env['authToken'] }); // get from the Courier UI
// Example: send a password reset email to a user's email address
export async function mail(email: string, token: string) {
  const { requestId } = await courier.send({
    message: {
      to: {
        email: email,
      },
      content: {
        title: "Password Reset Request",
        body: "Click the following link to reset your password: https://www.example.com/reset-password?token=" + token,
      },
      routing: {
        method: "single",
        channels: ["email"],
      },
    },
  });
  console.log(requestId);
}

// requestResetPassword() is the function that handles the password reset request
const token = generateTokenForUser(); // generate token for password reset
mail(userEmail, token); // send email to user requesting password reset using the token