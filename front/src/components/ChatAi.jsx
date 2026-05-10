import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Copy, Check } from 'lucide-react';

// Simple markdown-like formatting for code blocks and formatting
const formatMessage = (content) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, idx) => {
        if (part.startsWith('```')) {
            // Extract language and code
            const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
            const language = match?.[1] || 'code';
            const code = match?.[2] || part;
            
            return (
                <div key={idx} className="my-3 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                    <div className="flex justify-between items-center bg-slate-800 px-4 py-2">
                        <span className="text-xs font-mono text-slate-400">{language}</span>
                        <CopyButton text={code} />
                    </div>
                    <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-slate-100 font-mono">{code.trim()}</code>
                    </pre>
                </div>
            );
        }
        
        // Format bold, italic, and links
        return (
            <div key={idx} className="whitespace-pre-wrap break-words">
                {part.split('\n').map((line, lineIdx) => {
                    // Bold text
                    let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    // Italic text
                    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    // Links
                    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>');
                    
                    return (
                        <div key={lineIdx} dangerouslySetInnerHTML={{ __html: formatted }} />
                    );
                })}
            </div>
        );
    });
};

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            title="Copy code"
        >
            {copied ? (
                <Check size={16} className="text-green-400" />
            ) : (
                <Copy size={16} className="text-slate-400 hover:text-slate-200" />
            )}
        </button>
    );
};

function ChatAi({problem, chatHistory, setChatHistory}) {
    const { register, handleSubmit, reset, formState: {errors} } = useForm();
    const messagesEndRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const onSubmit = async (data) => {
        
        setChatHistory(prev => [...prev, { role: 'user', content: data.message }]);
        reset();
        setLoading(true);

        const formattedMessages = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
        
        formattedMessages.push({
            role: 'user',
            parts: [{ text: data.message }]
        });

        try {
            const response = await axiosClient.post("/Ai/Chat", {
                messages: formattedMessages,
                title: problem?.title || '',
                description: problem?.description || '',
                testCases: problem?.visibleTestCases || [],
                startCode: problem?.startCode || []
            });

            setChatHistory(prev => [...prev, { 
                role: 'model', 
                content: response.data.message || response.data.content || "I couldn't generate a response. Please try again."
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setChatHistory(prev => [...prev, { 
                role: 'model', 
                content: `⚠️ Error: ${error.response?.data?.message || error.message || "Failed to get response. Please try again."}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px] bg-gradient-to-b from-slate-950 to-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-slate-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    DSA Tutor Assistant
                </h3>
                <p className="text-sm text-slate-400 mt-1">Get hints, code reviews, and explanations</p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {chatHistory.length === 1 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-5xl mb-4">💡</div>
                            <p className="text-slate-400 text-lg">Ask me anything about this problem!</p>
                            <p className="text-slate-500 text-sm mt-2">I can help with hints, code review, or explain solutions</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {chatHistory.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                            >
                                <div className={`flex gap-3 max-w-2xl ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        msg.role === "user" 
                                            ? "bg-blue-600 text-white" 
                                            : "bg-purple-600 text-white"
                                    }`}>
                                        {msg.role === "user" ? "👤" : "🤖"}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`rounded-lg px-4 py-3 ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none"
                                    }`}>
                                        <div className="text-sm leading-relaxed">
                                            {msg.role === "user" ? (
                                                <p>{msg.content}</p>
                                            ) : (
                                                formatMessage(msg.content)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start animate-fadeIn">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-600 text-white text-sm font-bold">
                                        🤖
                                    </div>
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg rounded-bl-none px-4 py-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 bg-slate-900/50 backdrop-blur p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <textarea
                                placeholder="Ask me anything about this problem..." 
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                                rows="2"
                                {...register("message", { required: true, minLength: 2 })}
                                disabled={loading}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg p-3 transition-all duration-200 transform hover:scale-105 active:scale-95"
                            disabled={errors.message || loading}
                            title="Send message"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                    {errors.message && (
                        <p className="text-red-400 text-xs ml-1">Message must be at least 2 characters</p>
                    )}
                </form>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(100, 116, 139, 0.5);
                    border-radius: 3px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(100, 116, 139, 0.8);
                }
            `}</style>
        </div>
    );
}

export default ChatAi;
