
// Privacy Policy Content - Editable via Admin Panel
export interface PrivacyPolicyData {
  effectiveDate: string;
  appName: string;
  contactEmail: string;
  sections: {
    introduction: string;
    informationWeCollect: {
      userIdAndHistory: string;
      noSensitiveData: string;
    };
    howInformationUsed: {
      gameFunctionality: string;
      noTracking: string;
      noThirdPartySharing: string;
    };
    dataLinkedToYou: {
      description: string;
      dataTypes: string[];
      additionalInfo: string;
    };
    childrensPrivacy: string;
    security: string;
    changesToPolicy: string;
    contactInfo: string;
  };
}

// Default privacy policy content
export const defaultPrivacyPolicyData: PrivacyPolicyData = {
  effectiveDate: "09/09/2025",
  appName: "Formula Racing Trivia",
  contactEmail: "formula_trivia@yahoo.com",
  sections: {
    introduction: "Formula Racing Trivia (\"the App\") respects your privacy. This Privacy Policy explains how we handle information within the App.",
    informationWeCollect: {
      userIdAndHistory: "The App collects and stores a username and gameplay history to enable core features such as the leaderboard, player statistics, and game progress.",
      noSensitiveData: "The App does not require your real name, email address, or any other personally identifiable information."
    },
    howInformationUsed: {
      gameFunctionality: "User IDs and gameplay history are used solely to support in-game features such as score tracking, leaderboards, and saving your progress.",
      noTracking: "The App does not track users across other apps, websites, or services.",
      noThirdPartySharing: "Your information is not shared, sold, or transferred to third parties under any circumstances."
    },
    dataLinkedToYou: {
      description: "According to Apple's App Store guidelines, the following data may be collected and linked to your identity (via your username):",
      dataTypes: [
        "User ID: Game player identifier (a user-name uniquely created by each player)",
        "User Content: Gameplay history, including scores and leaderboard results",
        "Other User Contact Information: Gameplay purposes only",
        "Other User Content: Gameplay purposes only"
      ],
      additionalInfo: "This information is only used within the App and is not used for advertising or tracking."
    },
    childrensPrivacy: "Formula Racing Trivia is suitable for users of all ages. The App does not knowingly collect personally identifiable information from children.",
    security: "We take reasonable measures to protect the information stored in the App. However, please note that no system is completely secure.",
    changesToPolicy: "We may update this Privacy Policy from time to time. If changes are made, we will update the \"Effective Date\" at the top of this page.",
    contactInfo: "If you have any questions about this Privacy Policy, please contact us at:"
  }
};

// In a real app, this would be stored in a database
// For now, we'll use local storage to simulate editability
export function getPrivacyPolicyData(): PrivacyPolicyData {
  if (typeof window === 'undefined') return defaultPrivacyPolicyData;
  
  const stored = localStorage.getItem('privacyPolicyData');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultPrivacyPolicyData;
    }
  }
  return defaultPrivacyPolicyData;
}

export function savePrivacyPolicyData(data: PrivacyPolicyData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('privacyPolicyData', JSON.stringify(data));
}
