
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, CreditCard, Trophy, ArrowRight, FileText, Map, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { DocumentButton } from "@/components/DocumentButton";

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gradient-to-b from-black to-zinc-900 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Presale Information Section - MOVED TO TOP */}
            <section className="mb-12 bg-zinc-800/30 rounded-xl p-8 backdrop-blur-sm border border-fuchsia-500/20">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                Join the <span className="text-fuchsia-400">CLAB Presale</span>
              </h2>
              
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                The CLAB presale is your opportunity to get in early on a revolutionary Web3 project that's combining learning, 
                gaming, and DeFi in one ecosystem. Each presale stage has limited allocation at increasing price points, 
                ensuring early supporters get the best possible value.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <Card className="bg-black/50 border-white/10 hover:border-fuchsia-500/30 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-white flex items-center">
                      <PieChart className="w-5 h-5 mr-2 text-fuchsia-400" />
                      Tokenomics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 mb-4">
                      Explore the CLAB token distribution, allocation, and utility within our ecosystem.
                    </p>
                    <Link to="/tokenomics">
                      <Button variant="outline" className="w-full border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10">
                        <span>View Tokenomics</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 border-white/10 hover:border-amber-500/30 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-amber-400" />
                      Whitepaper
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 mb-4">
                      Dive deep into our whitepaper to understand the technology and vision behind CLAB.
                    </p>
                    <DocumentButton
                      className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      variant="outline"
                      size="default"
                    />
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-white flex items-center">
                      <Map className="w-5 h-5 mr-2 text-emerald-400" />
                      Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 mb-4">
                      See our development timeline and future plans for the CLAB ecosystem.
                    </p>
                    <Link to="/roadmap">
                      <Button variant="outline" className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                        <span>View Roadmap</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </section>
            
            <div className="space-y-12">
              <section className="bg-zinc-800/50 rounded-xl p-8 backdrop-blur-sm border border-white/10">
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-6">Who Are We?</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  We're a squad of giga-brains on a mission to build a Web3 platform like no other—a place 
                  where learning meets degenerate trading, and memes meet actual utility. We've combined our 
                  collective big-brain energy to drop CLAB, the token that rewards you for diving headfirst 
                  into the crypto rabbit hole. No corporate suits here, just relentless innovation and a 
                  reckless passion for the next big one.
                </p>
              </section>
              
              <section className="bg-zinc-800/50 rounded-xl p-8 backdrop-blur-sm border border-white/10">
                <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-6">Who Are You?</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  You're the kind of degen who's always got one eye on charts and the other on the newest 
                  meme token, ready to ape in if it's got real potential. Or maybe you're just starting out, 
                  discovering the depths of crypto for alpha. Beginners, seasoned traders, memecoin fanatics, 
                  and Web3 believers—anyone craving more than a run-of-the-mill pump-and-dump. If you're hungry 
                  for a project with substance, a real community, and massive boss-level vibes, then welcome 
                  to the game. Time to make your mark, CLAB style and start trading Crypto Like A Boss!
                </p>
              </section>
            </div>
            
            <section className="mt-16">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
                Discover the CLAB <span className="text-emerald-400">Ecosystem</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/40 backdrop-blur-lg border border-fuchsia-500/30 overflow-hidden group hover:border-fuchsia-500/60 transition-all duration-300 h-full">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.15),transparent_70%)] pointer-events-none" />
                  
                  <CardHeader className="pb-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-600 to-fuchsia-900 rounded-lg p-3 mb-3">
                      <Rocket className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">CLAB PRESALE</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">
                      Get in early on the most boss-level token around. Limited allocation available at the best possible price before public launch.
                    </p>
                    
                    <div className="pt-2">
                      <Link to="/#presale-section">
                        <Button className="w-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 border-0 group-hover:shadow-lg group-hover:shadow-fuchsia-500/20 transition-all duration-300">
                          <span>Join Presale</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/40 backdrop-blur-lg border border-emerald-500/30 overflow-hidden group hover:border-emerald-500/60 transition-all duration-300 h-full">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />
                  
                  <CardHeader className="pb-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-lg p-3 mb-3">
                      <CreditCard className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">CLAB CARD</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">
                      Spend like a boss with the world's first DEFI crypto card. Access your crypto assets anytime, anywhere with our secure solution.
                    </p>
                    
                    <div className="pt-2">
                      <Link to="/defi-card">
                        <Button className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border-0 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300">
                          <span>Learn More</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/40 backdrop-blur-lg border border-amber-500/30 overflow-hidden group hover:border-amber-500/60 transition-all duration-300 h-full">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />
                  
                  <CardHeader className="pb-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg p-3 mb-3">
                      <Trophy className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">CRYPTO TRIVIA</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">
                      Test your crypto knowledge, climb the leaderboard, and earn CLAB tokens. Learn while you earn with our interactive quizzes.
                    </p>
                    
                    <div className="pt-2">
                      <Link to="/quiz">
                        <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border-0 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
                          <span>Start Quiz</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
            
            {/* New larger CTA section at the bottom of the page */}
            <section className="mt-20 text-center">
              <div className="bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50 backdrop-blur-lg rounded-2xl p-10 border border-fuchsia-500/30 shadow-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to <span className="text-fuchsia-400">Trade Like A Boss</span>?
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                  Join the CLAB presale now and be part of the next big Web3 revolution that's changing how we learn, trade, and earn in crypto.
                </p>
                <Link to="/#presale-section">
                  <Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border-0 py-8 px-16 text-xl font-bold shadow-lg shadow-fuchsia-500/30 transition-all duration-300 rounded-xl">
                    <Rocket className="mr-3 h-6 w-6" />
                    <span>JOIN PRESALE NOW</span>
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
