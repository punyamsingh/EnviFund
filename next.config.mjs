
// next.config.mjs

export default {
  env: {
    // RazorPay keys
    RAZORPAY_KEY: '***REMOVED***',
    RAZORPAY_SECRET: '***REMOVED***',
//     GOOGLE_SHEETS_PRIVATE_KEY:"***PRIVATE_KEY_REMOVED***\n",
// GOOGLE_SHEETS_CLIENT_EMAIL:"neelpwm@instant-edudoc.iam.gserviceaccount.com",
// SPREADSHEET_ID:"1uAGb_f3Fy47ySpE_QNzIQr8jFqSe7pQhVcNN6BLORe0"
GOOGLE_APPLICATION_CREDENTIALS:'./instant-edudoc.json',
SHEET_ID:'1uAGb_f3Fy47ySpE_QNzIQr8jFqSe7pQhVcNN6BLORe0'
  },
};