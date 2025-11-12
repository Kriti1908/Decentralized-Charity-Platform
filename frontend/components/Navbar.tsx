"use client";
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function Navbar() {
  const { address } = useAccount();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CharityChain</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/campaigns" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Campaigns
            </Link>
            <Link href="/ngos" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              NGOs
            </Link>
            
            {/* New Service Provider and Beneficiary Links */}
            <Link href="/service-provider/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Service Provider
            </Link>
            <Link href="/beneficiary/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Beneficiary
            </Link>
            
            {address && (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/create-campaign" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Create Campaign
                </Link>
              </>
            )}
            
            {!address && (
              <Link href="/register-ngo" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Register NGO
              </Link>
            )}
          </div>

          {/* Connect Wallet Button */}
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/campaigns" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            Campaigns
          </Link>
          <Link href="/ngos" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            NGOs
          </Link>
          {/* New Mobile Links */}
          <Link href="/service-provider/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            Service Provider
          </Link>
          <Link href="/beneficiary/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            Beneficiary
          </Link>
          {address && (
            <>
              <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Dashboard
              </Link>
              <Link href="/create-campaign" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Create Campaign
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}