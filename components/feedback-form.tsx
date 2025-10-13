
'use client';

// Privacy update deployed - 2025-09-09

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, CheckCircle } from 'lucide-react';

interface FeedbackFormProps {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ open, onClose }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    type: 'general',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ username: '', type: 'general', message: '' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            Feedback & Suggestions (Privacy Protected)
          </DialogTitle>
        </DialogHeader>
        
        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              Thank You!
            </h3>
            <p className="text-gray-600">
              Your feedback has been submitted successfully.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="feedback-username">Username (optional)</Label>
              <Input
                id="feedback-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Your racing name"
              />
            </div>

            <div>
              <Label htmlFor="feedback-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="question_challenge">Challenge a Question</SelectItem>
                  <SelectItem value="suggestion">Suggest New Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea
                id="feedback-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter your feedback, challenge an answer, or suggest new questions. Please note that feedback is one-way only to protect your privacy, so you will not receive a response."
                rows={5}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.message.trim()}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
