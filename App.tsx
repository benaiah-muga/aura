import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { APP_NAME, APP_TAGLINE, POLYGON_AMOY_CHAIN_ID, PAYMENT_AMOUNT, PAYMENT_RECIPIENT_ADDRESS, POLYGON_AMOY_NETWORK_NAME, POLYGON_AMOY_RPC_URL, POLYGON_AMOY_CURRENCY_SYMBOL } from './constants';
import { WalletIcon } from './components/icons/WalletIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { ChatPage } from './components/ChatPage';
import { Toast } from './components/Toast';

type View = 'landing' | 'payment' | 'chat';
type ToastState = { message: string; type: 'success' | 'error' } | null;

const App: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isAmoyNetwork, setIsAmoyNetwork] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const checkPaymentStatus = useCallback((currentAccount: string) => {
    const paymentStatus = localStorage.getItem(`payment_${currentAccount}`);
    if (paymentStatus === 'true') {
      setHasPaid(true);
    }
  }, []);

  const checkNetwork = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const onAmoy = network.chainId.toString() === BigInt(POLYGON_AMOY_CHAIN_ID).toString();
      setIsAmoyNetwork(onAmoy);
      return onAmoy;
    }
    return false;
  };
  
  const connectWallet = async () => {
    setConnectError(null);
    setIsLoading(true);
    
    if (!window.ethereum) {
      setConnectError('MetaMask is not installed or not accessible. Please ensure the browser extension is active and refresh the page.');
      setIsLoading(false);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = ethers.getAddress(accounts[0]);
      setAccount(currentAccount);
      await checkNetwork();
      checkPaymentStatus(currentAccount);
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      if (error.code === 4001) {
        setConnectError('You rejected the connection request in MetaMask. Please try again.');
      } else {
        setConnectError('Failed to connect wallet. Please check your MetaMask setup and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
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
            ],
          });
        } catch (addError) {
          console.error("Failed to add network", addError);
          setToast({ message: 'Failed to add Polygon Amoy network.', type: 'error' });
        }
      } else {
          console.error("Failed to switch network", switchError);
          setToast({ message: 'Failed to switch network.', type: 'error' });
      }
    }
  };

  const handlePayment = async () => {
    if (!window.ethereum || !account) return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: PAYMENT_RECIPIENT_ADDRESS,
        value: ethers.parseEther(PAYMENT_AMOUNT),
      });
      await tx.wait();
      localStorage.setItem(`payment_${account}`, 'true');
      setHasPaid(true);
      setToast({ message: 'Payment successful! Chat unlocked.', type: 'success' });
    } catch (error: any) {
      console.error("Payment failed:", error);
      const message = error.code === 'INSUFFICIENT_FUNDS' ? `Insufficient ${POLYGON_AMOY_CURRENCY_SYMBOL} for payment.` : 'Payment failed or was rejected.';
      setToast({ message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAccount = ethers.getAddress(accounts[0]);
          setAccount(newAccount);
          setHasPaid(false); // Reset payment status on account change
          checkPaymentStatus(newAccount);
        } else {
          setAccount(null);
          setHasPaid(false);
        }
      };
      
      const handleChainChanged = () => {
         checkNetwork();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkPaymentStatus]);

  const getCurrentView = (): View => {
    if (!account) return 'landing';
    if (account && isAmoyNetwork && hasPaid) return 'chat';
    return 'payment';
  };

  const view = getCurrentView();

  const Header = () => (
    <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="text-2xl">🧘</div>
        <h1 className="text-xl font-bold text-brand-text">{APP_NAME}</h1>
      </div>
      {account && (
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-brand-subtext font-medium text-sm">
          {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
        </div>
      )}
    </header>
  );

  const renderContent = () => {
    switch(view) {
      case 'landing':
        return (
          <div className="text-center animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold text-brand-text mb-4">{APP_NAME}</h1>
            <p className="text-lg md:text-xl text-brand-subtext mb-8">{APP_TAGLINE}</p>
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-secondary transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
            >
              {isLoading ? <SpinnerIcon className="w-6 h-6" /> : <><WalletIcon className="w-6 h-6 mr-2" /> Connect Wallet to Start</>}
            </button>
            {connectError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md mx-auto text-left">
                <p className="font-semibold">Connection Failed</p>
                <p className="text-sm">{connectError}</p>
              </div>
            )}
          </div>
        );
      case 'payment':
        if (!isAmoyNetwork) {
          return (
            <div className="text-center bg-white p-8 rounded-2xl shadow-xl animate-fade-in-up max-w-md w-full">
              <h2 className="text-2xl font-bold text-brand-text mb-2">Incorrect Network</h2>
              <p className="text-brand-subtext mb-6">Please switch to the {POLYGON_AMOY_NETWORK_NAME} to continue.</p>
              <button
                onClick={switchNetwork}
                className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-brand-secondary transition-all duration-300"
              >
                Switch to {POLYGON_AMOY_NETWORK_NAME}
              </button>
            </div>
          );
        }
        return (
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl animate-fade-in-up max-w-md w-full">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-brand-text mb-2">Unlock Your Companion</h2>
            <p className="text-brand-subtext mb-6">A one-time payment is required to access your AI companion and support the platform.</p>
            <div className="bg-brand-bg p-4 rounded-lg mb-6">
              <p className="text-brand-subtext">Amount</p>
              <p className="text-3xl font-bold text-brand-primary">{PAYMENT_AMOUNT} {POLYGON_AMOY_CURRENCY_SYMBOL}</p>
            </div>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="bg-brand-accent text-white font-bold py-3 px-8 rounded-full shadow-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center w-full"
            >
              {isLoading ? <SpinnerIcon className="w-6 h-6" /> : <><CheckCircleIcon className="w-6 h-6 mr-2" /> Pay and Unlock Chat</>}
            </button>
          </div>
        );
      case 'chat':
        return <ChatPage account={account!} />;
    }
  };

  return (
    <div className={`min-h-screen font-sans bg-brand-bg ${view !== 'chat' ? 'flex items-center justify-center' : ''}`}>
      <div className="w-full h-full">
        {view !== 'chat' && <Header />}
        <main className={`transition-opacity duration-500 ${view !== 'chat' ? 'p-4' : ''}`}>
          {renderContent()}
        </main>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default App;