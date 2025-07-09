const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Resend} = require("resend");

admin.initializeApp();

const resend = new Resend("YOUR_RESEND_API_KEY_HERE");

exports.sendStatusChangeEmail = functions.firestore
    .document("promotions/{promoId}")
    .onUpdate(async (change, context) => {
      const before = change.before.data();
      const after = change.after.data();

      // Exit if status hasn't changed or there's no email
      if (before.status === after.status || !after.email) {
        return null;
      }

      let subject = "";
      if (after.status === "Approved") {
        subject = "✅ Your Promo Has Been Approved!";
      } else if (after.status === "Rejected") {
        subject = "❌ Your Promo Was Rejected";
      } else {
        return null; // Ignore other status changes
      }

      const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Your promo was 
          <span style="color:${after.status === "Approved" ? "green" : "red"};">
            ${after.status}
          </span>
        </h2>
        <p><strong>Offer:</strong> ${after.offerText}</p>
        ${after.adminNote ? `<p><strong>Admin Note:</strong> 
        ${after.adminNote}</p>` : ""}
        <p style="margin-top: 20px;">Thanks for using Promofly!</p>
      </div>
    `;

      try {
        const result = await resend.emails.send({
          from: "Promofly <noreply@yourdomain.com>",
          to: after.email,
          subject,
          html,
        });

        console.log("✅ Email sent successfully:", result.id || result);
      } catch (error) {
        console.error("❌ Error sending email:", error);
      }

      return null;
    });
