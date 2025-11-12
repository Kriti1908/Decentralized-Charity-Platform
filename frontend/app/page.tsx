import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Transparent Charity Platform
            </h1>
            <p className="text-xl mb-8">
              Blockchain-powered platform ensuring complete transparency in charity donations
              with cryptographic proof of disbursement
            </p>
            <div className="flex gap-4">
              <Link href="/campaigns" className="btn-primary bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors">
                Browse Campaigns
              </Link>
              <Link href="/campaigns" className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 rounded-lg font-semibold transition-colors">
                Start Donating
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Complete Transparency</h3>
              <p className="text-gray-600">
                Every donation is tracked on the blockchain. See exactly where your money goes.
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Direct Impact</h3>
              <p className="text-gray-600">
                Funds go directly to beneficiaries through soulbound tokens, ensuring proper use.
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">Verified NGOs</h3>
              <p className="text-gray-600">
                All NGOs undergo KYC verification before they can create campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">NGO Creates Campaign</h3>
                  <p className="text-gray-600">
                    Verified NGOs create campaigns for specific causes with clear goals and documentation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Donors Contribute</h3>
                  <p className="text-gray-600">
                    Donors send cryptocurrency directly to smart contracts, with full transparency.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Soulbound Tokens Issued</h3>
                  <p className="text-gray-600">
                    Beneficiaries receive non-transferable tokens representing their entitlement to specific services.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Service Providers Redeem</h3>
                  <p className="text-gray-600">
                    After delivering service, providers redeem tokens and receive payment from smart contracts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of donors creating real impact through transparent giving
          </p>
          <Link href="/campaigns" className="btn-primary text-lg px-8 py-3">
            Browse Campaigns
          </Link>
        </div>
      </section>
    </div>
  );
}
