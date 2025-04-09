
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  created_at: string;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('order', { ascending: true });

        if (error) {
          console.error('Error fetching FAQs:', error);
          return;
        }

        setFaqs(data || []);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <Layout>
      <div className="bg-black text-white min-h-screen">
        <Helmet>
          <title>FAQ | Crypto Like A Boss</title>
          <meta name="description" content="Frequently Asked Questions about the CLAB token presale" />
        </Helmet>

        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-8 h-8 text-purple-500" />
              <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
            </div>
            
            <p className="text-gray-300 mb-10">
              Here is a Frequently Asked Questions (FAQ) sheet for the CLAB (Crypto Like A Boss) token presale.
            </p>

            <div className="space-y-6">
              {loading ? (
                // Loading skeletons while fetching data
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-12 w-full bg-gray-800" />
                    <Skeleton className="h-24 w-full bg-gray-800" />
                  </div>
                ))
              ) : faqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-gray-800">
                      <AccordionTrigger className="text-white hover:text-purple-400 text-xl font-semibold">
                        {index + 1}. {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-300 text-lg whitespace-pre-wrap">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No FAQs available at the moment. Please check back later.</p>
                </div>
              )}

              <div className="mt-10 text-center">
                <p className="text-gray-300">
                  For more detailed information and updates, please visit our official website: <a href="https://www.cryptolikeaboss.com" className="text-purple-400 hover:underline">https://www.cryptolikeaboss.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
