import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, MessageCircle, User, MapPin, Heart, Gift, 
  Bell, Settings, Camera, Shield, Star, Filter, 
  Send, Smile, MoreVertical, X, Check, Award, 
  Zap, Navigation, Phone, Video, CreditCard,
  LogOut, Trash2, Edit3, Plus, Volume2, Languages,
  ChevronRight, Info, AlertCircle, Eye, Lock, Unlock,
  Share2, Bookmark, Flag, Ban, Crown, Sparkles
} from 'lucide-react';
import AvatarDisplay from './components/AvatarDisplay';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  points: number;
  likes: number;
  is_verified: boolean;
  is_vip: boolean;
  role: 'user' | 'admin';
  gender?: string;
  age?: number;
  language?: string;
  notifications_enabled?: boolean;
}

interface WeatherData {
  temp: number;
  condition: string;
  city: string;
}

interface NewsItem {
  title: string;
  category: string;
}

// --- Simulation Data ---
const MOCK_USERS: UserProfile[] = [
  { id: "1", name: "Aisha Rashid", email: "aisha@example.com", bio: "Napenda muziki na kusafiri ✈️. Always looking for the next adventure!", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha", points: 1000, likes: 142, is_verified: true, is_vip: true, role: 'user' },
  { id: "2", name: "Kelvin John", email: "kelvin@example.com", bio: "Software Developer & Photographer. Let's capture some moments.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kelvin", points: 500, likes: 89, is_verified: false, is_vip: false, role: 'user' },
  { id: "3", name: "Neema Masawe", email: "neema@example.com", bio: "Mwanafunzi wa Chuo - UDSM. Art and books are my life.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neema", points: 2000, likes: 210, is_verified: true, is_vip: false, role: 'user' },
];

const GIFTS = [
  { id: 1, name: "Ua la Waridi", price: 50, icon: "🌹" },
  { id: 2, name: "Almasi", price: 500, icon: "💎" },
  { id: 3, name: "Keki", price: 100, icon: "🎂" },
  { id: 4, name: "Gari ya Kifahari", price: 2000, icon: "🏎️" },
];

const NEWS = [
  { id: 1, title: "Tamasha la Muziki Dar", content: "Jiunge nasi Jumamosi hii kwenye viwanja vya Posta kwa burudani ya kukata na shoka!", date: "Leo", type: "Event" },
  { id: 2, title: "Maboresho ya Gundua", content: "Tumeongeza mfumo mpya wa AI kukusaidia kutafsiri ujumbe papo hapo.", date: "Jana", type: "Update" },
];

export default function App() {
  // --- State ---
  const [view, setView] = useState<'auth' | 'app' | 'admin'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCalling, setIsCalling] = useState<null | 'voice' | 'video'>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [quote, setQuote] = useState<string>("");
  const [notifications, setNotifications] = useState(3);
  const [likedUsers, setLikedUsers] = useState<string[]>([]);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [aiLang, setAiLang] = useState<'sw' | 'en'>('sw');
  const [translations, setTranslations] = useState<{sw: string, en: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editAge, setEditAge] = useState(18);

  const [filterGender, setFilterGender] = useState('Wote');
  const [filterAge, setFilterAge] = useState(18);

  // --- Effects ---
  useEffect(() => {
    if (view !== 'auth') {
      fetchUsers();
      fetchExternalData();
    }
  }, [view]);

  useEffect(() => {
    let interval: any;
    if (showChat && currentUser && selectedUser) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [showChat, selectedUser]);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchExternalData = async () => {
    try {
      const [wRes, nRes, qRes] = await Promise.all([
        fetch('/api/external/weather'),
        fetch('/api/external/news'),
        fetch('/api/external/quote')
      ]);
      setWeather(await wRes.json());
      setNews(await nRes.json());
      const qData = await qRes.json();
      setQuote(qData.advice);
      setTranslations(null);
      setAiResponse("");
    } catch (e) {
      console.error("Failed to fetch external data", e);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    const res = await fetch(`/api/messages/${currentUser.id}/${selectedUser.id}`);
    const data = await res.json();
    setMessages(data);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search query filter
      const name = user.name || "";
      const bio = user.bio || "";
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.toLowerCase().includes(query) || bio.toLowerCase().includes(query);
      
      // Gender filter
      const matchesGender = filterGender === 'Wote' || user.gender === (filterGender === 'Wanaume' ? 'Mwanaume' : 'Mwanamke');
      
      // Age filter
      const matchesAge = !user.age || user.age >= filterAge;

      return matchesSearch && matchesGender && matchesAge;
    }).filter(u => u.id !== currentUser?.id);
  }, [searchQuery, users, currentUser, filterGender, filterAge]);

  const toggleLike = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const res = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likerId: currentUser.id, likedId: userId })
      });
      if (res.ok) {
        setLikedUsers(prev => [...prev, userId]);
        fetchUsers(); // Refresh to see new like count
      }
    } catch (e) {
      alert("Tayari umependa wasifu huu!");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const name = (e.target as any).name?.value || email.split('@')[0];
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const user = await res.json();
    setCurrentUser(user);
    setView(user.role === 'admin' ? 'admin' : 'app');
  };

  const handleSendGift = async (gift: any) => {
    if (!currentUser || !selectedUser) return;
    const res = await fetch('/api/social/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        giftType: gift.name,
        cost: gift.price
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      setCurrentUser({ ...currentUser, points: data.newPoints });
      setShowGiftModal(false);
      alert(`Zawadi ya ${gift.name} imetumwa kwa mafanikio!`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const sendMessage = async () => {
    if (!inputMsg || !currentUser || !selectedUser) return;
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: inputMsg
      })
    });
    if (res.ok) {
      setInputMsg("");
      fetchMessages();
    }
  };

  const sendSalamu = async (user: UserProfile, type: string) => {
    const greeting = type === 'mambo' ? '👋 Mambo!' : type === 'habari' ? '✨ Habari?' : '🔥 Vipi!';
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUser?.id,
        receiverId: user.id,
        content: greeting
      })
    });
    if (res.ok) {
      alert(`Salamu ya "${greeting}" imetumwa!`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('auth');
    setActiveTab('discover');
  };

  const translateText = async (text: string) => {
    if (!text) return;
    setIsAiProcessing(true);
    setAiResponse("");
    try {
      // Using MyMemory API as a free alternative
      const resSw = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|sw`);
      const dataSw = await resSw.json();
      
      if (dataSw.responseData.translatedText) {
        setTranslations({ 
          sw: dataSw.responseData.translatedText, 
          en: text // Use original text for English
        });
        setAiResponse("");
      } else {
        setAiResponse("Imeshindwa kutafsiri kwa sasa.");
      }
    } catch (error) {
      console.error(error);
      setAiResponse("Kosa la kiufundi limetokea wakati wa kutafsiri.");
    } finally {
      setIsAiProcessing(false);
    }
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Faili ni kubwa mno! Tafadhali chagua faili iliyo chini ya 50MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      if (!currentUser) return;

      try {
        const res = await fetch('/api/users/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: currentUser.id, 
            name: currentUser.name, 
            bio: currentUser.bio, 
            avatar: base64String 
          })
        });
        
        if (res.ok) {
          const updated = await res.json();
          setCurrentUser(updated);
          fetchUsers(); // Refresh users list to update avatar everywhere
          alert("Faili imepakiwa kwa mafanikio!");
        }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Imeshindwa kupakia faili.");
      }
    };
    reader.readAsDataURL(file);
  };

  const openEditProfile = () => {
    if (currentUser) {
      setEditName(currentUser.name || "");
      setEditBio(currentUser.bio || "");
      setEditGender(currentUser.gender || "Mwanaume");
      setEditAge(currentUser.age || 18);
      setShowEditProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: currentUser.id, 
          name: editName, 
          bio: editBio, 
          gender: editGender,
          age: editAge,
          avatar: currentUser.avatar 
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        fetchUsers(); // Refresh users list
        alert("Wasifu umehifadhiwa!");
        setShowEditProfile(false);
      }
    } catch (error) {
      alert("Imeshindwa kuhifadhi wasifu.");
    }
  };

  const handleInvite = async () => {
    if (!currentUser) return;
    
    const inviteLink = `${window.location.origin}?ref=${currentUser.id}`;
    const shareData = {
      title: 'Jiunge na Gundua!',
      text: `Njoo tuchat na kugundua marafiki wapya kwenye Gundua! Tumia link hii:`,
      url: inviteLink
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(inviteLink);
        alert("Link imenakiliwa! Sambaza kwa marafiki.");
      }

      // Award bonus points
      const res = await fetch('/api/social/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser({ ...currentUser, points: data.newPoints });
        alert("Hongera! Umepata token 50 kwa kualika rafiki! 🎉");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const renderDiscover = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6 pb-24"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-600">Gundua</h1>
          <p className="text-sm text-gray-500 font-medium">Watu {filteredUsers.length} karibu nawe leo</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleInvite}
            className="p-2.5 bg-indigo-600 shadow-lg shadow-indigo-200 border border-transparent rounded-full text-white hover:bg-indigo-700 transition-colors active:scale-95"
            title="Alika Marafiki"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={() => setShowFilter(true)}
            className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
          </button>
          <button 
            onClick={() => {
              setNotifications(0);
              alert("Arifa zako zimesomwa.");
            }}
            className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-full text-gray-600 relative hover:bg-gray-50 transition-colors"
          >
            <Bell size={20} />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                {notifications}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Search Bar */}
      {isSearching && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <input 
            autoFocus
            type="text"
            placeholder="Tafuta marafiki au mapendeleo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 p-4 pr-12 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
          />
          <button 
            onClick={() => {setIsSearching(false); setSearchQuery("");}}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </motion.div>
      )}

      {/* Stories Section */}
      <section className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex-shrink-0 flex flex-col items-center space-y-1.5">
          <button 
            onClick={() => alert("Hapa unaweza kuongeza Story yako!")}
            className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-white hover:border-indigo-400 transition-colors"
          >
            <Camera size={24} className="text-gray-400" />
          </button>
          <span className="text-[11px] font-semibold text-gray-500">Story Yako</span>
        </div>
        {users.slice(0, 6).map(user => (
          <div key={user.id} className="flex-shrink-0 flex flex-col items-center space-y-1.5">
            <div className="w-16 h-16 border-2 border-pink-500 p-0.5 rounded-full">
              <div className="w-full h-full bg-indigo-50 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                <AvatarDisplay src={user.avatar} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 truncate w-16 text-center">{(user.name || "").split(' ')[0]}</span>
          </div>
        ))}
      </section>

      {/* User Cards Grid */}
      <section className="grid grid-cols-1 gap-5">
        {filteredUsers.length > 0 ? filteredUsers.map(user => (
          <motion.div 
            key={user.id} 
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedUser(user)}
            className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex p-4 items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner overflow-hidden">
                  <AvatarDisplay src={user.avatar} className="w-full h-full object-cover" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500`}></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg text-gray-900">{user.name || "Mtumiaji"}</h3>
                  {user.is_vip && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="flex items-center text-gray-500 text-sm mt-0.5">
                  <MapPin size={14} className="mr-1 text-indigo-400" /> Karibu nawe
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg">
                    {user.bio ? user.bio.split(' ')[0] : "Salamu"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-20">
                <button 
                  onClick={(e) => toggleLike(e, user.id)}
                  className={`p-2.5 rounded-2xl transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white`}
                >
                  <Heart size={20} />
                </button>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.likes} Likes</div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900">Hakuna matokeo</h3>
            <p className="text-gray-500">Jaribu kutafuta kitu kingine.</p>
          </div>
        )}
      </section>
    </motion.div>
  );

  const renderProfileModal = () => (
    <AnimatePresence>
      {selectedUser && !showChat && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md rounded-t-[3rem] p-8 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
            
            <div className="flex justify-between items-start mb-4">
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-gray-100 rounded-full text-gray-500"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <button 
                onClick={() => alert("Wasifu huu umeripotiwa.")}
                className="p-2 bg-gray-100 rounded-full text-gray-500"
              >
                <Flag size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-6">
                <div className="text-8xl bg-indigo-50 w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-sm">
                  <AvatarDisplay src={selectedUser.avatar} className="w-full h-full rounded-[2.5rem]" />
                </div>
                {selectedUser.is_vip && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-2xl shadow-lg border-4 border-white">
                    <Award size={24} className="text-white" />
                  </div>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {selectedUser.name || "Mtumiaji"}
              </h2>
              <p className="text-gray-500 font-medium flex items-center">
                <MapPin size={16} className="mr-1.5 text-indigo-500" /> Karibu nawe
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl mb-8">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                <User size={18} className="mr-2 text-indigo-500" /> Bio
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                {selectedUser.bio || "Huyu mtumiaji bado hajaweka bio."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setShowChat(true)}
                className="bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
              >
                <MessageCircle size={20} />
                <span>Anza Soga</span>
              </button>
              <button 
                onClick={() => setShowGiftModal(true)}
                className="bg-pink-50 text-pink-600 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                <Gift size={20} />
                <span>Tuma Zawadi</span>
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 px-1">Salamu za Haraka</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['mambo', 'habari', 'vipi'].map(type => (
                  <button 
                    key={type}
                    onClick={() => sendSalamu(selectedUser, type)} 
                    className="whitespace-nowrap bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 px-5 py-2.5 rounded-2xl text-sm font-bold text-gray-700 transition-all"
                  >
                    {type === 'mambo' ? '👋 Mambo!' : type === 'habari' ? '✨ Habari?' : '🔥 Vipi!'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderChat = () => (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 bg-white z-[60] flex flex-col"
    >
      <header className="p-4 border-b flex items-center space-x-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => setShowChat(false)} className="p-2.5 bg-indigo-50 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="w-11 h-11 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl overflow-hidden">
          <AvatarDisplay src={selectedUser?.avatar} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{selectedUser?.name}</h3>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Online Sasa</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsCalling('voice')}
            className="p-2.5 text-indigo-600 bg-indigo-50 rounded-full active:scale-90 transition-transform"
          >
            <Phone size={20} />
          </button>
          <button 
            onClick={() => setIsCalling('video')}
            className="p-2.5 text-indigo-600 bg-indigo-50 rounded-full active:scale-90 transition-transform"
          >
            <Video size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/50">
        <div className="flex justify-center my-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-white px-4 py-1.5 rounded-full border border-gray-100">
            MNAANZA MAZUNGUMZO LEO
          </span>
        </div>
        {messages.map(m => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            key={m.id} 
            className={`flex ${m.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] p-4 rounded-3xl text-sm font-medium ${m.sender_id === currentUser?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'}`}>
              {m.content}
              <div className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider ${m.sender_id === currentUser?.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-white border-t flex items-center space-x-3">
        <div className="relative">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <Smile size={24} />
          </button>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-12 left-0 bg-white shadow-2xl border border-gray-100 p-4 rounded-3xl grid grid-cols-4 gap-2 z-20 w-48"
            >
              {['❤️', '🔥', '🙌', '✨', '😂', '😍', '👋', '💯'].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => {
                    setInputMsg(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>
        <input 
          type="text" 
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Andika ujumbe..." 
          className="flex-1 bg-gray-100 p-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
        />
        <button 
          disabled={!inputMsg}
          onClick={sendMessage}
          className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 transition-all"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Calling Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-900/95 z-[70] flex flex-col items-center justify-center text-white"
          >
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-6xl mb-8 animate-pulse">
              {selectedUser?.avatar}
            </div>
            <h2 className="text-3xl font-bold mb-2">{selectedUser?.name}</h2>
            <p className="text-indigo-200 font-medium mb-12">Inapiga {isCalling === 'voice' ? 'simu ya sauti' : 'simu ya video'}...</p>
            
            <div className="flex space-x-8">
              <button 
                onClick={() => setIsCalling(null)}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 active:scale-90 transition-transform"
              >
                <X size={32} />
              </button>
              <button className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 animate-bounce">
                {isCalling === 'voice' ? <Phone size={32} /> : <Video size={32} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderGiftModal = () => (
    <AnimatePresence>
      {showGiftModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-6"
          onClick={() => setShowGiftModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-40"></div>
            <div className="relative">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-2xl text-gray-900">Tuma Zawadi</h3>
                <button onClick={() => setShowGiftModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-2xl mb-8 flex items-center justify-between border border-indigo-100">
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Salio Lako</span>
                <span className="font-bold flex items-center text-indigo-800 text-lg">
                  <Zap size={18} className="mr-1.5 fill-indigo-600 text-indigo-600" /> {currentUser?.points} Pts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {GIFTS.map(gift => (
                  <motion.div 
                    key={gift.id} 
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSendGift(gift)}
                    className="bg-gray-50 hover:bg-white hover:border-pink-300 border-2 border-transparent p-5 rounded-3xl text-center cursor-pointer transition-all shadow-sm"
                  >
                    <div className="text-5xl mb-3">{gift.icon}</div>
                    <div className="font-bold text-sm text-gray-800 mb-1">{gift.name}</div>
                    <div className="text-xs font-bold text-indigo-500 flex items-center justify-center">
                      <Zap size={12} className="mr-1 fill-indigo-500" /> {gift.price}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <button 
                onClick={async () => {
                  const res = await fetch('/api/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentUser?.id, points: (currentUser?.points || 0) + 1000 })
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setCurrentUser(updated);
                    alert("Pointi 1000 zimeongezwa!");
                  }
                }}
                className="w-full mt-8 py-4 text-indigo-600 font-bold border-2 border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-colors"
              >
                Ongeza Pointi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderAuth = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-pink-500"
    >
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-indigo-200">
            <Sparkles size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Gundua</h1>
          <p className="text-gray-500 font-medium">{authMode === 'login' ? 'Karibu tena!' : 'Anza safari yako leo'}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Barua Pepe</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="admin@gundua.com"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Nenosiri</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white p-4 rounded-2xl outline-none transition-all font-medium"
            />
          </div>
          
          <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-indigo-200 active:scale-95 transition-all">
            {authMode === 'login' ? 'Ingia Sasa' : 'Jisajili'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {authMode === 'login' ? 'Huna akaunti? Jisajili' : 'Tayari una akaunti? Ingia'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderAdmin = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 space-y-8"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 font-medium">Dhibiti mfumo na watumiaji</p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-red-50 text-red-600 rounded-2xl">
          <LogOut size={20} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {weather && (
          <div className="col-span-2 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Hali ya Hewa - {weather.city}</p>
              <h2 className="text-3xl font-black">{weather.temp}°C</h2>
              <p className="font-medium">{weather.condition}</p>
            </div>
            <div className="text-5xl">☀️</div>
          </div>
        )}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Watumiaji</p>
          <h2 className="text-3xl font-black text-indigo-600">{users.length}</h2>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mapato</p>
          <h2 className="text-3xl font-black text-green-600">TSh 1.2M</h2>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-lg">Orodha ya Watumiaji</h3>
          <button className="p-2 bg-indigo-600 text-white rounded-xl"><Plus size={18} /></button>
        </div>
        <div className="divide-y divide-gray-50">
          {users.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl overflow-hidden">
                  <AvatarDisplay src={u.avatar} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400 font-medium">{u.role} • {u.email}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                <button 
                  onClick={async () => {
                    // Simple deletion logic for demo
                    setUsers(users.filter(user => user.id !== u.id));
                  }}
                  className="p-2 text-red-600 bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setView('app')}
        className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold"
      >
        Rudi kwenye App
      </button>
    </motion.div>
  );

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-24 space-y-8"
    >
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setActiveTab('discover')}
            className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => alert("Huna arifa mpya.")}
            className="p-3 bg-white shadow-sm rounded-2xl text-gray-600"
          >
            <Bell size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white shadow-sm rounded-2xl text-gray-600"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Wazo la Leo 💡</h2>
          <div className="bg-white/10 p-1 rounded-xl flex">
            <button 
              onClick={() => {
                setAiLang('sw');
                if (!translations && !isAiProcessing) translateText(quote || "Every step matters in the journey of success.");
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${aiLang === 'sw' ? 'bg-white text-indigo-600' : 'text-white/60'}`}
            >
              SW
            </button>
            <button 
              onClick={() => {
                setAiLang('en');
                if (!translations && !isAiProcessing) translateText(quote || "Every step matters in the journey of success.");
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${aiLang === 'en' ? 'bg-white text-indigo-600' : 'text-white/60'}`}
            >
              EN
            </button>
          </div>
        </div>

        <p className="text-indigo-100 font-medium italic leading-relaxed mb-6 min-h-[3rem]">
          "{aiLang === 'sw' 
            ? (translations?.sw || (isAiProcessing ? "Inatafsiri..." : (quote === "Ishi kila siku kana kwamba ni ya mwisho." ? quote : "Bofya 'SW' au 'Tafsiri' kupata Kiswahili..."))) 
            : (translations?.en || quote || "Every step matters in the journey of success.")
          }"
        </p>

        <div className="flex space-x-3">
          <button 
            disabled={isAiProcessing}
            onClick={() => {
              setAiLang('sw');
              translateText(quote || "Every step matters in the journey of success.");
            }}
            className="w-full bg-white/20 backdrop-blur-md py-3 rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isAiProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Languages size={18} />
                <span>Tafsiri</span>
              </>
            )}
          </button>
        </div>
        {aiResponse && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-white/10 rounded-2xl text-sm font-medium border border-white/10"
          >
            {aiResponse}
          </motion.div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-xl px-2">Habari za Mpasuko 📢</h3>
        {news.map((n, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{n.category}</span>
              <span className="text-[10px] font-bold text-gray-400">Hivi Sasa</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{n.title}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">Habari hii imepatikana kupitia API yetu ya habari ya wakati halisi.</p>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderProfileEdit = () => (
    <AnimatePresence>
      {showEditProfile && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner overflow-hidden">
                    <AvatarDisplay src={currentUser?.avatar} className="w-full h-full object-cover" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <p className="text-xs font-bold text-indigo-600 mt-4 uppercase tracking-widest">Badili Picha</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Jina Lako</label>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Bio</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-medium resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Jinsia</label>
                    <select 
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                    >
                      <option value="Mwanaume">Mwanaume</option>
                      <option value="Mwanamke">Mwanamke</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Umri</label>
                    <input 
                      type="number"
                      value={isNaN(editAge) ? "" : editAge}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditAge(isNaN(val) ? 0 : val);
                      }}
                      className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-indigo-100"
              >
                Hifadhi Mabadiliko
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 flex justify-around items-center z-40">
      <button onClick={() => {setActiveTab('discover'); setIsSearching(false);}} className={`flex flex-col items-center transition-colors ${activeTab === 'discover' ? 'text-indigo-600' : 'text-gray-400'}`}>
        <Navigation size={24} className={activeTab === 'discover' ? 'fill-indigo-50' : ''} />
        <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider">Discover</span>
      </button>
      <button onClick={() => {setActiveTab('chat'); setIsSearching(false);}} className={`flex flex-col items-center transition-colors ${activeTab === 'chat' ? 'text-indigo-600' : 'text-gray-400'}`}>
        <div className="relative">
          <MessageCircle size={24} className={activeTab === 'chat' ? 'fill-indigo-50' : ''} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </div>
        <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider">Chats</span>
      </button>
      
      <div className="relative -mt-14">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (activeTab === 'dashboard') {
              setActiveTab('discover');
            } else {
              setActiveTab('dashboard');
            }
            setIsSearching(false);
          }}
          className={`w-16 h-16 rounded-full shadow-xl border-4 border-white flex items-center justify-center transition-colors ${activeTab === 'dashboard' ? 'bg-pink-500 text-white shadow-pink-200' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
        >
          {activeTab === 'dashboard' ? <X size={28} /> : <Sparkles size={28} />}
        </motion.button>
      </div>

      <button onClick={() => {setActiveTab('gifts'); setIsSearching(false);}} className={`flex flex-col items-center transition-colors ${activeTab === 'gifts' ? 'text-indigo-600' : 'text-gray-400'}`}>
        <Gift size={24} className={activeTab === 'gifts' ? 'fill-indigo-50' : ''} />
        <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider">Gifts</span>
      </button>
      <button onClick={() => {setActiveTab('profile'); setIsSearching(false);}} className={`flex flex-col items-center transition-colors ${activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}>
        <User size={24} className={activeTab === 'profile' ? 'fill-indigo-50' : ''} />
        <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider">Profile</span>
      </button>
    </nav>
  );

  if (view === 'auth') return renderAuth();
  if (view === 'admin') return renderAdmin();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 font-sans relative selection:bg-indigo-100 selection:text-indigo-900">
      <main className="min-h-screen">
        {activeTab === 'discover' && renderDiscover()}
        {activeTab === 'dashboard' && renderDashboard()}
        
        {activeTab === 'chat' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4"
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Meseji Zako</h1>
            <div className="space-y-3">
              {users.slice(0, 3).map(u => (
                <motion.div 
                  key={u.id} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {setSelectedUser(u); setShowChat(true)}} 
                  className="flex items-center space-x-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    {u.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-gray-900">{u.name}</h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">10:45 AM</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium truncate">Hivi ulishafika nyumbani salama?</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'gifts' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 pb-24"
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Zawadi & Pointi</h1>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-[0.2em] mb-2">Salio la Pointi</p>
              <div className="flex items-center space-x-3">
                <Zap size={32} className="fill-white" />
                <h2 className="text-5xl font-bold">{currentUser?.points || 0}</h2>
              </div>
              <button 
                onClick={async () => {
                  const res = await fetch('/api/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentUser?.id, points: (currentUser?.points || 0) + 500 })
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setCurrentUser(updated);
                  }
                }}
                className="mt-8 w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-transform"
              >
                Ongeza Pointi Sasa (+500)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-4">
                  <Heart size={28} />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Likes</h4>
                <p className="text-2xl font-bold text-indigo-600">{likedUsers.length + (currentUser?.likes || 0)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 mb-4">
                  <Star size={28} />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">VIP Days</h4>
                <p className="text-2xl font-bold text-indigo-600">12</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 pb-24"
          >
            <header className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Profile</h1>
              <div className="flex space-x-2">
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => setView('admin')}
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full"
                  >
                    <Shield size={20} />
                  </button>
                )}
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={20} />
                </button>
              </div>
            </header>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-indigo-600/5"></div>
              <div className="relative">
                <div className="w-28 h-28 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-6xl mx-auto mb-6 shadow-sm border-4 border-white overflow-hidden">
                  <AvatarDisplay src={currentUser?.avatar} className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentUser?.name}</h2>
                <p className="text-gray-500 font-medium mb-6">{currentUser?.role === 'admin' ? 'System Administrator' : 'Platinum Member'}</p>
                
                <div className="flex justify-center space-x-3">
                  <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center space-x-2">
                    <Zap size={14} className="text-indigo-600 fill-indigo-600" />
                    <span className="text-sm font-bold text-indigo-700">{currentUser?.points || 0} Pts</span>
                  </div>
                  <div className="bg-yellow-50 px-4 py-2 rounded-xl flex items-center space-x-2">
                    <Star size={14} className="text-yellow-600 fill-yellow-600" />
                    <span className="text-sm font-bold text-yellow-700">VIP Pro</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100 space-y-2">
              {[
                { icon: <CreditCard className="text-emerald-500" />, label: "Wallet & Transactions", color: "bg-emerald-50", action: () => setActiveTab('gifts') },
                { icon: <Shield className="text-blue-500" />, label: "Security & Privacy", color: "bg-blue-50", action: () => alert("Usalama na Faragha") },
                { icon: <Settings className="text-gray-500" />, label: "App Settings", color: "bg-gray-50", action: openEditProfile },
                { icon: <Award className="text-purple-500" />, label: "Achievements", color: "bg-purple-50", action: () => alert("Mafanikio Yako") },
                { icon: <LogOut className="text-red-500" />, label: "Logout", color: "bg-red-50", action: handleLogout },
              ].map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-11 h-11 ${item.color} rounded-xl flex items-center justify-center transition-transform group-active:scale-90`}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                  </div>
                  <MoreVertical size={16} className="text-gray-300" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selectedUser && !showChat && renderProfileModal()}
      </AnimatePresence>
      
      <AnimatePresence>
        {showChat && renderChat()}
      </AnimatePresence>
      
      <AnimatePresence>
        {showGiftModal && renderGiftModal()}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfile && renderProfileEdit()}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
              </div>
              
              <div className="space-y-2">
                {[
                  { icon: <User size={18} />, label: "Edit Profile", action: () => { setShowSettings(false); openEditProfile(); } },
                  { 
                    icon: <Languages size={18} />, 
                    label: `Language: ${currentUser?.language || 'Swahili'}`, 
                    action: async () => {
                      const newLang = currentUser?.language === 'Swahili' ? 'English' : 'Swahili';
                      const res = await fetch('/api/users/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: currentUser?.id, language: newLang })
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setCurrentUser(updated);
                        alert(`Lugha imebadilishwa kuwa ${newLang}`);
                      }
                    } 
                  },
                  { 
                    icon: <Bell size={18} />, 
                    label: `Notifications: ${currentUser?.notifications_enabled ? 'ON' : 'OFF'}`, 
                    action: async () => {
                      const res = await fetch('/api/users/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: currentUser?.id, notifications_enabled: !currentUser?.notifications_enabled })
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setCurrentUser(updated);
                        alert(`Arifa ${!currentUser?.notifications_enabled ? 'zimewashwa' : 'zimezimwa'}`);
                      }
                    }
                  },
                  { icon: <Shield size={18} />, label: "Privacy Policy", action: () => alert("Sera ya Faragha") },
                  { icon: <LogOut size={18} className="text-red-500" />, label: "Logout", action: handleLogout },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors font-bold text-gray-700 text-sm"
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-600">
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilter && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110] flex items-end justify-center"
            onClick={() => setShowFilter(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[3rem] p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
              <h3 className="text-2xl font-black text-gray-900 mb-6">Chuja Matokeo</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Jinsia</label>
                  <div className="flex gap-3">
                    {['Wote', 'Wanaume', 'Wanawake'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => setFilterGender(g)}
                        className={`flex-1 py-3 rounded-xl font-bold border-2 ${g === filterGender ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-100 text-gray-600'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Umri (Kuanzia {filterAge})</label>
                  <input 
                    type="range" 
                    min="18" 
                    max="99" 
                    value={isNaN(filterAge) ? 18 : filterAge}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFilterAge(isNaN(val) ? 18 : val);
                    }}
                    className="w-full accent-indigo-600" 
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
                    <span>18</span>
                    <span>99+</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilter(false)}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-indigo-100"
                >
                  Onyesha Matokeo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {renderBottomNav()}
    </div>
  );
}
