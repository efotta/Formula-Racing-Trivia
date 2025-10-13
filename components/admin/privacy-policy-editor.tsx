
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Save, RotateCcw } from 'lucide-react';
import { getPrivacyPolicyData, savePrivacyPolicyData, defaultPrivacyPolicyData, PrivacyPolicyData } from '@/lib/privacy-policy-content';

interface PrivacyPolicyEditorProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyEditor({ open, onClose }: PrivacyPolicyEditorProps) {
  const [policyData, setPolicyData] = useState<PrivacyPolicyData>(defaultPrivacyPolicyData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      const data = getPrivacyPolicyData();
      setPolicyData(data);
      setHasChanges(false);
    }
  }, [open]);

  const handleSave = () => {
    savePrivacyPolicyData(policyData);
    setHasChanges(false);
    alert('Privacy Policy updated successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default privacy policy? This will lose all changes.')) {
      setPolicyData(defaultPrivacyPolicyData);
      setHasChanges(true);
    }
  };

  const updatePolicy = (path: string, value: string) => {
    const newData = { ...policyData };
    const pathArray = path.split('.');
    let current: any = newData;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setPolicyData(newData);
    setHasChanges(true);
  };

  const updateDataType = (index: number, value: string) => {
    const newData = { ...policyData };
    newData.sections.dataLinkedToYou.dataTypes[index] = value;
    setPolicyData(newData);
    setHasChanges(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Privacy Policy Editor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                value={policyData.effectiveDate}
                onChange={(e) => updatePolicy('effectiveDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={policyData.appName}
                onChange={(e) => updatePolicy('appName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={policyData.contactEmail}
              onChange={(e) => updatePolicy('contactEmail', e.target.value)}
            />
          </div>

          {/* Introduction */}
          <div>
            <Label htmlFor="introduction">Introduction</Label>
            <Textarea
              id="introduction"
              value={policyData.sections.introduction}
              onChange={(e) => updatePolicy('sections.introduction', e.target.value)}
              rows={3}
            />
          </div>

          {/* Information We Collect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Information We Collect</h3>
            <div>
              <Label htmlFor="userIdAndHistory">User ID and Player History</Label>
              <Textarea
                id="userIdAndHistory"
                value={policyData.sections.informationWeCollect.userIdAndHistory}
                onChange={(e) => updatePolicy('sections.informationWeCollect.userIdAndHistory', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="noSensitiveData">No Sensitive Data</Label>
              <Textarea
                id="noSensitiveData"
                value={policyData.sections.informationWeCollect.noSensitiveData}
                onChange={(e) => updatePolicy('sections.informationWeCollect.noSensitiveData', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* How Information is Used */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">How Information is Used</h3>
            <div>
              <Label htmlFor="gameFunctionality">Game Functionality</Label>
              <Textarea
                id="gameFunctionality"
                value={policyData.sections.howInformationUsed.gameFunctionality}
                onChange={(e) => updatePolicy('sections.howInformationUsed.gameFunctionality', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="noTracking">No Tracking</Label>
              <Textarea
                id="noTracking"
                value={policyData.sections.howInformationUsed.noTracking}
                onChange={(e) => updatePolicy('sections.howInformationUsed.noTracking', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="noThirdPartySharing">No Third-Party Sharing</Label>
              <Textarea
                id="noThirdPartySharing"
                value={policyData.sections.howInformationUsed.noThirdPartySharing}
                onChange={(e) => updatePolicy('sections.howInformationUsed.noThirdPartySharing', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Data Linked to You */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Linked to You</h3>
            <div>
              <Label htmlFor="dataLinkedDescription">Description</Label>
              <Textarea
                id="dataLinkedDescription"
                value={policyData.sections.dataLinkedToYou.description}
                onChange={(e) => updatePolicy('sections.dataLinkedToYou.description', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Data Types</Label>
              {policyData.sections.dataLinkedToYou.dataTypes.map((dataType, index) => (
                <div key={index} className="mt-2">
                  <Input
                    value={dataType}
                    onChange={(e) => updateDataType(index, e.target.value)}
                    placeholder={`Data type ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label htmlFor="additionalInfo">Additional Info</Label>
              <Textarea
                id="additionalInfo"
                value={policyData.sections.dataLinkedToYou.additionalInfo}
                onChange={(e) => updatePolicy('sections.dataLinkedToYou.additionalInfo', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Other Sections */}
          <div>
            <Label htmlFor="childrensPrivacy">Children's Privacy</Label>
            <Textarea
              id="childrensPrivacy"
              value={policyData.sections.childrensPrivacy}
              onChange={(e) => updatePolicy('sections.childrensPrivacy', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="security">Security</Label>
            <Textarea
              id="security"
              value={policyData.sections.security}
              onChange={(e) => updatePolicy('sections.security', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="changesToPolicy">Changes to this Policy</Label>
            <Textarea
              id="changesToPolicy"
              value={policyData.sections.changesToPolicy}
              onChange={(e) => updatePolicy('sections.changesToPolicy', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="contactInfo">Contact Info Text</Label>
            <Textarea
              id="contactInfo"
              value={policyData.sections.contactInfo}
              onChange={(e) => updatePolicy('sections.contactInfo', e.target.value)}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={!hasChanges} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
