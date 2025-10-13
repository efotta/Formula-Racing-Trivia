
'use client';

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { getPrivacyPolicyData, PrivacyPolicyData } from '@/lib/privacy-policy-content';

export default function PrivacyPolicyContent() {
  const [policyData, setPolicyData] = useState<PrivacyPolicyData | null>(null);

  useEffect(() => {
    setPolicyData(getPrivacyPolicyData());
  }, []);

  if (!policyData) {
    return <div>Loading privacy policy...</div>;
  }

  return (
    <div className="max-w-none prose prose-gray prose-lg">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 m-0">Privacy Policy</h1>
      </div>
      
      <div className="space-y-6 text-gray-700">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-2">Privacy Policy for {policyData.appName}</h2>
          <p className="text-sm text-gray-600 m-0"><strong>Effective Date:</strong> {policyData.effectiveDate}</p>
        </div>

        <p>{policyData.sections.introduction}</p>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h3>
          <ul className="space-y-2">
            <li><strong>User ID and Player History:</strong> {policyData.sections.informationWeCollect.userIdAndHistory}</li>
            <li><strong>No Sensitive Data:</strong> {policyData.sections.informationWeCollect.noSensitiveData}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">How Information is Used</h3>
          <ul className="space-y-2">
            <li><strong>Game Functionality:</strong> {policyData.sections.howInformationUsed.gameFunctionality}</li>
            <li><strong>No Tracking:</strong> {policyData.sections.howInformationUsed.noTracking}</li>
            <li><strong>No Third-Party Sharing:</strong> {policyData.sections.howInformationUsed.noThirdPartySharing}</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Linked to You</h3>
          <p className="mb-3">{policyData.sections.dataLinkedToYou.description}</p>
          <ul className="space-y-2">
            {policyData.sections.dataLinkedToYou.dataTypes.map((item, index) => {
              const [title, description] = item.split(': ');
              return (
                <li key={index}><strong>{title}:</strong> {description}</li>
              );
            })}
          </ul>
          <p className="mt-3">{policyData.sections.dataLinkedToYou.additionalInfo}</p>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Children's Privacy</h3>
          <p>{policyData.sections.childrensPrivacy}</p>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Security</h3>
          <p>{policyData.sections.security}</p>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Changes to this Policy</h3>
          <p>{policyData.sections.changesToPolicy}</p>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h3>
          <p>
            {policyData.sections.contactInfo}{" "}
            <a href={`mailto:${policyData.contactEmail}`} className="text-blue-600 hover:text-blue-800">
              {policyData.contactEmail}
            </a>
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            This privacy policy is designed to comply with Apple App Store Connect requirements and can be updated as needed.
          </p>
        </div>
      </div>
    </div>
  );
}
