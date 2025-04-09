
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@/lib/zod-config';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { countries } from '@/lib/countries';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, AlertTriangle, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  address_line1: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  address_line2: z.string().optional(),
  city: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  state: z.string().min(2, { message: 'State/Province must be at least 2 characters.' }),
  postal_code: z.string().min(2, { message: 'Postal/ZIP code must be at least 2 characters.' }),
  country: z.string().min(2, { message: 'Please select a country.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface DefiCardFormProps {
  walletAddress: string | null;
  isEligible: boolean;
  hasRegistered: boolean;
  totalPurchaseAmount: number;
  minRequiredAmount: number;
}

export const DefiCardForm = ({ 
  walletAddress, 
  isEligible, 
  hasRegistered, 
  totalPurchaseAmount, 
  minRequiredAmount 
}: DefiCardFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccessful, setRegistrationSuccessful] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!walletAddress) {
      toast.error("No wallet connected. Please connect your wallet to register.");
      return;
    }

    if (!isEligible) {
      toast.error(`You need to purchase at least $${minRequiredAmount} worth of CLAB tokens to be eligible.`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Find the country object that matches the selected country code
      const selectedCountry = countries.find(country => country.name === data.country);
      
      // Create the data object to submit - ensure all required fields are present and not optional
      const dataToSubmit = {
        wallet_address: walletAddress,
        status: 'pending',
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        address_line1: data.address_line1,
        address_line2: data.address_line2 || '', // Convert optional to empty string
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: selectedCountry ? selectedCountry.name : data.country
      };
      
      console.log("Submitting registration data:", dataToSubmit);
      
      const { data: registrationData, error } = await supabase
        .from('defi_card_registrations')
        .insert(dataToSubmit)  // Pass a single object, not an array
        .select();
      
      if (error) {
        console.error("Registration error:", error);
        
        if (error.code === '23505') {
          toast.error("You have already registered for a DEFI card.");
        } else {
          toast.error(`Failed to submit your registration: ${error.message}`);
        }
        return;
      }
      
      setRegistrationSuccessful(true);
      toast.success("Your DEFI card registration has been submitted successfully!");
      form.reset();
    } catch (error: any) {
      console.error("Error submitting registration:", error);
      toast.error(`An unexpected error occurred: ${error?.message || "Please try again."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!walletAddress) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">Wallet Not Connected</CardTitle>
          <CardDescription className="text-amber-700">
            Please connect your wallet to check eligibility and register for a DEFI card.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (hasRegistered) {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            <Check className="inline-block h-6 w-6 mr-2" /> DEFI Card Registration Complete
          </CardTitle>
          <CardDescription className="text-green-700">
            Your DEFI card registration has been received and is being processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-2">
            Your wallet address: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </p>
          <p className="text-green-700">
            We'll contact you via email when your card is ready to be shipped.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (registrationSuccessful) {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            <Check className="inline-block h-6 w-6 mr-2" /> Registration Successful
          </CardTitle>
          <CardDescription className="text-green-700">
            Your DEFI card registration has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-2">
            Your wallet address: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </p>
          <p className="text-green-700">
            We'll contact you via email when your card is ready to be shipped.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isEligible) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">
            <AlertTriangle className="inline-block h-6 w-6 mr-2" /> Not Eligible
          </CardTitle>
          <CardDescription className="text-amber-700">
            You need to purchase more CLAB tokens to be eligible for a DEFI card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-amber-700">Current purchase amount: <span className="font-bold">${totalPurchaseAmount.toFixed(2)}</span></p>
              <p className="text-amber-700">Required purchase amount: <span className="font-bold">${minRequiredAmount.toFixed(2)}</span></p>
              <p className="text-amber-700 mt-2">
                You need an additional <span className="font-bold">${Math.max(0, minRequiredAmount - totalPurchaseAmount).toFixed(2)}</span> in purchases to qualify.
              </p>
            </div>
            <Button 
              variant="default"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
              onClick={() => window.location.href = '/presale'}
            >
              Purchase CLAB Tokens <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for DEFI Card</CardTitle>
        <CardDescription>
          You've purchased ${totalPurchaseAmount.toFixed(2)} worth of CLAB tokens and are eligible for a DEFI card. 
          Please fill out the form below to register.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal/ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={isSubmitting} className="w-auto px-16">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Registration"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
