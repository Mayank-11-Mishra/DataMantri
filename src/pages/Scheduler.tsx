import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Mail, MessageSquare, Clock, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Scheduler = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [subject, setSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [frequency, setFrequency] = useState('');
  const [recipients, setRecipients] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState<string[]>([]);
  const { toast } = useToast();

  const existingSchedulers = [
    {
      id: 1,
      name: 'Weekly Sales Report',
      dashboard: 'Sales Performance Q4',
      frequency: 'Weekly - Monday 9:00 AM',
      recipients: ['manager@company.com', 'team@company.com'],
      status: 'active',
      lastRun: '2 days ago',
      nextRun: 'Tomorrow 9:00 AM'
    },
    {
      id: 2,
      name: 'Monthly Analytics Summary',
      dashboard: 'Marketing Analytics',
      frequency: 'Monthly - 1st at 8:00 AM',
      recipients: ['executives@company.com'],
      status: 'paused',
      lastRun: '1 week ago',
      nextRun: 'Next month'
    },
    {
      id: 3,
      name: 'Daily Customer Insights',
      dashboard: 'Customer Insights',
      frequency: 'Daily - 7:00 AM',
      recipients: ['support@company.com', 'sales@company.com'],
      status: 'active',
      lastRun: '1 hour ago',
      nextRun: 'Tomorrow 7:00 AM'
    }
  ];

  const dashboards = [
    { id: '1', name: 'Sales Performance Q4' },
    { id: '2', name: 'Marketing Analytics' },
    { id: '3', name: 'Customer Insights' },
    { id: '4', name: 'Financial Overview' },
  ];

  const sources = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
    { id: 'slack', name: 'Slack', icon: MessageSquare },
  ];

  const frequencies = [
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
    { id: 'custom', name: 'Custom' },
  ];

  const handleCreateScheduler = () => {
    if (!selectedDashboard || !selectedSource || !subject || !recipients || !frequency) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Scheduler Created",
      description: "Your report scheduler has been created successfully.",
    });

    // Reset form
    setSelectedDashboard('');
    setSelectedSource('');
    setSubject('');
    setMailBody('');
    setFrequency('');
    setRecipients('');
    setDeliveryFormat([]);
  };

  const handleDeliveryFormatChange = (format: string, checked: boolean) => {
    if (checked) {
      setDeliveryFormat(prev => [...prev, format]);
    } else {
      setDeliveryFormat(prev => prev.filter(f => f !== format));
    }
  };

  const toggleScheduler = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toast({
      title: `Scheduler ${newStatus === 'active' ? 'Activated' : 'Paused'}`,
      description: `The scheduler has been ${newStatus === 'active' ? 'activated' : 'paused'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduler</h1>
          <p className="text-muted-foreground">
            Automate report delivery and manage scheduled tasks
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Scheduler
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Scheduler</DialogTitle>
              <DialogDescription>
                Set up automated report delivery with custom schedules
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Dashboard Selection */}
              <div className="space-y-2">
                <Label htmlFor="dashboard">Select Dashboard *</Label>
                <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        {dashboard.name}
                      </SelectItem>
                    ))}</SelectContent>
                </Select>
              </div>

              {/* Source Selection */}
              <div className="space-y-2">
                <Label>Delivery Source *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {sources.map((source) => (
                    <Card
                      key={source.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedSource === source.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedSource(source.id)}
                    >
                      <CardContent className="flex items-center justify-center p-4">
                        <div className="text-center">
                          <source.icon className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{source.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Subject and Body */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mail-body">Message Body</Label>
                  <Textarea
                    id="mail-body"
                    placeholder="Enter message content..."
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.id} value={freq.id}>
                          {freq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    defaultValue="09:00"
                  />
                </div>
              </div>

              {/* Delivery Format */}
              <div className="space-y-2">
                <Label>Delivery Format</Label>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pdf"
                      checked={deliveryFormat.includes('pdf')}
                      onCheckedChange={(checked) => handleDeliveryFormatChange('pdf', checked as boolean)}
                    />
                    <Label htmlFor="pdf">PDF Attachment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inline"
                      checked={deliveryFormat.includes('inline')}
                      onCheckedChange={(checked) => handleDeliveryFormatChange('inline', checked as boolean)}
                    />
                    <Label htmlFor="inline">Inline Content</Label>
                  </div>
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients *</Label>
                <Textarea
                  id="recipients"
                  placeholder="Enter email addresses separated by commas"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple email addresses with commas
                </p>
              </div>

              <Button onClick={handleCreateScheduler} className="w-full">
                Create Scheduler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Schedulers */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Schedulers</CardTitle>
          <CardDescription>Manage your automated report schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {existingSchedulers.map((scheduler) => (
              <div key={scheduler.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{scheduler.name}</h3>
                    <Badge variant={scheduler.status === 'active' ? 'default' : 'secondary'}>
                      {scheduler.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Dashboard: {scheduler.dashboard}</p>
                    <p>Frequency: {scheduler.frequency}</p>
                    <p>Recipients: {scheduler.recipients.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Last run: {scheduler.lastRun}</span>
                    <span>Next run: {scheduler.nextRun}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleScheduler(scheduler.id, scheduler.status)}
                  >
                    {scheduler.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scheduler Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduler Metadata</CardTitle>
          <CardDescription>Performance and execution statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8</div>
              <p className="text-sm text-muted-foreground">Total Schedulers</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">6</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <p className="text-sm text-muted-foreground">Paused</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">124</div>
              <p className="text-sm text-muted-foreground">Reports Sent This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scheduler;
