/* Server Side -- Stripe API calls */
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const User = require('../models/user');

function getAllProductsAndPlans() {
  return Promise.all(
    [
      stripe.products.list({}),
      stripe.plans.list({})
    ]
  ).then(stripeData => {
    var products = stripeData[0].data;
    var plans = stripeData[1].data; 

    plans = plans.sort((a, b) => {
      /* Sort plans in ascending order of price (amount)
       * Ref: https://www.w3schools.com/js/js_array_sort.asp */
      return a.amount - b.amount;
    }).map(plan => {
      /* Format plan price (amount) */
      amount = plan.amount
      return {...plan, amount};
    });

    products.forEach(product => {
      const filteredPlans = plans.filter(plan => {
        return plan.product === product.id;
      });

      product.plans = filteredPlans;
    });

    return products;
  });
}


function createCustomerAndSubscription(requestBody) {
  return new Promise(async function(resolve, reject) {
    console.dir(requestBody);
    let source = requestBody.stripeSource;
    let email = requestBody.email;
    let customer_id;
    let user_id_stripe = await User.getStripeId(requestBody.user_id);
    console.log('USER ID STRIPE = '+user_id_stripe);
    if (user_id_stripe == null) {    
      const customer = await stripe.customers.create({
          source: source,
          email: email,
        }
      ); 
      customer_id = customer.id;
    }
    else {
      console.log('ELSE !')
      customer_id = user_id_stripe;
    }

    await stripe.subscriptions.create({
      customer: customer_id,
      items: [
        {
          plan: requestBody.planId,
          metadata: {
            station_id: requestBody.station_id,
            station_name: requestBody.station_name
          }
        }
      ]
    });
    resolve();
  })
}

function createSubscription(infos) {
  return new Promise(async function(resolve, reject) {
    console.dir(infos);
    let subscription = await stripe.subscriptions.create({
        customer: infos.customer_id,
        items: [
          {
            plan: infos.plan_id,
            metadata: {
              station_id: infos.station_id,
              station_name: infos.station_name
            }
          }
        ]
      });
      resolve(subscription);    
    })
}

function createCustomerAndSubscriptionSepa(requestBody) {
  return new Promise(async function(resolve, reject) {  
    console.dir(requestBody);
    let source = requestBody.stripeSource;
    let email = requestBody.email;
    let customer_id;
    let user_id_stripe = await User.getStripeId(requestBody.user_id);
    console.log('USER ID STRIPE = '+user_id_stripe);
    if (user_id_stripe == null) {    
      const customer = await stripe.customers.create({
          source: source,
          email: email,
        }
      ); 
      customer_id = customer.id;
    }
    else {
      console.log('ELSE !')
      customer_id = user_id_stripe;
    }

    console.log(customer_id);

    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [
        {
          plan: requestBody.planId
        },
      ],
      expand: ['latest_invoice.payment_intent']
    });  
    resolve();
  })

}

function getSubscriptionsByUser(user_id_stripe) {
  return new Promise(async function(resolve, reject) {
    let subscriptions = await stripe.subscriptions.list({
      customer: user_id_stripe
    });
    resolve(subscriptions);
  })
}

function cancelSubscription(subscription_id) {
  return new Promise(async function(resolve, reject) {
    try {    
      await stripe.subscriptions.del(subscription_id);
      resolve();
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function createPaymentMethodCard(card_infos) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(card_infos);
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: card_infos.cardNumber,
          exp_month: card_infos.expiryMonth,
          exp_year: card_infos.expiryYear,
          cvc: card_infos.cvc
        }
      });  
      resolve(paymentMethod);    
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function createPaymentMethodSepa(sepa_infos) {
  console.log('CREATE PAYMENT');
  console.dir(sepa_infos);
  return new Promise(async function(resolve, reject) {
    try {
      console.log('EMAIL /////////////////////');
      console.log(sepa_infos.userEmail);
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'sepa_debit',
        billing_details: {
          phone: sepa_infos.userPhone,
          name: sepa_infos.userLastName + ' ' + sepa_infos.userFirstName,
          email: sepa_infos.userEmail
        },
        sepa_debit: {
          iban: sepa_infos.iban
        }
      });  
      resolve(paymentMethod);    
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function attachPaymentMethod(user_id_stripe, payment_id) {
  console.log('ATTACH PAYMENT');
  return new Promise(async function(resolve, reject) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(payment_id, {
        customer: user_id_stripe
        }
      );
      resolve(paymentMethod);    
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}


function createCustomer(infos) {
  return new Promise(async function(resolve, reject) {  
    try {
      console.log(`CREATE CUSTOMER  - ${infos.userLastName} / ${infos.userEmail}`);
      let userName = infos.userFirstName + ' ' + infos.userLastName;
      let companyAdresse = infos.companyAdresse + ' ' + infos.companyCp + ' ' + infos.companyCity;
      let tvaNum = infos.companyTva;
      tvaNum = (tvaNum.length < 11 ? 0 : tvaNum);     
      const customer = await stripe.customers.create({
        name: userName,
        email: infos.userEmail,
        preferred_locales: ['fr-FR'],
        metadata: {
          companyName: infos.companyName,
          companyAdresse: companyAdresse,
          companyTva: tvaNum,
        },
        invoice_settings: {
          custom_fields: [
              {"name": 'Société', "value": infos.companyName},
              {"name": 'Adresse', "value": companyAdresse},
              {"name": 'Numéro de TVA', "value": tvaNum},
              {"name": 'Numéro SIRET', "value": infos.companySiret},
          ]
        
        }
      })

      resolve(customer.id);
    }  
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function updateCustomerEmail(new_email, user_id_stripe) {
  return new Promise(async function(resolve, reject) {  
    try {
      const customer = await stripe.customers.update(
        user_id_stripe, 
        {
          email: new_email,
        }
      )
      resolve(customer.id);
    }  
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function updateCustomerInfos(infos, user_id_stripe) {
  return new Promise(async function(resolve, reject) {  
    try { 
      let userName = infos.first_name + ' ' + infos.last_name;
      const customer = await stripe.customers.update(
        user_id_stripe, 
        {
          name: userName
        }
      )
      resolve(customer.id);
    }  
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function updateCustomerCompanyInfos(infos, user_id_stripe) {
  return new Promise(async function(resolve, reject) {  
    try { 
      let companyAdresse = infos.company_adresse + ' ' + infos.company_cp + ' ' + infos.company_city;
      let tvaNum = infos.tva_num;
      tvaNum = (tvaNum.length < 11 ? 0 : tvaNum); 
      const customer = await stripe.customers.update(
        user_id_stripe, 
        {
          metadata: {
            companyName: infos.company_name,
            companyAdresse: companyAdresse,
            companyTva: tvaNum,
          },
          invoice_settings: {
            custom_fields: [
                {"name": 'Société', "value": infos.company_name},
                {"name": 'Adresse', "value": companyAdresse},
                {"name": 'Numéro de TVA', "value": tvaNum},
                {"name": 'Numéro SIRET', "value": infos.siret},
            ]            
          }
        }
      )
      resolve(customer.id);
    }  
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}


function updateCustomerDefaultPaymentMethod(customer_id, paymentMethod_id) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log('UPDATE CUSTOMER');
      await stripe.customers.update(
        customer_id, { 
          invoice_settings: {
            default_payment_method: paymentMethod_id, // <-- your payment method ID collected via Stripe.js
          },
      });
      resolve();
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })  
}

function getPaymentMethods(customer_id) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log('GET PAYMENT METHODS');
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer_id,
        type: 'card',
      });      
      resolve(paymentMethods);
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function getInvoices(customer_id) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log('GET INVOICES');
      const invoices = await stripe.invoices.list({
        limit: 3,
        customer: customer_id
      });   
      resolve(invoices);
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

module.exports = {
  getAllProductsAndPlans,
  createSubscription,
  createCustomerAndSubscription,
  createCustomerAndSubscriptionSepa,
  getSubscriptionsByUser,
  cancelSubscription,
  createPaymentMethodCard,
  createPaymentMethodSepa,
  attachPaymentMethod,
  createCustomer,
  updateCustomerEmail,
  updateCustomerInfos,
  updateCustomerCompanyInfos,
  getPaymentMethods,
  updateCustomerDefaultPaymentMethod,
  getInvoices
};