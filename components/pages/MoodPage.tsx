
import React, { useState, useEffect } from 'react';
import { Toast } from '../Toast';
import { AngryIcon } from '../icons/AngryIcon';
import { SadIcon } from '../icons/SadIcon';
import { NeutralIcon } from '../icons/NeutralIcon';
import { HappyIcon } from '../icons/HappyIcon';
import { GrinningIcon } from '../icons/GrinningIcon';

type Mood = 1 | 2 | 3 | 4 | 5;
type ToastState = { message: string; type: 'success' | 'error' } | null;

// FIX: Storing component types instead of instances to avoid React.cloneElement issues with TypeScript.
const moodOptions: { mood: Mood; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { mood: 1, label: 'Angry', Icon: AngryIcon },
    { mood: 2, label: 'Sad', Icon: SadIcon },
    { mood: 3, label: 'Neutral', Icon: NeutralIcon },
    { mood: 4, label: 'Happy', Icon: HappyIcon },
    { mood: 5, label: 'Great', Icon: GrinningIcon },
];

const MoodChart: React.FC = () => {
    // Static data to render a representative chart
    const data = [3, 4, 2, 5, 1, 4, 3];
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

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="bg-brand-dark-bg-secondary p-6 rounded-xl border border-white/10">
            <div className="mb-4">
                <p className="text-brand-dark-subtext text-sm">Mood Trend</p>
                <p className="text-3xl font-bold text-brand-dark-text">Feeling Good</p>
                <p className="text-sm text-brand-accent">Last 7 Days +10%</p>
            </div>
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Gradient Area */}
                    <polygon
                        points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`}
                        fill="url(#moodGradient)"
                    />
                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        points={points}
                    />
                </svg>
                <div className="flex justify-between mt-2 px-1 text-xs text-brand-dark-subtext">
                    {labels.map(label => <span key={label}>{label}</span>)}
                </div>
            </div>
        </div>
    );
};

export const MoodPage: React.FC = () => {
    const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
    const [notes, setNotes] = useState('');
    const [toast, setToast] = useState<ToastState>(null);

    const handleSaveMood = () => {
        if (!selectedMood) {
            setToast({ message: 'Please select a mood first.', type: 'error' });
            return;
        }

        const account = localStorage.getItem('last_connected_account');
        if (!account) {
            setToast({ message: 'Error: No user account found.', type: 'error' });
            return;
        }

        const newEntry = {
            mood: selectedMood,
            notes,
            date: new Date().toISOString(),
        };

        const key = `solace_mood_history_${account}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        history.push(newEntry);
        localStorage.setItem(key, JSON.stringify(history));

        setToast({ message: 'Mood saved successfully!', type: 'success' });
        setSelectedMood(null);
        setNotes('');
    };

    return (
        <div className="p-4 sm:p-8 animate-fade-in-up flex-1">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-dark-text">How are you feeling today?</h1>
            </header>

            <section className="mb-8 p-6 bg-brand-dark-bg-secondary rounded-xl border border-white/10">
                <div className="flex justify-around mb-6">
                    {moodOptions.map(({ mood, Icon }) => (
                        <button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 ${selectedMood === mood ? 'text-brand-dark-primary scale-110' : 'text-brand-dark-subtext'}`}
                        >
                            {/* FIX: Render the icon component directly instead of using React.cloneElement to resolve the TypeScript error. */}
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
                <h2 className="text-2xl font-bold text-brand-dark-text mb-4">Past Moods</h2>
                <MoodChart />
            </section>
            
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};