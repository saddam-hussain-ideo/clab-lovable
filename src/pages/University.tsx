import { Helmet } from "react-helmet";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Check, BookOpen, Trophy, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const University = () => {
  return <Layout>
      <Helmet>
        <title>CLAB Academy | Crypto Like A Boss</title>
        <meta name="description" content="Learn crypto, earn rewards, and stay informed with CLAB Academy's educational resources, quizzes, and crypto news." />
      </Helmet>

      <div className="pt-navbar bg-gradient-to-b from-black to-zinc-900">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
              CLAB Academy
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Learn, earn, and master crypto with expert-led resources and interactive education
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/quiz">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/blog">
                <Button size="lg" variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                  Explore Crypto News
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Quiz Feature */}
            <div className="bg-zinc-800/50 backdrop-blur-sm p-8 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 shadow-lg">
              <div className="bg-purple-500/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Trophy className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Interactive Quizzes</h3>
              <p className="text-gray-300 mb-6">Test your crypto knowledge, climb the leaderboard, and earn CLAB tokens for your expertise.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Daily quiz challenges</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Earn points and rewards</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Track your progress</span>
                </li>
              </ul>
              <Link to="/quiz" className="text-purple-400 hover:text-purple-300 font-medium flex items-center">
                Take a Quiz <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Crypto News Feature */}
            <div className="bg-zinc-800/50 backdrop-blur-sm p-8 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 shadow-lg">
              <div className="bg-emerald-500/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Newspaper className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Crypto News</h3>
              <p className="text-gray-300 mb-6">Stay informed with the latest crypto news, market analysis, and industry trends.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Daily market updates</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Expert analysis</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Project spotlights</span>
                </li>
              </ul>
              <Link to="/blog" className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center">
                Read Latest News <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Educational Resources Feature */}
            <div className="bg-zinc-800/50 backdrop-blur-sm p-8 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 shadow-lg">
              <div className="bg-amber-500/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Learning Resources</h3>
              <p className="text-gray-300 mb-6">Access educational content to deepen your understanding of cryptocurrency and blockchain.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Beginner-friendly guides</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">Advanced topics</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-emerald-400 mr-2" />
                  <span className="text-gray-300">DeFi & NFT tutorials</span>
                </li>
              </ul>
              <Link to="/quiz" className="text-amber-400 hover:text-amber-300 font-medium flex items-center">
                Explore Resources <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Community Section */}
          <div className="bg-gradient-to-r from-purple-900/30 to-emerald-900/30 rounded-xl p-8 md:p-12 border border-white/10 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Join Our Community</h2>
              <p className="text-xl text-gray-300">Connect with fellow crypto enthusiasts, share knowledge, and grow together</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold mb-3 text-green-500">Leaderboard</h3>
                <p className="text-gray-300 mb-4">Compete with other users, climb the rankings, and earn rewards for your knowledge.</p>
                <Link to="/leaderboard">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                <h3 className="text-xl font-bold mb-3 text-green-500">Daily Challenges</h3>
                <p className="text-gray-300 mb-4">Complete daily quizzes and tasks to earn bonus points and special rewards.</p>
                <Link to="/quiz">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full">
                    Start Challenge
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>;
};

export default University;
