
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => {
  // Add useEffect to scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 py-16 mt-8"> {/* Added mt-8 for top margin */}
          <div className="max-w-4xl mx-auto text-gray-300">
            <h1 className="text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                <p>Welcome to Crypto Like A Boss ("CLAB"). By accessing our website and using our services, you agree to these Terms and Conditions in full.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Token Presale</h2>
                <p>The CLAB token presale is subject to availability and may be withdrawn at any time. Participation in the presale constitutes acceptance of these terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. Quiz Participation</h2>
                <p>Users participating in CLAB quizzes agree to fair play and acknowledge that rewards may be subject to verification.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Limitation of Liability</h2>
                <p>CLAB shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Continued use of the platform following any changes constitutes acceptance of the modified terms.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
