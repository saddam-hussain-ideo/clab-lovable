
import React, { useState } from 'react';
import { z } from "@/lib/zod-config";
import { Button } from "@/components/ui/button";
import { InputWithValidation } from "@/components/ui/input-with-validation";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { Link } from "react-router-dom";

// Define the schema for form validation
const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(2, "Please select a country"),
});

type FormValues = z.infer<typeof formSchema>;

interface WaitlistSignupFormProps {
  onSuccess?: () => void;
}

export const WaitlistSignupForm: React.FC<WaitlistSignupFormProps> = ({ 
  onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      country: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    console.log("Submitting form data:", data);

    try {
      // Insert data into the defi_card_waitlist table
      const { error } = await supabase
        .from('defi_card_waitlist')
        .insert([{
          name: data.name || null,
          email: data.email,
          country: data.country
        }]);

      if (error) {
        console.error("Error submitting waitlist form:", error);
        if (error.code === '23505') { // Unique violation error code
          toast.error("This email is already on our waitlist!");
        } else {
          toast.error("Failed to join waitlist. Please try again later.");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success("Successfully joined the DEFI Card waitlist!");
      form.reset();
      setShowSuccessMessage(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error in waitlist submission:", err);
      toast.error("Something went wrong. Please try again later.");
      setIsSubmitting(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <span>You're on the list!</span>
        </h3>
        
        <p className="text-gray-300">
          Thanks for joining the CLAB DEFI Card waitlist. You'll be among the first to get access when we launch!
        </p>
        
        <div className="pt-4 px-4 bg-emerald-800/20 border border-emerald-500/30 rounded-lg py-4 mt-4">
          <p className="text-white font-semibold text-lg mb-2">
            Special Offer
          </p>
          <p className="text-gray-300">
            Every $1,000USD minimum purchase of CLAB tokens entitles you to a FREE CLAB Crypto card.
          </p>
          
          <div className="mt-4 text-sm text-gray-400">
            <Link to="/terms" className="text-emerald-400 hover:text-emerald-300 underline">
              View Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <InputWithValidation 
                placeholder="Your name" 
                {...field} 
                className="text-black" 
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
              <InputWithValidation 
                placeholder="your@email.com" 
                {...field} 
                schema={z.string().email("Please enter a valid email address")}
                className="text-black"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="bg-background border-zinc-700 text-black">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-auto mx-auto px-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white h-12"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Join Waitlist"}
        </Button>
      </form>
    </Form>
  );
};
