
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Download, CreditCard, ArrowUpRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function HowToBuy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 py-12 pt-24 md:pt-28">
        <h1 className="text-4xl font-bold mb-6 text-white">How to Buy CLAB Tokens</h1>
        
        <Tabs defaultValue="solana" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="solana" className="flex items-center gap-2">
              <img src="/lovable-uploads/4e5b5f8b-196f-43dc-89f5-1a2e9701d523.png" className="h-4 w-4" alt="Solana" />
              <span>Solana (Phantom)</span>
            </TabsTrigger>
            <TabsTrigger value="ethereum" className="flex items-center gap-2">
              <img src="/lovable-uploads/a67f8f8c-8452-4984-8cef-c0395c8e8d63.png" className="h-4 w-4" alt="Ethereum" />
              <span>Ethereum</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="solana">
            <div className="bg-[#0f1422] border border-[#2a324d] rounded-xl p-8 mb-8">
              <p className="text-gray-300 mb-6">
                Follow this step-by-step guide to purchase CLAB tokens using Solana and Phantom wallet during our presale.
              </p>
              
              <div className="space-y-8">
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="bg-purple-600/20 rounded-full p-4 flex-shrink-0">
                      <Wallet className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Step 1: Install Phantom Wallet</h2>
                      <div className="prose prose-invert max-w-none">
                        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
                          <li>Visit the <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Phantom Wallet website</a> or search for "Phantom Wallet" in your browser's extension store.</li>
                          <li>Click "Add to Chrome" (or your preferred browser) to install the extension.</li>
                          <li>Once installed, click on the Phantom icon in your browser extensions and follow the setup instructions.</li>
                          <li>Create a new wallet by selecting "Create New Wallet" and set a strong password.</li>
                          <li>Write down your recovery seed phrase and store it in a secure location. <span className="text-yellow-400 font-medium">Never share this with anyone!</span></li>
                          <li>Verify your seed phrase when prompted to complete the wallet setup.</li>
                        </ol>
                      </div>
                      <div className="mt-4">
                        <a 
                          href="https://phantom.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium"
                        >
                          Download Phantom <Download className="ml-2 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="bg-purple-600/20 rounded-full p-4 flex-shrink-0">
                      <CreditCard className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Step 2: Purchase SOL</h2>
                      <div className="prose prose-invert max-w-none">
                        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
                          <li>You'll need SOL (Solana) to purchase CLAB tokens. There are several ways to acquire SOL:</li>
                          <li className="ml-5">
                            <strong>Option A: Buy directly in Phantom</strong>
                            <ul className="list-disc pl-5 mt-2 mb-3">
                              <li>Open your Phantom wallet and click on "Deposit"</li>
                              <li>Select "Buy SOL" and follow the instructions to purchase using a credit card or debit card</li>
                              <li>Complete the verification process if required</li>
                            </ul>
                          </li>
                          <li className="ml-5">
                            <strong>Option B: Buy from an exchange</strong>
                            <ul className="list-disc pl-5 mt-2 mb-3">
                              <li>Create an account on a cryptocurrency exchange that supports SOL (Binance, Coinbase, Kraken, etc.)</li>
                              <li>Complete identity verification if required</li>
                              <li>Purchase SOL using fiat currency (USD, EUR, etc.)</li>
                              <li>Withdraw the SOL to your Phantom wallet address</li>
                            </ul>
                          </li>
                          <li>Ensure you purchase enough SOL to cover both your intended CLAB purchase and the network transaction fees (approximately 0.01 SOL per transaction).</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="bg-purple-600/20 rounded-full p-4 flex-shrink-0">
                      <ArrowUpRight className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Step 3: Buy CLAB Tokens</h2>
                      <div className="prose prose-invert max-w-none">
                        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
                          <li>Return to the CLAB website and navigate to the presale section (or use the button below).</li>
                          <li>Click on "Connect Wallet" or "Buy CLAB" in the presale widget.</li>
                          <li>Select "Phantom" when prompted to choose a wallet.</li>
                          <li>Your Phantom wallet will request permission to connect – approve this request.</li>
                          <li>Enter the amount of CLAB tokens you wish to purchase or the amount of SOL you wish to spend.</li>
                          <li>Review the transaction details and click "Buy Now" or "Purchase".</li>
                          <li>Confirm the transaction in your Phantom wallet when prompted.</li>
                          <li>Wait for the transaction to be confirmed on the blockchain (this usually takes a few seconds).</li>
                          <li>Once confirmed, your CLAB tokens will be allocated to your wallet and available to view in the presale dashboard.</li>
                        </ol>
                      </div>
                      <div className="mt-6">
                        <Link to="/?scrollTo=presale">
                          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                            Go to Presale <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ethereum">
            <div className="bg-[#0f1422] border border-[#2a324d] rounded-xl p-8 mb-8">
              <p className="text-gray-300 mb-6">
                Follow this step-by-step guide to purchase CLAB tokens using Ethereum during our presale.
              </p>
              
              <div className="space-y-8">
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="bg-blue-600/20 rounded-full p-4 flex-shrink-0">
                      <Wallet className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Step 1: Set Up a Web3 Wallet</h2>
                      <div className="prose prose-invert max-w-none">
                        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
                          <li>For Ethereum transactions, you can use MetaMask, Phantom's Ethereum support, or any EVM-compatible wallet.</li>
                          <li>Install the wallet as a browser extension (Chrome, Firefox, Brave, Edge).</li>
                          <li>Create a new wallet and secure your recovery phrase in a safe place.</li>
                          <li>Make sure your wallet is set to connect to the Ethereum network.</li>
                        </ol>
                      </div>
                      <div className="mt-4 flex gap-4">
                        <a 
                          href="https://metamask.io/download/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
                        >
                          <span className="flex items-center">
                            <img 
                              src="/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png" 
                              alt="MetaMask" 
                              className="h-4 w-4 mr-2" 
                            />
                            Download MetaMask <Download className="ml-2 h-4 w-4" />
                          </span>
                        </a>
                        <a 
                          href="https://phantom.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Download Phantom <Download className="ml-2 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="bg-blue-600/20 rounded-full p-4 flex-shrink-0">
                      <CreditCard className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Step 2: Get Ethereum (ETH)</h2>
                      <div className="prose prose-invert max-w-none">
                        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
                          <li>You'll need ETH to purchase CLAB tokens and pay for transaction fees (gas).</li>
                          <li className="ml-5">
                            <strong>Option A: Buy directly in your wallet</strong>
                            <ul className="list-disc pl-5 mt-2 mb-3">
                              <li>Most wallets allow you to purchase ETH directly using a credit/debit card</li>
                              <li>Open your wallet and look for the "Buy" or "Deposit" option</li>
                              <li>Follow the instructions to purchase ETH</li>
                            </ul>
                          </li>
                          <li className="ml-5">
                            <strong>Option B: Buy from a cryptocurrency exchange</strong>
                            <ul className="list-disc pl-5 mt-2 mb-3">
                              <li>Register on a major exchange like Coinbase, Binance, or Kraken</li>
                              <li>Complete identity verification if required</li>
                              <li>Purchase ETH with fiat currency</li>
                              <li>Withdraw the ETH to your wallet address</li>
                            </ul>
                          </li>
                          <li>Make sure to purchase enough ETH to cover both your intended CLAB purchase and the network gas fees (which can vary depending on network congestion).</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="bg-blue-600/20 rounded-full p-4 flex-shrink-0">
                      <ArrowUpRight className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3">Step 3: Buy CLAB Tokens</h2>
                      <div className="prose prose-invert max-w-none">
                        <ol className="list-decimal pl-5 text-gray-300 space-y-3">
                          <li>Go to the CLAB presale page on our website.</li>
                          <li>Click on "Connect Wallet" and select your Ethereum wallet.</li>
                          <li>Approve the connection when prompted by your wallet.</li>
                          <li>Enter the amount of CLAB tokens you want to purchase or the amount of ETH you want to spend.</li>
                          <li>Click on "Buy CLAB" to initiate the transaction.</li>
                          <li>Confirm the transaction in your wallet, reviewing the gas fees and transaction details.</li>
                          <li>Wait for the transaction to be confirmed on the Ethereum blockchain (this may take a few minutes depending on network congestion).</li>
                          <li>Once confirmed, your CLAB tokens will be allocated to your wallet and visible in your presale dashboard.</li>
                        </ol>
                      </div>
                      <div className="mt-6">
                        <Link to="/?scrollTo=presale">
                          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Go to Presale <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Card className="mt-8 bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <p className="text-yellow-300 text-sm">
              <strong>Disclaimer:</strong> Cryptocurrency investments are subject to market risks. Only invest what you can afford to lose. Always do your own research before making any investment decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
