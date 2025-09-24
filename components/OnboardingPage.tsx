import React, { useState } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

const TOTAL_STEPS = 4;

export interface OnboardingData {
  name: string;
  mood: string;
  emergencyContact: {
    name: string;
    contact: string;
  };
}

interface OnboardingPageProps {
  onComplete: (data: OnboardingData) => void;
}

const moodOptions = [
  "Feeling anxious",
  "Just curious",
  "Stressed out",
  "Feeling down",
  "Looking for a friend",
  "Other",
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    mood: '',
    emergencyContact: { name: '', contact: '' },
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
        const field = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            emergencyContact: { ...prev.emergencyContact, [field]: value }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div key={1} className="animate-slide-in-from-right">
            <h2 className="text-3xl font-bold text-brand-dark-text mb-2">Welcome to AURA</h2>
            <p className="text-brand-dark-subtext mb-8">Let's start by getting to know you a little better.</p>
            <label htmlFor="name" className="block text-lg font-medium text-brand-dark-subtext mb-2">What should we call you?</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name or a nickname"
              className="w-full bg-brand-dark-bg-secondary p-4 rounded-lg border border-white/10 focus:ring-2 focus:ring-brand-dark-primary focus:outline-none"
              required
            />
          </div>
        );
      case 2:
        return (
            <div key={2} className="animate-slide-in-from-right">
              <h2 className="text-3xl font-bold text-brand-dark-text mb-2">How are you feeling?</h2>
              <p className="text-brand-dark-subtext mb-8">This helps us tailor your experience. Select one.</p>
              <div className="grid grid-cols-2 gap-4">
                  {moodOptions.map(mood => (
                      <button 
                          key={mood}
                          type="button"
                          onClick={() => {
                              setFormData(prev => ({ ...prev, mood }));
                              handleNext();
                          }}
                          className={`p-4 rounded-lg border-2 text-center transition-colors duration-200 ${
                              formData.mood === mood 
                              ? 'bg-brand-dark-primary border-brand-dark-primary' 
                              : 'bg-brand-dark-bg-secondary border-white/10 hover:border-brand-dark-primary/50'
                          }`}
                      >
                          {mood}
                      </button>
                  ))}
              </div>
            </div>
          );
      case 3:
        return (
            <div key={3} className="animate-slide-in-from-right">
                <h2 className="text-3xl font-bold text-brand-dark-text mb-2">Your Safety Net</h2>
                <p className="text-brand-dark-subtext mb-8">This is optional, but it's good to have a trusted contact. This is stored securely for your eyes only.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="emergencyName" className="block text-lg font-medium text-brand-dark-subtext mb-2">Contact's Name</label>
                        <input
                        type="text"
                        id="emergencyName"
                        name="emergencyContact.name"
                        value={formData.emergencyContact.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Jane Doe"
                        className="w-full bg-brand-dark-bg-secondary p-4 rounded-lg border border-white/10 focus:ring-2 focus:ring-brand-dark-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="emergencyContact" className="block text-lg font-medium text-brand-dark-subtext mb-2">Contact's Phone or Email</label>
                        <input
                        type="text"
                        id="emergencyContact"
                        name="emergencyContact.contact"
                        value={formData.emergencyContact.contact}
                        onChange={handleInputChange}
                        placeholder="Enter phone or email address"
                        className="w-full bg-brand-dark-bg-secondary p-4 rounded-lg border border-white/10 focus:ring-2 focus:ring-brand-dark-primary focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        );
      case 4:
        return (
            <div key={4} className="animate-slide-in-from-right text-center">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-brand-dark-text mb-2">You're all set, {formData.name}!</h2>
                <p className="text-brand-dark-subtext max-w-sm mx-auto">Your personalized, safe space is ready. Remember, this is a place to reflect, grow, and be heard.</p>
            </div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1 && !formData.name.trim()) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
            <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand-dark-bg-secondary">
                    <div style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-dark-primary transition-all duration-500"></div>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-dark-bg-secondary/50 border border-white/10 p-8 rounded-2xl shadow-2xl min-h-[420px] flex flex-col justify-between">
            <div>{renderStep()}</div>
            
            <div className="flex items-center justify-between mt-8">
                <div>
                    {currentStep > 1 && (
                        <button type="button" onClick={handleBack} className="flex items-center space-x-2 text-brand-dark-subtext hover:text-brand-dark-text transition-colors">
                            <ArrowLeftIcon />
                            <span>Back</span>
                        </button>
                    )}
                </div>
                
                <div>
                {currentStep < TOTAL_STEPS && (
                    <button 
                        type="button" 
                        onClick={handleNext}
                        disabled={isNextDisabled()}
                        className="bg-brand-dark-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-dark-secondary transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        Next
                    </button>
                )}
                 {currentStep === 3 && (
                     <button 
                        type="button" 
                        onClick={handleNext}
                        className="bg-transparent border border-brand-dark-primary text-brand-dark-primary font-bold py-3 px-8 ml-4 rounded-full shadow-lg hover:bg-brand-dark-primary/20 transition-all duration-300"
                    >
                        Skip for Now
                    </button>
                )}
                 {currentStep === TOTAL_STEPS && (
                    <button 
                        type="submit"
                        className="bg-brand-dark-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-dark-secondary transition-all duration-300 transform hover:scale-105 animate-subtle-pulse"
                    >
                        Start Chatting
                    </button>
                )}
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};
