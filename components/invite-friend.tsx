
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share, MessageSquare, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface InviteFriendProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteFriend({ isOpen, onClose }: InviteFriendProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const { toast } = useToast();

  // Get the current app URL - will be localhost in dev, deployed URL in production
  const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://your-app.com'; // Fallback - will be updated when deployed
  };

  const defaultMessage = "This free Formula Racing trivia game is fun - give it a try! Fan-created and no ads!";
  const appUrl = getAppUrl();
  const fullMessage = `${defaultMessage}\n\nPlay now: ${appUrl}`;
  const messageToSend = customMessage || fullMessage;

  // Check if Web Share API is supported
  const canWebShare = typeof navigator !== 'undefined' && navigator.share;

  const handleWebShare = async () => {
    if (!canWebShare) {
      toast({
        title: "Web Share not supported",
        description: "Your browser doesn't support web sharing. Try SMS instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.share({
        title: 'Formula Trivia Challenge',
        text: messageToSend,
        url: appUrl,
      });
      
      toast({
        title: "Shared successfully!",
        description: "Your invitation was shared.",
      });
      onClose();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Could not share the invitation. Try copying the message instead.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSMSShare = () => {
    const smsUrl = phoneNumber 
      ? `sms:${phoneNumber}?body=${encodeURIComponent(messageToSend)}`
      : `sms:?body=${encodeURIComponent(messageToSend)}`;
    
    window.open(smsUrl, '_self');
    
    toast({
      title: "Opening SMS app",
      description: "Your SMS app should open with the invitation message.",
    });
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageToSend);
      toast({
        title: "Message copied!",
        description: "The invitation message has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setCustomMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="f1-modal-title flex items-center gap-2">
            <Share className="w-5 h-5 text-blue-500" />
            Invite a Friend
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* App Icon Preview */}
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                <Image
                  src="/formula-racing-trivia-icon.jpg"
                  alt="Formula Trivia Challenge Icon"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback if icon doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl bg-blue-600 text-white">
                  🏁
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Formula Trivia Challenge</h3>
                <p className="text-xs text-gray-500">Racing Knowledge Game</p>
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-2">
            <Label className="f1-modal-text">Message Preview:</Label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="f1-modal-text text-sm whitespace-pre-wrap">
                {messageToSend}
              </p>
            </div>
          </div>

          {/* Custom Message Option */}
          <div className="space-y-2">
            <Label htmlFor="custom-message" className="f1-modal-text">
              Custom Message (Optional):
            </Label>
            <Textarea
              id="custom-message"
              placeholder="Add your own personal message or leave blank for default..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[80px] resize-none f1-modal-text"
            />
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="f1-modal-text">
              Friend's Phone Number (Optional for SMS):
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="f1-modal-text"
            />
            <p className="text-xs text-gray-500 f1-readable">
              Leave blank to choose contact when SMS opens
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {/* Web Share Button (if supported) */}
            {canWebShare && (
              <Button
                onClick={handleWebShare}
                className="w-full bg-green-600 hover:bg-green-700 text-white f1-button-text"
              >
                <Share className="w-4 h-4 mr-2" />
                Share with Friends
              </Button>
            )}

            {/* SMS Button */}
            <Button
              onClick={handleSMSShare}
              variant="outline"
              className="w-full f1-button-text"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send via SMS
            </Button>

            {/* Copy Message Button */}
            <Button
              onClick={handleCopyMessage}
              variant="outline"
              className="w-full f1-button-text"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>

            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              className="w-full f1-button-text"
            >
              Close
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 text-center f1-readable">
            <p>Choose "Share with Friends" for easy sharing, or "Send via SMS" to text directly.</p>
            <p className="mt-1">The game icon and link will be included automatically!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
