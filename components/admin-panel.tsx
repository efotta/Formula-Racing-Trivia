
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, Edit, Trash2, MessageSquare, Clock } from 'lucide-react';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  level: number;
  levelName: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

interface Feedback {
  id: string;
  username: string | null;
  email: string | null;
  type: string;
  message: string;
  processed: boolean;
  createdAt: string;
}

interface PenaltySettings {
  level3PenaltySeconds: number;
  level4PenaltySeconds: number;
  level5PenaltySeconds: number;
  level4GridDropPenalty: number;
  level5SponsorPenalty: number;
}

interface QuestionFormData {
  level: number;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [penaltySettings, setPenaltySettings] = useState<PenaltySettings>({
    level3PenaltySeconds: 1.0,
    level4PenaltySeconds: 1.0,
    level5PenaltySeconds: 1.0,
    level4GridDropPenalty: 5.0,
    level5SponsorPenalty: 10.0
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [formData, setFormData] = useState<QuestionFormData>({
    level: 1,
    question: '',
    correctAnswer: '',
    wrongAnswers: ['', '', '']
  });

  useEffect(() => {
    if (open) {
      fetchQuestions();
      fetchFeedback();
      fetchPenaltySettings();
    }
  }, [open]);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        level: editingQuestion.level,
        question: editingQuestion.question,
        correctAnswer: editingQuestion.correctAnswer,
        wrongAnswers: editingQuestion.wrongAnswers
      });
    } else {
      setFormData({
        level: 1,
        question: '',
        correctAnswer: '',
        wrongAnswers: ['', '', '']
      });
    }
  }, [editingQuestion]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/admin/questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/admin/feedback');
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchPenaltySettings = async () => {
    try {
      const response = await fetch('/api/admin/penalty-settings');
      const data = await response.json();
      setPenaltySettings(data);
    } catch (error) {
      console.error('Error fetching penalty settings:', error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion 
        ? `/api/admin/questions/${editingQuestion.id}`
        : '/api/admin/questions';

      // Map level number to level name
      const levelNames: { [key: number]: string } = {
        1: 'Rookie',
        2: 'Midfielder',
        3: 'Front Runner',
        4: 'World Champion',
        5: 'Legend'
      };

      const payload = {
        ...formData,
        levelName: levelNames[formData.level]
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        fetchQuestions();
        setEditingQuestion(null);
        setShowQuestionForm(false);
        setFormData({
          level: 1,
          question: '',
          correctAnswer: '',
          wrongAnswers: ['', '', '']
        });
      } else {
        const errorData = await response.json();
        console.error('Error saving question:', errorData);
        alert(`Error saving question: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error saving question. Please try again.');
    }
  };

  const handleCloseForm = () => {
    setEditingQuestion(null);
    setShowQuestionForm(false);
    setFormData({
      level: 1,
      question: '',
      correctAnswer: '',
      wrongAnswers: ['', '', '']
    });
  };

  const handleWrongAnswerChange = (index: number, value: string) => {
    const newWrongAnswers = [...formData.wrongAnswers];
    newWrongAnswers[index] = value;
    setFormData({ ...formData, wrongAnswers: newWrongAnswers });
  };

  const handleSavePenaltySettings = async () => {
    try {
      const response = await fetch('/api/admin/penalty-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(penaltySettings)
      });
      if (response.ok) {
        alert('Penalty settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving penalty settings:', error);
    }
  };

  const handleMarkFeedbackProcessed = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processed: true })
      });
      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        fetchFeedback();
        alert('Feedback deleted successfully');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Error deleting feedback. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            Admin Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="penalties">Penalties</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Question Management</h3>
              <Button
                onClick={() => setShowQuestionForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Correct Answer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>{question.level} - {question.levelName}</TableCell>
                      <TableCell className="max-w-md truncate">{question.question}</TableCell>
                      <TableCell>{question.correctAnswer}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingQuestion(question)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Penalty Settings</h3>
              <Button onClick={handleSavePenaltySettings}>
                <Clock className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level3-penalty">Level 3 Penalty (seconds)</Label>
                <Input
                  id="level3-penalty"
                  type="number"
                  step="0.1"
                  value={penaltySettings.level3PenaltySeconds}
                  onChange={(e) => setPenaltySettings({
                    ...penaltySettings,
                    level3PenaltySeconds: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <Label htmlFor="level4-penalty">Level 4 Penalty (seconds)</Label>
                <Input
                  id="level4-penalty"
                  type="number"
                  step="0.1"
                  value={penaltySettings.level4PenaltySeconds}
                  onChange={(e) => setPenaltySettings({
                    ...penaltySettings,
                    level4PenaltySeconds: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <Label htmlFor="level5-penalty">Level 5 Penalty (seconds)</Label>
                <Input
                  id="level5-penalty"
                  type="number"
                  step="0.1"
                  value={penaltySettings.level5PenaltySeconds}
                  onChange={(e) => setPenaltySettings({
                    ...penaltySettings,
                    level5PenaltySeconds: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <Label htmlFor="grid-drop-penalty">Level 4 Grid Drop Penalty (seconds)</Label>
                <Input
                  id="grid-drop-penalty"
                  type="number"
                  step="0.1"
                  value={penaltySettings.level4GridDropPenalty}
                  onChange={(e) => setPenaltySettings({
                    ...penaltySettings,
                    level4GridDropPenalty: parseFloat(e.target.value) || 0
                  })}
                />
              </div>

              <div>
                <Label htmlFor="sponsor-penalty">Level 5 Sponsor Penalty (seconds)</Label>
                <Input
                  id="sponsor-penalty"
                  type="number"
                  step="0.1"
                  value={penaltySettings.level5SponsorPenalty}
                  onChange={(e) => setPenaltySettings({
                    ...penaltySettings,
                    level5SponsorPenalty: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Feedback</h3>
              <div className="text-sm text-gray-600">
                {feedback.filter(f => !f.processed).length} unprocessed
              </div>
            </div>

            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    item.processed ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{item.username || 'Anonymous'}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.type === 'question_challenge' ? 'bg-red-100 text-red-700' :
                        item.type === 'suggestion' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <div className="flex flex-col gap-1">
                        {!item.processed && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkFeedbackProcessed(item.id)}
                          >
                            Mark Processed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          onClick={() => handleDeleteFeedback(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Feedback
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{item.message}</p>
                  {item.email && (
                    <p className="text-sm text-gray-500 mt-2">
                      Contact: {item.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Question Form Modal */}
        {(showQuestionForm || editingQuestion) && (
          <Dialog open={true} onOpenChange={handleCloseForm}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select 
                    value={formData.level.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Rookie</SelectItem>
                      <SelectItem value="2">2 - Midfielder</SelectItem>
                      <SelectItem value="3">3 - Front Runner</SelectItem>
                      <SelectItem value="4">4 - World Champion</SelectItem>
                      <SelectItem value="5">5 - Legend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="correct-answer">Correct Answer</Label>
                  <Input
                    id="correct-answer"
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    placeholder="Enter the correct answer"
                  />
                </div>

                <div>
                  <Label>Wrong Answers</Label>
                  <div className="space-y-2">
                    {formData.wrongAnswers.map((answer, index) => (
                      <Input
                        key={index}
                        value={answer}
                        onChange={(e) => handleWrongAnswerChange(index, e.target.value)}
                        placeholder={`Wrong answer ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseForm}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveQuestion}
                    disabled={!formData.question || !formData.correctAnswer || formData.wrongAnswers.some(a => !a)}
                  >
                    {editingQuestion ? 'Update Question' : 'Add Question'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </DialogContent>
    </Dialog>
  );
}
