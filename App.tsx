
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { APP_NAME, POLYGON_AMOY_CHAIN_ID, TRIAL_DURATION_MS } from './constants';
import { WalletIcon } from './components/icons/WalletIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { Toast } from './components/Toast';
import { ChatBubbleIcon } from './components/icons/ChatBubbleIcon';
import { ShieldIcon } from './components/icons/ShieldIcon';
import { CoinIcon } from './components/icons/CoinIcon';
import { OnboardingPage, OnboardingData } from './components/OnboardingPage';
import { DashboardPage } from './components/DashboardPage';

type View = 'landing' | 'connected' | 'onboarding' | 'dashboard';
type ToastState = { message: string; type: 'success' | 'error' } | null;

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
    <div className="bg-brand-dark-bg-secondary p-6 rounded-xl border border-white/10 text-center flex flex-col items-center transform transition-transform duration-300 hover:-translate-y-2">
        <div className="bg-brand-dark-primary/20 p-3 rounded-full mb-4 text-brand-dark-primary">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-brand-dark-text mb-2">{title}</h3>
        <p className="text-brand-dark-subtext text-base leading-relaxed">{description}</p>
    </div>
);

// New Connection Success Card
const ConnectedCard: React.FC<{ account: string; onProceed: () => void; }> = ({ account, onProceed }) => (
    <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text flex flex-col items-center justify-center p-4 animate-fade-in-up">
        <div className="w-full max-w-md bg-brand-dark-bg-secondary rounded-2xl shadow-2xl border border-white/10 p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-brand-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brand-dark-text mb-2">Connection Successful</h2>
            <p className="text-brand-dark-subtext mb-6 break-words">Connected as: {account}</p>
            <button
                onClick={onProceed}
                className="w-full bg-brand-dark-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-brand-dark-secondary transition-colors duration-300"
            >
                Proceed
            </button>
        </div>
    </div>
);


const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);

  // Safely parse and validate data from localStorage
  const loadAndValidateOnboardingData = (userAddress: string): OnboardingData | null => {
    const storedData = localStorage.getItem(`aura_onboarding_data_${userAddress}`);
    if (!storedData) return null;

    try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && typeof parsedData === 'object' && 'name' in parsedData && 'companion' in parsedData) {
            return parsedData;
        }
        console.warn("Invalid onboarding data found in localStorage. Forcing re-onboarding.");
        localStorage.removeItem(`aura_onboarding_data_${userAddress}`); // Clean up bad data
    } catch (error) {
        console.error("Failed to parse onboarding data from localStorage:", error);
        localStorage.removeItem(`aura_onboarding_data_${userAddress}`); // Clean up bad data
    }
    return null;
  };

  const checkAccessStatus = useCallback((userAddress: string) => {
    setIsLoading(true); // Show a brief loading state for a smoother transition

    const subExpiry = localStorage.getItem(`aura_subscription_expiry_${userAddress}`);
    const trialExpiry = localStorage.getItem(`aura_trial_expiry_${userAddress}`);
    let hasAccess = false;

    // 1. Check for an active subscription
    if (subExpiry && new Date().getTime() < parseInt(subExpiry, 10)) {
        console.log("Active subscription found.");
        hasAccess = true;
    }
    // 2. Check for an active trial
    else if (trialExpiry && new Date().getTime() < parseInt(trialExpiry, 10)) {
        console.log("Active trial found.");
        hasAccess = true;
    }
    // 3. New user or expired user -> Start a new trial if no trial has ever been set
    else if (!trialExpiry) {
        console.log("No active subscription or trial. Starting a new 3-day trial.");
        const newTrialExpiry = new Date().getTime() + TRIAL_DURATION_MS;
        localStorage.setItem(`aura_trial_expiry_${userAddress}`, newTrialExpiry.toString());
        setToast({ message: "Welcome! Your 3-day free trial has started.", type: 'success' });
        hasAccess = true;
    } else {
        console.log("Subscription and trial have expired.");
        hasAccess = false;
    }
    
    setIsSubscriptionActive(hasAccess);

    const loadedData = loadAndValidateOnboardingData(userAddress);
    if (loadedData) {
        setOnboardingData(loadedData);
        setView('dashboard');
    } else {
        setView('onboarding');
    }
    
    setIsLoading(false);
  }, []);


  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setProvider(null);
        setOnboardingData(null);
        localStorage.removeItem('last_connected_account');
        setView('landing');
        setToast({ message: "Wallet disconnected.", type: 'success' });
      } else {
        const newAddress = accounts[0];
        setAccount(newAddress);
        setProvider(new ethers.BrowserProvider(window.ethereum));
        localStorage.setItem('last_connected_account', newAddress);
        setView('connected');
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setToast({ message: "Please install a Web3 wallet like MetaMask.", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const address = signer.address;
      setAccount(address);
      setProvider(browserProvider);
      localStorage.setItem('last_connected_account', address);

      const network = await browserProvider.getNetwork();
      if (network.chainId !== BigInt(POLYGON_AMOY_CHAIN_ID)) {
        setToast({ message: "Switching to Polygon Amoy...", type: 'success' });
        await switchNetwork(browserProvider);
      }

      setToast({ message: `Wallet connected!`, type: 'success' });
      setView('connected');
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      setToast({ message: error.message || "An unexpected error occurred.", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchNetwork = async (prov: ethers.BrowserProvider) => {
    try {
      await prov.send('wallet_switchEthereumChain', [{ chainId: POLYGON_AMOY_CHAIN_ID }]);
    } catch (switchError: any) {
      // Standard error code for "user rejected the request"
      if (switchError.code === 4001) {
          throw new Error("You must switch to the Polygon Amoy network to continue.");
      }
      // Standard error code for "chain not added"
      if (switchError.code === 4902) {
        try {
          await prov.send('wallet_addEthereumChain', [
            {
              chainId: POLYGON_AMOY_CHAIN_ID,
              chainName: process.env.REACT_APP_POLYGON_AMOY_NETWORK_NAME,
              rpcUrls: [process.env.REACT_APP_POLYGON_AMOY_RPC_URL],
              nativeCurrency: {
                name: process.env.REACT_APP_POLYGON_AMOY_CURRENCY_SYMBOL,
                symbol: process.env.REACT_APP_POLYGON_AMOY_CURRENCY_SYMBOL,
                decimals: 18,
              },
            },
          ]);
        } catch (addError) {
          console.error("Failed to add network:", addError);
          throw new Error("Failed to add Polygon Amoy network.");
        }
      } else {
        console.error("Failed to switch network:", switchError);
        throw new Error("Failed to switch to Polygon Amoy network.");
      }
    }
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    if (!account) return;
    localStorage.setItem(`aura_onboarding_data_${account}`, JSON.stringify(data));
    setOnboardingData(data);
    setView('dashboard');
    setToast({ message: "Setup complete. Welcome to your safe space.", type: 'success' });
  };
  
  const handleSuccessfulSubscription = () => {
    if (!account) return;
    setToast({ message: "Subscription successful! Welcome back.", type: 'success' });
    checkAccessStatus(account); // Re-check access to update state and UI
  };


  const renderLandingPage = () => (
    <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text font-sans flex flex-col">
      <main className="flex-grow flex flex-col justify-center items-center p-4 md:p-8 animate-fade-in-up">
        {/* Hero Section */}
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center text-center md:text-left">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Meet <span className="text-brand-dark-primary">{APP_NAME}</span>, Your Personal AI Companion
            </h1>
            <p className="text-lg md:text-xl text-brand-dark-subtext max-w-xl mx-auto md:mx-0">
              Find a safe space to talk, reflect, and grow, with the privacy and ownership of Web3.
            </p>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="bg-brand-dark-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-dark-secondary transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed animate-subtle-pulse"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon className="w-5 h-5" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <WalletIcon className="w-6 h-6" />
                    <span>Connect Wallet to Begin</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-md mx-auto h-64 md:h-auto">
            <div className="absolute inset-0 bg-brand-dark-primary rounded-full blur-3xl opacity-30"></div>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="relative w-full h-full animate-spin-slow">
              <path fill="#2563EB" d="M47.7,-69.4C61.8,-62.3,73.4,-49.2,79.5,-34C85.5,-18.8,86,0.3,80.5,16.5C75,32.7,63.5,46,49.8,56.7C36.1,67.4,20.2,75.5,2.9,76.5C-14.4,77.5,-31.7,71.4,-45,61.5C-58.3,51.6,-67.7,37.9,-72.6,22.7C-77.5,7.6,-78,-9.1,-72.4,-23.4C-66.8,-37.8,-55.1,-49.9,-42,-58.3C-28.9,-66.7,-14.4,-71.4,1.1,-73.2C16.6,-75.1,33.5,-76.5,47.7,-69.4Z" transform="translate(100 100)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🧘</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto mt-24 md:mt-32 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Sanctuary for Your Mind</h2>
            <p className="text-lg text-brand-dark-subtext max-w-3xl mx-auto mb-12">
                AURA provides the tools you need in a secure, decentralized environment.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<ChatBubbleIcon className="w-8 h-8"/>}
                    title="24/7 AI Companion"
                    description="A non-judgmental AI, trained to listen and provide supportive conversation whenever you need it."
                />
                 <FeatureCard
                    icon={<ShieldIcon className="w-8 h-8"/>}
                    title="Decentralized & Private"
                    description="Your conversations are yours. Save them to decentralized storage, ensuring your data remains private and secure."
                />
                 <FeatureCard
                    icon={<CoinIcon className="w-8 h-8"/>}
                    title="Simple Web3 Onboarding"
                    description="A low-cost payment on the Polygon network grants you access. No hidden fees, full ownership of your data."
                />
            </div>
        </div>
      </main>

      <footer className="text-center p-6 text-brand-dark-subtext">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All Rights Reserved.</p>
      </footer>
    </div>
  );

  const renderContent = () => {
    switch (view) {
        case 'landing':
            return renderLandingPage();
        case 'connected':
            return account ? <ConnectedCard account={account} onProceed={() => checkAccessStatus(account)} /> : renderLandingPage();
        case 'onboarding':
            return <OnboardingPage onComplete={handleOnboardingComplete} />;
        case 'dashboard':
            if (account && onboardingData) {
                return (
                    <DashboardPage
                        account={account}
                        provider={provider}
                        onboardingData={onboardingData}
                        isSubscriptionActive={isSubscriptionActive}
                        onSuccessfulSubscription={handleSuccessfulSubscription}
                    />
                );
            }
            // Add a loading state to prevent flickering to the landing page
            // while data is being loaded and validated.
            return (
                <div className="min-h-screen bg-brand-dark-bg flex items-center justify-center">
                    <SpinnerIcon className="w-16 h-16 text-brand-dark-primary" />
                </div>
            );
        default:
            return renderLandingPage();
    }
  };

  return (
    <>
      {renderContent()}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;
