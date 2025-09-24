
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { APP_NAME, POLYGON_AMOY_CHAIN_ID, PAYMENT_AMOUNT, PAYMENT_RECIPIENT_ADDRESS, POLYGON_AMOY_NETWORK_NAME, POLYGON_AMOY_RPC_URL, POLYGON_AMOY_CURRENCY_SYMBOL } from './constants';
import { WalletIcon } from './components/icons/WalletIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { ChatPage } from './components/ChatPage';
import { Toast } from './components/Toast';
import { ChatBubbleIcon } from './components/icons/ChatBubbleIcon';
import { ShieldIcon } from './components/icons/ShieldIcon';
import { CoinIcon } from './components/icons/CoinIcon';
import { OnboardingPage, OnboardingData } from './components/OnboardingPage';
import { DashboardPage } from './components/DashboardPage';

type View = 'landing' | 'payment' | 'onboarding' | 'dashboard' | 'chat';
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


const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<'Luna' | 'Orion'>('Luna');
  const [initialMessage, setInitialMessage] = useState<string>('');

  const checkSubscriptionAndOnboarding = useCallback((userAddress: string) => {
    // 1. Check for an active subscription
    const subExpiry = localStorage.getItem(`aura_subscription_expiry_${userAddress}`);
    if (subExpiry && new Date().getTime() < parseInt(subExpiry, 10)) {
        console.log("Active subscription found.");
        const storedData = localStorage.getItem(`aura_onboarding_data_${userAddress}`);
        if (storedData) {
            setOnboardingData(JSON.parse(storedData));
            setView('dashboard');
        } else {
            // This case happens if they paid but didn't finish onboarding
            setView('onboarding');
        }
        return true;
    }

    // 2. Grandfather existing users: Check for old onboarding data
    const storedOnboardingData = localStorage.getItem(`aura_onboarding_data_${userAddress}`);
    if (storedOnboardingData) {
        console.log("Grandfathering user. Granting complimentary 30-day pass.");
        const thirtyDaysFromNow = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(`aura_subscription_expiry_${userAddress}`, thirtyDaysFromNow.toString());
        setOnboardingData(JSON.parse(storedOnboardingData));
        setToast({ message: "As an existing user, you've received a 30-day pass!", type: 'success' });
        setView('dashboard');
        return true;
    }

    // 3. No subscription, no old data -> new user
    console.log("No active subscription or existing data found.");
    setView('payment');
    return false;
  }, []);


  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setProvider(null);
        setOnboardingData(null); // Clear data on disconnect
        setView('landing');
        setToast({ message: "Wallet disconnected.", type: 'success' });
      } else {
        const newAddress = accounts[0];
        setAccount(newAddress);
        setProvider(new ethers.BrowserProvider(window.ethereum));
        checkSubscriptionAndOnboarding(newAddress);
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
  }, [checkSubscriptionAndOnboarding]);
  
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

      const network = await browserProvider.getNetwork();
      if (network.chainId !== BigInt(POLYGON_AMOY_CHAIN_ID)) {
        await switchNetwork(browserProvider);
      }
      
      checkSubscriptionAndOnboarding(address);
      setToast({ message: `Wallet connected: ${address.substring(0, 6)}...`, type: 'success' });
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
      if (switchError.code === 4902) {
        try {
          await prov.send('wallet_addEthereumChain', [
            {
              chainId: POLYGON_AMOY_CHAIN_ID,
              chainName: POLYGON_AMOY_NETWORK_NAME,
              rpcUrls: [POLYGON_AMOY_RPC_URL],
              nativeCurrency: {
                name: POLYGON_AMOY_CURRENCY_SYMBOL,
                symbol: POLYGON_AMOY_CURRENCY_SYMBOL,
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

  const handlePayment = async () => {
    if (!provider || !account) {
        setToast({ message: "Wallet not connected.", type: 'error' });
        return;
    }
    setIsLoading(true);
    try {
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
            to: PAYMENT_RECIPIENT_ADDRESS,
            value: ethers.parseEther(PAYMENT_AMOUNT),
        });
        await tx.wait();

        const thirtyDaysFromNow = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(`aura_subscription_expiry_${account}`, thirtyDaysFromNow.toString());

        setToast({ message: "Payment successful! Let's get you set up.", type: 'success' });
        setView('onboarding');

    } catch (error: any) {
        console.error("Payment failed:", error);
        setToast({ message: error.reason || "Payment failed or was rejected.", type: 'error' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOnboardingComplete = (data: OnboardingData) => {
    if (!account) return;
    localStorage.setItem(`aura_onboarding_data_${account}`, JSON.stringify(data));
    setOnboardingData(data);
    setView('dashboard');
    setToast({ message: "Setup complete. Welcome to your safe space.", type: 'success' });
  };

  const handleStartChat = (companion: 'Luna' | 'Orion', message: string) => {
    setSelectedCompanion(companion);
    setInitialMessage(message);
    setView('chat');
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

  const renderPaymentPage = () => (
    <div className="min-h-screen bg-brand-dark-bg text-brand-dark-text flex flex-col items-center justify-center p-4 animate-fade-in-up">
        <div className="w-full max-w-md bg-brand-dark-bg-secondary p-8 rounded-2xl shadow-2xl border border-white/10 text-center">
            <div className="mx-auto bg-brand-dark-primary/20 text-brand-dark-primary rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-brand-dark-text mb-2">Wallet Connected!</h2>
            <p className="text-brand-dark-subtext mb-6 break-words">Account: {account}</p>
            <div className="bg-brand-dark-bg p-4 rounded-lg mb-6 border border-white/10">
                <p className="text-sm text-brand-dark-subtext">30-Day Access Fee</p>
                <p className="text-3xl font-bold text-brand-dark-text">{PAYMENT_AMOUNT} {POLYGON_AMOY_CURRENCY_SYMBOL}</p>
            </div>
            <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-brand-dark-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-brand-dark-secondary transition-colors duration-300 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <SpinnerIcon className="mr-2" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <span>Proceed to Payment</span>
                )}
            </button>
            <p className="text-xs text-brand-dark-subtext mt-4">You will be prompted to confirm the transaction in your wallet.</p>
        </div>
    </div>
  );


  const renderContent = () => {
    switch (view) {
        case 'landing':
            return renderLandingPage();
        case 'payment':
            return renderPaymentPage();
        case 'onboarding':
            return <OnboardingPage onComplete={handleOnboardingComplete} />;
        case 'dashboard':
            return <DashboardPage userName={onboardingData?.name || 'friend'} onStartChat={handleStartChat} />;
        case 'chat':
            return account && onboardingData ? (
                <ChatPage 
                    account={account} 
                    companion={selectedCompanion} 
                    userName={onboardingData.name}
                    initialUserMessage={initialMessage}
                />
            ) : renderLandingPage();
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
