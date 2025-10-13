
// Privacy Policy page deployed - Version 2.0 - 2025-09-09
import PrivacyPolicyContent from '@/components/privacy-policy-content';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="mb-4 text-center">
            <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Privacy Policy System Active
            </div>
          </div>
          <PrivacyPolicyContent />
        </div>
      </div>
    </div>
  );
}
