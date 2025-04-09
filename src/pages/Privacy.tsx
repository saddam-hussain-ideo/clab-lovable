import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Layout } from "@/components/Layout";
const Privacy = () => {
  return <Layout>
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-gray-300">
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Data Collection</h2>
                <p>We collect information that you provide directly to us, including but not limited to: wallet addresses, quiz responses, and any other information you choose to provide.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Information</h2>
                <p>We use the information we collect to operate, maintain, and improve our services, including the CLAB token ecosystem and quiz platform.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information against unauthorized access or disclosure.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Blockchain Data</h2>
                <p>Please note that transactions on the SUI blockchain are public and immutable. Exercise caution when conducting transactions.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Contact Us</h2>
                <p>For any privacy-related questions or concerns, please contact our support team via presale@cryptolikeaboss.com.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </Layout>;
};
export default Privacy;