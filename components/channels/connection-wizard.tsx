'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  CheckCircle, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ConnectionWizardProps {
  onConnect: (usernameOrLink: string) => Promise<any>;
}

interface ConnectionWizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const wizardSteps: ConnectionWizardStep[] = [
  {
    id: '1',
    title: 'Channel Input',
    description: 'Enter channel username or invite link',
    completed: false
  },
  {
    id: '2', 
    title: 'Validation',
    description: 'Validate channel and check permissions',
    completed: false
  },
  {
    id: '3',
    title: 'Connection',
    description: 'Connect channel to TGeasy',
    completed: false
  },
  {
    id: '4',
    title: 'Complete',
    description: 'Channel successfully connected',
    completed: false
  }
];

export function ConnectionWizard({ onConnect }: ConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(wizardSteps);
  const [channelInput, setChannelInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleConnect = async () => {
    if (!channelInput.trim()) {
      setError('Please enter a channel username or invite link');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Step 1: Input validation
      setCurrentStep(1);
      setSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, completed: true } : step
      ));

      // Step 2: Validation (simulate)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(2);
      setSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, completed: true } : step
      ));

      // Step 3: Connection
      await onConnect(channelInput);
      setCurrentStep(3);
      setSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, completed: true } : step
      ));

      // Step 4: Complete
      setSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, completed: true } : step
      ));

      // Auto-close after success
      setTimeout(() => {
        setOpen(false);
        resetWizard();
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to connect channel');
    } finally {
      setIsConnecting(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setSteps(wizardSteps.map(step => ({ ...step, completed: false })));
    setChannelInput('');
    setError(null);
    setIsConnecting(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetWizard();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Channel Connection Wizard</DialogTitle>
          <DialogDescription>
            Connect and configure your Telegram channels with TGeasy
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  index === currentStep ? 'border-primary bg-primary/5' : 'border-border',
                  step.completed ? 'bg-green-50 border-green-200' : ''
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step.completed ? 'bg-green-500 text-white' : 
                  index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Channel Username or Invite Link</label>
                <Input
                  placeholder="@channel_username or https://t.me/channel_username"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting || !channelInput.trim() || currentStep === steps.length - 1}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Channel'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 