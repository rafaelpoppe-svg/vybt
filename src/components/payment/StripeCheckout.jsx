import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutForm({ onSuccess, onError, buttonLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message);
      setIsProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-6 rounded-full font-bold text-lg bg-gradient-to-r from-[#00fea3] to-[#542b9b] text-white"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {buttonLabel}
          </>
        )}
      </Button>
    </form>
  );
}

export default function StripeCheckout({ type, buttonLabel, onSuccess, onError }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await base44.functions.invoke('createPaymentIntent', { type });
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        onError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#00fea3]" />
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#00fea3',
            colorBackground: '#1f2937',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            borderRadius: '12px',
          },
        },
      }}
    >
      <CheckoutForm onSuccess={onSuccess} onError={onError} buttonLabel={buttonLabel} />
    </Elements>
  );
}