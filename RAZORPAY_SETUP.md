# Razorpay Payment Integration Setup

## Overview
The website now includes Razorpay payment gateway integration for secure online payments in INR. Students can pay directly when booking rooms.

## Setup Instructions

### 1. Get Razorpay Credentials
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Create a test account
3. Get your API Key ID and Secret from the Dashboard > Settings > API Keys

### 2. Update Environment Variables
Update your `.env` file with Razorpay credentials:

```env
# Razorpay (Indian Payment Gateway)
RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
RAZORPAY_KEY_SECRET="your_secret_here"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
```

### 3. Webhook Setup (Production)
1. In Razorpay Dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `payment.captured`
4. Copy the webhook secret to your `.env` as `RAZORPAY_WEBHOOK_SECRET`

## Payment Flow

1. **Student selects room and dates** on room detail page
2. **Clicks "Book Now"** - creates booking and payment intent
3. **Razorpay popup opens** for payment
4. **Payment completes** - booking status updates to CONFIRMED
5. **Student redirected** to dashboard with confirmation

## Testing

Use Razorpay test credentials for development:
- Test Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: 123
- OTP: 123456

## Features

- ✅ Secure payment processing
- ✅ Automatic booking confirmation
- ✅ Payment verification
- ✅ Webhook handling for production
- ✅ INR currency support
- ✅ Mobile-responsive payment UI

## API Endpoints

- `POST /api/payments` - Create payment intent
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Handle webhooks

## Database Changes

Payment model now includes:
- `razorpayOrderId` - Razorpay order ID
- `razorpayPaymentId` - Razorpay payment ID
- Currency defaults to INR

## Security

- Payment signatures verified on backend
- User authentication required
- Webhook signature validation
- PCI DSS compliant through Razorpay