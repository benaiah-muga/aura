
import React, { useState, useEffect } from 'react';
import { Toast } from '../Toast';
import { AngryIcon } from '../icons/AngryIcon';
import { SadIcon } from '../icons/SadIcon';
import { NeutralIcon } from '../icons/NeutralIcon';
import { HappyIcon } from '../icons/HappyIcon';
import { GrinningIcon } from '../icons/GrinningIcon';
import { SpinnerIcon } from '../icons/SpinnerIcon';
import { ChatHistoryModal } from '../ChatHistoryModal';
import { ChatMessage } from '../../types';

type Mood = 1 | 2 | 3 | 4 | 5;
type ToastState = { message: string; type: 'success' | 'error' } | null;
type ActiveTab = 'moods' | 'chats';

interface JournalPageProps {
    account: string;
}

interface MoodEntry {
    mood: Mood;
    notes: string;
    date: string;
}

interface SavedChat {
    cid: string;
    timestamp: number;
    preview: string;
    companionName: string;
}

const moodOptions: { mood: Mood; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { mood: 1, label: 'Angry', Icon: AngryIcon },
    { mood: 2, label: 'Sad', Icon: SadIcon },
    { mood: 3, label: 'Neutral', Icon: NeutralIcon },
    { mood: 4, label: 'Happy', Icon: HappyIcon },
    { mood: 5, label: 'Great', Icon: GrinningIcon },
];

const MoodChart: React.FC<{moodHistory: MoodEntry[]}> = ({ moodHistory }) => {
    const last7Entries = moodHistory.slice(-7);
    const data = last7Entries.map(entry => entry.mood);
    const labels = last7Entries.map(entry => new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' }));
    
    // Fill with empty data if less than 7 days
    while (data.length < 7) {
        data.unshift(3); // Pad with 'Neutral'
        labels.unshift('');
    }

    const width = 300;
    const height = 100;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * chartWidth + padding;
        const y = height - ((d - 1) / 4) * chartHeight - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-brand-dark-bg-secondary p-6 rounded-xl border border-white/10">
            <div className="mb-4">
                <p className="text-brand-dark-subtext text-sm">Your Mood Trend</p>
                <p className="text-3xl font-bold text-brand-dark-text">Last 7 Days</p>
            </div>
            {last7Entries.length > 1 ? (
                <div className="relative">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                        <defs>
                            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polygon
                            points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`}
                            fill="url(#moodGradient)"
                        />
                        <polyline
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            points={points}
                        />
                    </svg>
                    <div className="flex justify-between mt-2 px-1 text-xs text-brand-dark-subtext">
                        {labels.map((label, i) => <span key={i}>{label}</span>)}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-brand-dark-subtext">
                    <p>Log your mood for a few more days to see your trend here.</p>
                </div>
            )}
        </div>
    );
};

export const JournalPage: React.FC<JournalPageProps> = ({ account }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('moods');
    
    // Moods state
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [notes, setNotes] = useState('');
    const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

    // Chats state
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
    const [selectedChatMessages, setSelectedChatMessages] = useState<ChatMessage[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    const [toast, setToast] = useState<ToastState>(null);

    // Load data on mount and when account changes
    useEffect(() => {
        // Load mood history
        const moodKey = `solace_mood_history_${account}`;
        const moodData = JSON.parse(localStorage.getItem(moodKey) || '[]');
        setMoodHistory(moodData);

        // Load saved chats
        const chatKey = `solace_saved_chats_${account}`;
        const chatData = JSON.parse(localStorage.getItem(chatKey) || '[]');
        setSavedChats(chatData);
    }, [account]);

    const handleSaveMood = () => {
        if (!selectedMood) {
            setToast({ message: 'Please select a mood first.', type: 'error' });
            return;
        }

        const newEntry: MoodEntry = {
            mood: selectedMood,
            notes,
            date: new Date().toISOString(),
        };

        const updatedHistory = [...moodHistory, newEntry];
        setMoodHistory(updatedHistory);
        localStorage.setItem(`solace_mood_history_${account}`, JSON.stringify(updatedHistory));

        setToast({ message: 'Mood saved successfully!', type: 'success' });
        setSelectedMood(null);
        setNotes('');
    };

    const handleViewChat = async (cid: string) => {
        setIsLoadingChat(true);
        try {
            const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);
            if (!response.ok) throw new Error("Failed to fetch chat data.");
            const data = await response.json();
            if (data && Array.isArray(data.messages)) {
                setSelectedChatMessages(data.messages);
                setIsModalOpen(true);
            } else {
                throw new Error("Invalid chat data format.");
            }
        } catch (error) {
            console.error("Error fetching chat:", error);
            setToast({ message: "Could not load the saved chat.", type: "error" });
        } finally {
            setIsLoadingChat(false);
        }
    };

    const TabButton: React.FC<{tab: ActiveTab, label: string}> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                activeTab === tab 
                ? 'bg-brand-dark-primary text-white' 
                : 'text-brand-dark-subtext hover:bg-brand-dark-bg-secondary'
            }`}
        >
            {label}
        </button>
    );

    return (
        <>
            <div className="p-4 sm:p-8 animate-fade-in-up flex-1">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text">Your Journal</h1>
                    <p className="text-brand-dark-subtext mt-1">A private space for your thoughts and feelings.</p>
                </header>

                <div className="mb-8 flex justify-center space-x-4">
                    <TabButton tab="moods" label="Moods" />
                    <TabButton tab="chats" label="Saved Chats" />
                </div>

                {activeTab === 'moods' && (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <section className="p-6 bg-brand-dark-bg-secondary rounded-xl border border-white/10">
                            <h2 className="text-xl font-bold mb-4">How are you feeling today?</h2>
                            <div className="flex justify-around mb-6">
                                {moodOptions.map(({ mood, Icon }) => (
                                    <button
                                        key={mood}
                                        onClick={() => setSelectedMood(mood)}
                                        className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${selectedMood === mood ? 'text-brand-dark-primary scale-110' : 'text-brand-dark-subtext'}`}
                                    >
                                        <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about your day..."
                                className="w-full h-28 bg-brand-dark-bg p-4 rounded-lg border border-white/10 focus:ring-2 focus:ring-brand-dark-primary focus:outline-none mb-4"
                            />
                            <button
                                onClick={handleSaveMood}
                                className="w-full bg-brand-dark-primary text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-brand-dark-secondary transition-colors duration-300"
                            >
                                Save Mood
                            </button>
                        </section>
                        <section>
                            <MoodChart moodHistory={moodHistory} />
                        </section>
                    </div>
                )}

                {activeTab === 'chats' && (
                    <div className="max-w-3xl mx-auto">
                        {savedChats.length > 0 ? (
                            <div className="space-y-4">
                                {savedChats.map((chat) => (
                                    <button
                                        key={chat.cid}
                                        onClick={() => handleViewChat(chat.cid)}
                                        className="w-full text-left p-4 bg-brand-dark-bg-secondary rounded-lg border border-white/10 hover:border-brand-dark-primary/50 transition-colors"
                                    >
                                        <p className="text-sm text-brand-dark-subtext">
                                            {new Date(chat.timestamp).toLocaleString()} with {chat.companionName}
                                        </p>
                                        <p className="text-brand-dark-text font-medium truncate">{chat.preview}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-brand-dark-bg-secondary rounded-lg border border-white/10">
                                <h3 className="text-xl font-bold text-brand-dark-text">No Saved Chats Yet</h3>
                                <p className="text-brand-dark-subtext mt-2">
                                    After a conversation, you can save it here to review later.
                                </p>
                            </div>
                        )}
                        {isLoadingChat && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <SpinnerIcon className="w-12 h-12 text-brand-dark-primary" />
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isModalOpen && selectedChatMessages && (
                <ChatHistoryModal 
                    messages={selectedChatMessages} 
                    onClose={() => setIsModalOpen(false)}
                />
            )}
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
