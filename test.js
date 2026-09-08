require("dotenv").config();
const { Xendit } = require("xendit-node");

const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

const { Invoice } = xendit;

async function testXendit() {
  try {
    console.log("Testing xendit key...");
    const invocie = await Invoice.createInvoice({
      data: {
        externalId: "Test " + Date.now(),
        amount: 10000,
        description: "Test",
        payerEmail: "test@example.com",
      },
    });
    console.log("Success", invocie);
  } catch (err) {
    console.log("Error", err);
  }
}

testXendit();
