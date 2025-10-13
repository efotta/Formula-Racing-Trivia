
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
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Clock, 
  Users, 
  Shield, 
  UserCheck, 
  UserX,
  Crown,
  AlertTriangle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import PrivacyPolicyEditor from '@/components/admin/privacy-policy-editor';

interface EnhancedAdminPanelProps {
  open: boolean;
  onClose: () => void;
  currentUsername: string;
}

interface Question {
  id: string;
  level: number;
  levelName: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  questionType: 'Fixed' | 'Fluid';
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

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  addedBy: string | null;
  createdAt: string;
  _count: {
    scores: number;
  };
}

interface Admin {
  id: string;
  username: string;
  addedBy: string | null;
  createdAt: string;
}

interface QuestionFormData {
  level: number;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  questionType: 'Fixed' | 'Fluid';
}

export default function EnhancedAdminPanel({ open, onClose, currentUsername }: EnhancedAdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Existing states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [penaltySettings, setPenaltySettings] = useState<PenaltySettings>({
    level3PenaltySeconds: 1.0,
    level4PenaltySeconds: 1.0,
    level5PenaltySeconds: 1.0,
    level4GridDropPenalty: 5.0,
    level5SponsorPenalty: 10.0
  });

  // New states for user and admin management
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');

  // Form states
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [isExporting, setIsExporting] = useState(false);
  const [showPrivacyPolicyEditor, setShowPrivacyPolicyEditor] = useState(false);
  const [formData, setFormData] = useState<QuestionFormData>({
    level: 1,
    question: '',
    correctAnswer: '',
    wrongAnswers: ['', '', ''],
    questionType: 'Fixed'
  });

  useEffect(() => {
    if (open && currentUsername) {
      verifyAdminAccess();
    }
  }, [open, currentUsername]);

  useEffect(() => {
    if (isAuthenticated && open) {
      fetchQuestions();
      fetchFeedback();
      fetchPenaltySettings();
      fetchUsers();
      fetchAdmins();
    }
  }, [isAuthenticated, open]);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        level: editingQuestion.level,
        question: editingQuestion.question,
        correctAnswer: editingQuestion.correctAnswer,
        wrongAnswers: editingQuestion.wrongAnswers,
        questionType: editingQuestion.questionType
      });
    } else {
      setFormData({
        level: 1,
        question: '',
        correctAnswer: '',
        wrongAnswers: ['', '', ''],
        questionType: 'Fixed'
      });
    }
  }, [editingQuestion]);

  const verifyAdminAccess = async () => {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUsername}`
        },
        body: JSON.stringify({ username: currentUsername })
      });

      const data = await response.json();

      if (response.ok && data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setAuthError(data.error || 'Admin access denied');
      }
    } catch (error) {
      console.error('Admin auth error:', error);
      setIsAuthenticated(false);
      setAuthError('Failed to verify admin access');
    } finally {
      setLoading(false);
    }
  };

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentUsername}`,
        'Content-Type': 'application/json'
      }
    });
  };

  // Existing fetch functions with authentication
  const fetchQuestions = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/questions');
      const data = await response.json();
      if (response.ok) {
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/feedback');
      const data = await response.json();
      if (response.ok) {
        setFeedback(data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchPenaltySettings = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/penalty-settings');
      const data = await response.json();
      if (response.ok) {
        setPenaltySettings(data);
      }
    } catch (error) {
      console.error('Error fetching penalty settings:', error);
    }
  };

  // New fetch functions for user and admin management
  const fetchUsers = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/admins');
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  // User management functions
  const handleDeleteUser = async (username: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/users?username=${username}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchUsers();
        alert(`User ${username} deleted successfully`);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  // Admin management functions
  const handleAddAdmin = async () => {
    if (!newAdminUsername.trim()) return;

    try {
      const response = await makeAuthenticatedRequest('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify({ targetUsername: newAdminUsername.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewAdminUsername('');
        fetchAdmins();
        fetchUsers(); // Refresh users to update admin status
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Error adding admin');
    }
  };

  const handleRemoveAdmin = async (username: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/admins?username=${username}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        fetchAdmins();
        fetchUsers(); // Refresh users to update admin status
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Error removing admin');
    }
  };

  // Existing handler functions with authentication
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await makeAuthenticatedRequest(`/api/admin/questions/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleToggleQuestionType = async (id: string, currentType: 'Fixed' | 'Fluid') => {
    const newType = currentType === 'Fixed' ? 'Fluid' : 'Fixed';
    
    try {
      const response = await makeAuthenticatedRequest(`/api/admin/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ questionType: newType })
      });

      if (response.ok) {
        fetchQuestions();
      } else {
        const errorData = await response.json();
        console.error('Error toggling question type:', errorData);
        alert(`Error toggling question type: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling question type:', error);
      alert('Error toggling question type. Please try again.');
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion 
        ? `/api/admin/questions/${editingQuestion.id}`
        : '/api/admin/questions';

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

      const response = await makeAuthenticatedRequest(url, {
        method,
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
          wrongAnswers: ['', '', ''],
          questionType: 'Fixed'
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
      wrongAnswers: ['', '', ''],
      questionType: 'Fixed'
    });
  };

  const handleWrongAnswerChange = (index: number, value: string) => {
    const newWrongAnswers = [...formData.wrongAnswers];
    newWrongAnswers[index] = value;
    setFormData({ ...formData, wrongAnswers: newWrongAnswers });
  };

  const handleSavePenaltySettings = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/penalty-settings', {
        method: 'PUT',
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
      const response = await makeAuthenticatedRequest(`/api/admin/feedback/${id}`, {
        method: 'PUT',
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
      const response = await makeAuthenticatedRequest(`/api/admin/feedback/${id}`, {
        method: 'DELETE'
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

  const handleExportExcel = async () => {
    setIsExporting(true);
    console.log('🚀 Starting Excel export...');
    
    try {
      // Create the download URL with authentication
      const downloadUrl = `/api/admin/export-excel?auth=${encodeURIComponent(currentUsername)}`;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `formula-trivia-questions-${timestamp}.xlsx`;
      
      console.log('📂 Download URL:', downloadUrl);
      console.log('📄 Expected filename:', filename);
      
      // Primary method: Fetch blob and create download
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUsername}`
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('📦 Blob created:', blob.size, 'bytes');
        
        if (blob.size > 0) {
          // Create and trigger download
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          
          // Ensure the link is visible and clickable
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          
          console.log('✅ Excel download initiated successfully');
          showSimpleSuccessNotification(filename);
        } else {
          throw new Error('Empty file received');
        }
      } else {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('❌ Excel export failed:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; max-width: 400px;
                    background: #ef4444; color: white; padding: 16px 20px; 
                    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000; font-family: system-ui, sans-serif; font-size: 14px;">
          <div style="font-weight: 600; margin-bottom: 8px;">
            ❌ Excel Export Failed
          </div>
          <div style="margin-bottom: 8px; opacity: 0.9;">
            Unable to download the Excel file. Please try again.
          </div>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="position: absolute; top: 8px; right: 8px; background: none; 
                         border: none; color: white; font-size: 16px; cursor: pointer;
                         width: 24px; height: 24px; border-radius: 4px;">
            ×
          </button>
        </div>
      `;
      document.body.appendChild(errorNotification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        try {
          if (errorNotification.parentElement) {
            document.body.removeChild(errorNotification);
          }
        } catch (e) {
          console.log('Error notification already removed');
        }
      }, 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Simple success notification
  const showSimpleSuccessNotification = (filename: string) => {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; max-width: 400px;
                  background: #10b981; color: white; padding: 16px 20px; 
                  border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  z-index: 10000; font-family: system-ui, sans-serif; font-size: 14px;">
        <div style="font-weight: 600; margin-bottom: 8px;">
          ✅ Excel Export Started
        </div>
        <div style="margin-bottom: 8px; opacity: 0.9;">
          <strong>File:</strong> ${filename}
        </div>
        <div style="font-size: 12px; opacity: 0.8;">
          Check your Downloads folder
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="position: absolute; top: 8px; right: 8px; background: none; 
                       border: none; color: white; font-size: 16px; cursor: pointer;
                       width: 24px; height: 24px; border-radius: 4px;">
          ×
        </button>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      try {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      } catch (e) {
        console.log('Notification already removed');
      }
    }, 5000);
  };
  

  


  // Show loading or auth error states
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-500" />
              Admin Panel
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Verifying admin access...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
              <p className="text-gray-600 mb-4">
                {authError || 'You do not have permission to access the admin panel.'}
              </p>
              <p className="text-sm text-gray-500">
                Only approved administrators can access this panel.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main admin panel content
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            Admin Panel
            <Badge variant="secondary" className="ml-2">
              <Crown className="w-3 h-3 mr-1" />
              {currentUsername}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="penalties">Penalties</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </h3>
              <div className="text-sm text-gray-600">
                {users.length} total users
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Game Scores</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .sort((a, b) => {
                      const aFirstChar = a.username.charAt(0).toLowerCase();
                      const bFirstChar = b.username.charAt(0).toLowerCase();
                      
                      // Check if the first character is a letter or number
                      const aIsLetter = /[a-z]/.test(aFirstChar);
                      const bIsLetter = /[a-z]/.test(bFirstChar);
                      
                      // If one starts with a letter and the other with a number
                      if (aIsLetter && !bIsLetter) return -1; // a (letter) comes before b (number)
                      if (!aIsLetter && bIsLetter) return 1;  // b (letter) comes before a (number)
                      
                      // Both are letters or both are numbers, sort alphabetically
                      return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
                    })
                    .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.isAdmin && user.isApproved && (
                            <Badge variant="default" className="bg-purple-100 text-purple-700">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.username === currentUsername && (
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user._count.scores}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.username !== currentUsername && user.addedBy !== 'system' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete user "{user.username}"? 
                                  This will permanently delete their account and all associated data. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.username)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {(user.username === currentUsername || user.addedBy === 'system') && (
                          <span className="text-sm text-gray-500">Protected</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Admin Management Tab */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Management
              </h3>
              <div className="text-sm text-gray-600">
                {admins.length} total admins
              </div>
            </div>

            {/* Add Admin Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Add New Admin</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter username to grant admin access"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
                />
                <Button 
                  onClick={handleAddAdmin}
                  disabled={!newAdminUsername.trim()}
                  className="flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Add Admin
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                You can add existing users as admins or create new admin accounts.
              </p>
            </div>

            {/* Admins List */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-purple-500" />
                          {admin.username}
                          {admin.username === currentUsername && (
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.addedBy === 'system' ? 'default' : 'secondary'}>
                          {admin.addedBy === 'system' ? 'System' : admin.addedBy}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {admin.username !== currentUsername && admin.addedBy !== 'system' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <UserX className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove admin privileges from "{admin.username}"? 
                                  They will lose access to the admin panel but their user account will remain.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveAdmin(admin.username)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {(admin.username === currentUsername || admin.addedBy === 'system') && (
                          <span className="text-sm text-gray-500">Protected</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Existing tabs remain the same... */}
          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Question Management
                <Badge variant="secondary" className="ml-2">
                  {questions.length} questions
                </Badge>
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting || questions.length === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export Excel
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowQuestionForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Correct Answer</TableHead>
                    <TableHead>Type</TableHead>
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
                        <Button
                          size="sm"
                          variant={question.questionType === 'Fixed' ? 'default' : 'secondary'}
                          onClick={() => handleToggleQuestionType(question.id, question.questionType)}
                          className={`min-w-[60px] ${
                            question.questionType === 'Fixed' 
                              ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' 
                              : 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                          }`}
                        >
                          {question.questionType}
                        </Button>
                      </TableCell>
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

          {/* Privacy Policy Management Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Policy Management
              </h3>
              <Button
                onClick={() => setShowPrivacyPolicyEditor(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Privacy Policy
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-2">
                Manage your app's Privacy Policy content to ensure compliance with App Store Connect requirements.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Edit all privacy policy sections and content</li>
                <li>• Update effective dates and contact information</li>
                <li>• Ensure compliance with Apple App Store guidelines</li>
                <li>• All changes are saved locally for immediate updates</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">App Store Connect Compliance</h4>
              <p className="text-sm text-blue-800">
                This privacy policy editor ensures your content meets Apple's App Store Connect requirements.
                The privacy policy is accessible at <strong>/privacy-policy</strong> and includes all required sections.
              </p>
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
                  <Label htmlFor="question-type">Question Type</Label>
                  <Select 
                    value={formData.questionType} 
                    onValueChange={(value: 'Fixed' | 'Fluid') => setFormData({ ...formData, questionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="Fluid">Fluid</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    Fixed questions remain static, while Fluid questions can be dynamic
                  </p>
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

        {/* Privacy Policy Editor Modal */}
        <PrivacyPolicyEditor
          open={showPrivacyPolicyEditor}
          onClose={() => setShowPrivacyPolicyEditor(false)}
        />

      </DialogContent>
    </Dialog>
  );
}
