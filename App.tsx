import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import Button from './components/Button';
import { generateLesson, playTextToSpeech, sendChatMessage } from './services/gemini';
import { LessonContent, ViewState, ChatMessage } from './types';

const TOPICS = [
  { id: 'animals', icon: '🐶', label: 'Animals (动物)' },
  { id: 'colors', icon: '🌈', label: 'Colors (颜色)' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'Family (家庭)' },
  { id: 'food', icon: '🍕', label: 'Food (食物)' },
  { id: 'school', icon: '🏫', label: 'School (学校)' },
  { id: 'greetings', icon: '👋', label: 'Greetings (问候)' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [loading, setLoading] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am Star Teacher. How can I help you learn English today? 你好！我是星星老师。今天想学点什么？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === ViewState.CHAT) {
      scrollToBottom();
    }
  }, [chatHistory, view]);

  const handleTopicSelect = useCallback(async (topicLabel: string) => {
    setLoading(true);
    try {
      const lesson = await generateLesson(topicLabel);
      setCurrentLesson(lesson);
      setView(ViewState.LESSON);
    } catch (e) {
      console.error(e);
      alert("Failed to load lesson. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: inputMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Convert internal chat history to Gemini API format
      const apiHistory = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const responseText = await sendChatMessage(apiHistory, userMsg.text);
      setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', text: "Oops! I had trouble connecting. Please say that again." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="text-center py-10 bg-white rounded-3xl shadow-xl border-b-4 border-primary/10">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Welcome to Little Star English! 🌟</h2>
        <p className="text-gray-600 text-lg mb-8">Choose a topic to start learning or chat with your AI teacher.</p>
        
        <div className="flex justify-center gap-4">
             <Button onClick={() => setView(ViewState.CHAT)} size="lg" variant="secondary" className="shadow-amber-200">
               💬 Chat with Teacher
             </Button>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-700 pl-2 border-l-4 border-accent">Pick a Topic</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicSelect(topic.label)}
            disabled={loading}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-transparent hover:border-primary flex flex-col items-center gap-3 group"
          >
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{topic.icon}</span>
            <span className="font-bold text-gray-700 text-lg">{topic.label}</span>
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white p-8 rounded-2xl flex flex-col items-center shadow-2xl">
              <div className="animate-spin text-5xl mb-4">⭐</div>
              <p className="text-xl font-bold text-primary">Creating your lesson...</p>
           </div>
        </div>
      )}
    </div>
  );

  const renderLesson = () => {
    if (!currentLesson) return null;

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-secondary p-6 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-9xl opacity-20">📚</div>
            <h2 className="text-3xl font-bold relative z-10">{currentLesson.title}</h2>
            <p className="mt-2 opacity-90 text-lg relative z-10">{currentLesson.introduction}</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Vocabulary Section */}
            <section>
              <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                <span className="bg-indigo-100 p-2 rounded-lg">📝</span> New Words
              </h3>
              <div className="grid gap-4">
                {currentLesson.vocabulary?.length > 0 ? (
                  currentLesson.vocabulary.map((vocab, idx) => (
                    <div key={idx} className="bg-blue-50 p-4 rounded-xl flex justify-between items-center hover:bg-blue-100 transition-colors">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-indigo-900">{vocab.word}</span>
                          <span className="text-gray-500 text-sm">{vocab.translation}</span>
                        </div>
                        <p className="text-indigo-700 mt-1 italic">"{vocab.example}"</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => playTextToSpeech(vocab.word)} aria-label="Play pronunciation">
                        🔊
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No vocabulary words for this lesson.</p>
                )}
              </div>
            </section>

            {/* Story Section */}
            <section className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                  📖 Story Time
                </h3>
                <Button onClick={() => playTextToSpeech(currentLesson.story)} variant="secondary" size="sm">
                   🔊 Read Story
                </Button>
              </div>
              <p className="text-lg leading-relaxed text-gray-800 font-medium">
                {currentLesson.story}
              </p>
            </section>

            {/* Quiz Section */}
            <section>
              <h3 className="text-2xl font-bold text-secondary mb-4 flex items-center gap-2">
                ❓ Quick Quiz
              </h3>
              <div className="space-y-6">
                {currentLesson.quiz?.length > 0 ? (
                  currentLesson.quiz.map((q, idx) => (
                    <div key={idx} className="bg-orange-50 p-5 rounded-xl">
                      <p className="font-bold text-lg mb-3 text-gray-800">{idx + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options?.map((opt, oIdx) => (
                          <button 
                            key={oIdx}
                            onClick={(e) => {
                               const btn = e.currentTarget;
                               const isCorrect = opt === q.answer;
                               btn.classList.remove('bg-white', 'hover:bg-gray-50');
                               if(isCorrect) {
                                 btn.classList.add('bg-green-500', 'text-white', 'border-green-500');
                                 playTextToSpeech("Great job!");
                               } else {
                                 btn.classList.add('bg-red-400', 'text-white', 'border-red-400');
                                 playTextToSpeech("Try again");
                               }
                            }}
                            className="w-full text-left p-3 rounded-lg border-2 border-orange-200 bg-white hover:bg-orange-100 transition-all font-medium text-gray-700"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No quiz available for this lesson.</p>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="text-center">
           <Button onClick={() => setView(ViewState.HOME)} variant="outline" size="lg">Back to Home</Button>
        </div>
      </div>
    );
  };

  const renderChat = () => (
    <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 rounded-2xl bg-white shadow-inner border border-gray-100">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex max-w-[80%] items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                  {msg.role === 'user' ? '🧑‍🎓' : '👩‍🏫'}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.text}
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => playTextToSpeech(msg.text)}
                      className="ml-2 text-xs opacity-70 hover:opacity-100 bg-black/10 hover:bg-black/20 rounded-full px-2 py-1 transition-all"
                    >
                      🔊
                    </button>
                  )}
                </div>
             </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-gray-500 text-sm animate-pulse">
               Teacher is typing... ✍️
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 bg-white p-2 rounded-full shadow-lg border border-gray-100">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message in English..."
          className="flex-1 px-6 py-3 rounded-full focus:outline-none focus:bg-gray-50 text-lg"
          disabled={loading}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!inputMessage.trim() || loading} 
          className="aspect-square !p-0 w-12 h-12 rounded-full flex items-center justify-center"
        >
          🚀
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 font-sans">
      <Header onHome={() => setView(ViewState.HOME)} />
      <main className="flex-1 w-full">
        {view === ViewState.HOME && renderHome()}
        {view === ViewState.LESSON && renderLesson()}
        {view === ViewState.CHAT && renderChat()}
      </main>
    </div>
  );
};

export default App;
