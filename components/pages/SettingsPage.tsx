
import React from 'react';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { BellIcon } from '../icons/BellIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { LogoutIcon } from '../icons/LogoutIcon';
import { CreditCardIcon } from '../icons/CreditCardIcon';

interface SettingsPageProps {
    userName: string;
    account: string;
    companionName: string;
    subscriptionStatus: string;
    onNavigateToSubscription: () => void;
}

const SettingsCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}> = ({ icon, title, children }) => (
    <div className="bg-brand-dark-bg-secondary rounded-2xl border border-white/10">
        <header className="p-4 border-b border-white/10 flex items-center space-x-3">
            <div className="text-brand-dark-subtext">{icon}</div>
            <h2 className="text-xl font-bold text-brand-dark-text">{title}</h2>
        </header>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const SettingRow: React.FC<{ label: string; value?: string; children?: React.ReactNode; }> = ({ label, value, children }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-brand-dark-text">{label}</p>
            {value && <p className="text-sm text-brand-dark-subtext break-all">{value}</p>}
        </div>
        <div>
            {children}
        </div>
    </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; onToggle: () => void; }> = ({ label, enabled, onToggle }) => (
    <button
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-brand-dark-primary' : 'bg-brand-dark-bg'}`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);


export const SettingsPage: React.FC<SettingsPageProps> = ({ userName, account, companionName, subscriptionStatus, onNavigateToSubscription }) => {
    // Placeholder states for toggles
    const [pushEnabled, setPushEnabled] = React.useState(true);
    const [emailEnabled, setEmailEnabled] = React.useState(false);

    return (
        <div className="p-4 sm:p-8 animate-fade-in-up flex-1">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text">Settings</h1>
            </header>
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Account Settings */}
                <SettingsCard icon={<UserCircleIcon />} title="Account">
                    <SettingRow label="Name" value={userName}>
                        <button className="text-sm font-semibold text-brand-dark-primary hover:underline">Edit Profile</button>
                    </SettingRow>
                    <SettingRow label="Wallet" value={account}>
                        <button className="text-sm font-semibold text-red-500 hover:underline flex items-center space-x-1">
                            <LogoutIcon className="w-4 h-4"/>
                            <span>Disconnect</span>
                        </button>
                    </SettingRow>
                </SettingsCard>

                {/* Subscription Settings */}
                <SettingsCard icon={<CreditCardIcon />} title="Subscription">
                    <SettingRow label="Current Plan" value={subscriptionStatus}>
                        <button onClick={onNavigateToSubscription} className="text-sm font-semibold text-brand-dark-primary hover:underline">Manage</button>
                    </SettingRow>
                </SettingsCard>

                {/* Notifications Settings */}
                <SettingsCard icon={<BellIcon />} title="Notifications">
                    <SettingRow label="Push Notifications">
                       <Toggle enabled={pushEnabled} onToggle={() => setPushEnabled(!pushEnabled)} label="Push Notifications" />
                    </SettingRow>
                     <SettingRow label="Email Updates">
                       <Toggle enabled={emailEnabled} onToggle={() => setEmailEnabled(!emailEnabled)} label="Email Updates" />
                    {/* FIX: Corrected closing tag from </Row> to </SettingRow> */}
                    </SettingRow>
                </SettingsCard>

                 {/* Companion Settings */}
                 <SettingsCard icon={<UsersIcon />} title="Companion">
                    <SettingRow label="Current Companion" value={companionName}>
                        <button className="text-sm font-semibold text-brand-dark-primary hover:underline">Change</button>
                    </SettingRow>
                    <SettingRow label="Conversation History">
                        <button className="text-sm font-semibold text-red-500 hover:underline flex items-center space-x-1">
                            <TrashIcon className="w-4 h-4"/>
                            <span>Reset History</span>
                        </button>
                    </SettingRow>
                </SettingsCard>
            </div>
        </div>
    );
};
