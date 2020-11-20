const { createInvoice } = require("./invoiceGenerator.js");

const invoice = {
  shipping: {
    name: "Total Perpignan",
    address: "123 avenue du général de Gaulle",
    city: "Perpignan",
    state: "",
    country: "France",
    postal_code: 66000
  },
  items: [
    {
      item: "Abonnement Argos",
      description: "Service en ligne",
      quantity: 1,
      amount: 2000
    },
    // {
    //   item: "USB_EXT",
    //   description: "USB Cable Extender",
    //   quantity: 1,
    //   amount: 2000
    // }
  ],
  subtotal: 2000,
  tva: 200,
  invoice_nr: 1234
};

createInvoice(invoice, "invoice.pdf");