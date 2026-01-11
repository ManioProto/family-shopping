import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Check, Settings, X, ShoppingCart, List, ChevronDown, Users, Palette, Trash2 } from 'lucide-react';
import { database, isFirebaseConfigured } from './firebase';
import { ref, onValue, set, push, remove, update } from 'firebase/database';

// User colour options - vibrant and distinct
const USER_COLOURS = [
  { name: 'Emerald', value: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { name: 'Rose', value: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' },
  { name: 'Amber', value: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { name: 'Sky', value: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  { name: 'Violet', value: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { name: 'Teal', value: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' },
  { name: 'Orange', value: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  { name: 'Fuchsia', value: '#d946ef', bg: 'rgba(217, 70, 239, 0.15)' },
];

// Preset items for suggestions
const PRESET_ITEMS = [
  'Milk', 'Bread', 'Eggs', 'Butter', 'Cheese', 'Chicken', 'Beef',
  'Apples', 'Bananas', 'Tomatoes', 'Onions', 'Potatoes', 'Carrots',
  'Lettuce', 'Rice', 'Pasta', 'Flour', 'Sugar', 'Coffee', 'Tea',
  'Yogurt', 'Cream', 'Cereal', 'Honey', 'Garlic', 'Lemons',
  'Bacon', 'Mince', 'Toilet Paper', 'Dish Soap', 'Laundry Powder'
];

// Swipeable Item Component
function SwipeableItem({ children, onDelete, onTap }) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Only allow swiping left (negative values)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const diff = currentX.current - startX.current;
    
    // If swiped far enough left, delete
    if (diff < -80) {
      setTranslateX(-100);
      setTimeout(() => onDelete(), 200);
    } else if (Math.abs(diff) < 10) {
      // It was a tap, not a swipe
      onTap();
      setTranslateX(0);
    } else {
      // Reset position
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      <div className="absolute inset-0 bg-rose-600 flex items-center justify-end pr-6 rounded-2xl">
        <span className="text-white font-medium">Delete</span>
      </div>
      
      {/* Swipeable content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (translateX === 0) onTap();
        }}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
        className="relative cursor-pointer"
      >
        {children}
      </div>
    </div>
  );
}

export default function App() {
  // User state
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userColour, setUserColour] = useState(null);
  const [allUsers, setAllUsers] = useState({});
  
  // Lists state
  const [lists, setLists] = useState({});
  const [currentListId, setCurrentListId] = useState(null);
  const [showListPicker, setShowListPicker] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  
  // Items state
  const [items, setItems] = useState({});
  const [newItem, setNewItem] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commonItems, setCommonItems] = useState({});
  
  // UI state
  const [textSize, setTextSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [tempName, setTempName] = useState('');
  const [tempColour, setTempColour] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Initialize user and check Firebase
  useEffect(() => {
    const configured = isFirebaseConfigured();
    setFirebaseReady(configured);
    
    // Load local preferences
    const savedPrefs = localStorage.getItem('shopping-prefs');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setTextSize(prefs.textSize || 18);
      setUserId(prefs.userId || null);
      setCurrentListId(prefs.currentListId || null);
    }
    
    if (!configured) {
      setIsLoading(false);
      return;
    }
    
    // Load user data
    const savedUserId = localStorage.getItem('shopping-prefs') 
      ? JSON.parse(localStorage.getItem('shopping-prefs')).userId 
      : null;
    
    if (savedUserId) {
      // Fetch user info from Firebase
      const userRef = ref(database, `users/${savedUserId}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          setUserName(userData.name);
          setUserColour(userData.colour);
        } else {
          // User was deleted, show setup
          setShowSetup(true);
        }
        setIsLoading(false);
      }, { onlyOnce: true });
    } else {
      setShowSetup(true);
      setIsLoading(false);
    }
  }, []);

  // Subscribe to all users
  useEffect(() => {
    if (!firebaseReady || !database) return;
    
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      setAllUsers(snapshot.val() || {});
    });
    
    return () => unsubscribe();
  }, [firebaseReady]);

  // Subscribe to lists
  useEffect(() => {
    if (!firebaseReady || !database) return;
    
    const listsRef = ref(database, 'lists');
    const unsubscribe = onValue(listsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setLists(data);
      
      // If no current list selected, select first one or create default
      if (!currentListId || !data[currentListId]) {
        const listIds = Object.keys(data);
        if (listIds.length > 0) {
          setCurrentListId(listIds[0]);
        }
      }
    });
    
    return () => unsubscribe();
  }, [firebaseReady, currentListId]);

  // Subscribe to current list items
  useEffect(() => {
    if (!firebaseReady || !database || !currentListId) return;
    
    const itemsRef = ref(database, `items/${currentListId}`);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      setItems(snapshot.val() || {});
    });
    
    return () => unsubscribe();
  }, [firebaseReady, currentListId]);

  // Subscribe to common items
  useEffect(() => {
    if (!firebaseReady || !database) return;
    
    const commonRef = ref(database, 'commonItems');
    const unsubscribe = onValue(commonRef, (snapshot) => {
      setCommonItems(snapshot.val() || {});
    });
    
    return () => unsubscribe();
  }, [firebaseReady]);

  // Save preferences locally
  const savePrefs = useCallback((updates) => {
    const current = JSON.parse(localStorage.getItem('shopping-prefs') || '{}');
    const updated = { ...current, ...updates };
    localStorage.setItem('shopping-prefs', JSON.stringify(updated));
  }, []);

  // Complete user setup
  const completeSetup = async () => {
    if (!tempName.trim() || !tempColour) return;
    
    const newUserId = push(ref(database, 'users')).key;
    
    await set(ref(database, `users/${newUserId}`), {
      name: tempName.trim(),
      colour: tempColour,
      createdAt: Date.now()
    });
    
    setUserId(newUserId);
    setUserName(tempName.trim());
    setUserColour(tempColour);
    savePrefs({ userId: newUserId });
    
    // Create default list if none exist
    const listsSnapshot = await new Promise(resolve => {
      onValue(ref(database, 'lists'), resolve, { onlyOnce: true });
    });
    
    if (!listsSnapshot.val()) {
      const newListId = push(ref(database, 'lists')).key;
      await set(ref(database, `lists/${newListId}`), {
        name: 'Groceries',
        createdAt: Date.now(),
        createdBy: newUserId
      });
      setCurrentListId(newListId);
      savePrefs({ currentListId: newListId });
    }
    
    setShowSetup(false);
  };

  // Add item to list
  const addItem = async (itemName) => {
    const name = itemName.trim();
    if (!name || !currentListId) return;
    
    const newItemRef = push(ref(database, `items/${currentListId}`));
    await set(newItemRef, {
      name,
      completed: false,
      addedBy: userId,
      addedAt: Date.now()
    });
    
    // Update common items count
    const itemKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const currentCount = commonItems[itemKey]?.count || 0;
    await set(ref(database, `commonItems/${itemKey}`), {
      name,
      count: currentCount + 1
    });
    
    setNewItem('');
    setShowSuggestions(false);
  };

  // Toggle item completion
  const toggleItem = async (itemId) => {
    const item = items[itemId];
    if (!item) return;
    
    await update(ref(database, `items/${currentListId}/${itemId}`), {
      completed: !item.completed,
      completedBy: !item.completed ? userId : null,
      completedAt: !item.completed ? Date.now() : null
    });
  };

  // Delete item
  const deleteItem = async (itemId) => {
    await remove(ref(database, `items/${currentListId}/${itemId}`));
  };

  // Clear completed items
  const clearCompleted = async () => {
    const completedIds = Object.entries(items)
      .filter(([_, item]) => item.completed)
      .map(([id]) => id);
    
    const updates = {};
    completedIds.forEach(id => {
      updates[`items/${currentListId}/${id}`] = null;
    });
    
    await update(ref(database), updates);
  };

  // Create new list
  const createList = async () => {
    if (!newListName.trim()) return;
    
    const newListId = push(ref(database, 'lists')).key;
    await set(ref(database, `lists/${newListId}`), {
      name: newListName.trim(),
      createdAt: Date.now(),
      createdBy: userId
    });
    
    setCurrentListId(newListId);
    savePrefs({ currentListId: newListId });
    setNewListName('');
    setShowNewListInput(false);
    setShowListPicker(false);
  };

  // Delete list
  const deleteList = async (listId) => {
    if (Object.keys(lists).length <= 1) return; // Keep at least one list
    
    await remove(ref(database, `lists/${listId}`));
    await remove(ref(database, `items/${listId}`));
    
    // Switch to another list
    const remainingLists = Object.keys(lists).filter(id => id !== listId);
    if (remainingLists.length > 0) {
      setCurrentListId(remainingLists[0]);
      savePrefs({ currentListId: remainingLists[0] });
    }
  };

  // Get user colour
  const getUserColour = (uid) => {
    return allUsers[uid]?.colour || USER_COLOURS[0];
  };

  // Sorted suggestions
  const suggestions = useMemo(() => {
    const query = newItem.toLowerCase();
    if (!query) return [];
    
    const allItems = [
      ...Object.values(commonItems).map(i => ({ name: i.name, count: i.count })),
      ...PRESET_ITEMS.filter(p => !Object.values(commonItems).some(c => c.name.toLowerCase() === p.toLowerCase()))
        .map(name => ({ name, count: 0 }))
    ];
    
    return allItems
      .filter(item => item.name.toLowerCase().includes(query))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [newItem, commonItems]);

  // Quick add items (most common)
  const quickAddItems = useMemo(() => {
    return Object.values(commonItems)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [commonItems]);

  // Text style
  const textStyle = { fontSize: `${textSize}px` };
  const smallerStyle = { fontSize: `${Math.max(14, textSize - 4)}px` };

  // Current list
  const currentList = lists[currentListId];

  // Items sorted: incomplete first, then by date
  const sortedItems = useMemo(() => {
    return Object.entries(items)
      .sort((a, b) => {
        if (a[1].completed !== b[1].completed) {
          return a[1].completed ? 1 : -1;
        }
        return b[1].addedAt - a[1].addedAt;
      });
  }, [items]);

  const completedCount = Object.values(items).filter(i => i.completed).length;
  const totalCount = Object.keys(items).length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-xl font-display">Loading...</div>
      </div>
    );
  }

  // Firebase not configured
  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-slate-800/50 rounded-3xl p-8 max-w-md text-center border border-slate-700">
          <ShoppingCart className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-4">Setup Required</h1>
          <p className="text-slate-300 mb-6">
            To enable real-time sync between family members, you need to set up Firebase.
          </p>
          <div className="text-left bg-slate-900/50 rounded-xl p-4 text-sm text-slate-400">
            <p className="font-semibold text-slate-300 mb-2">Quick setup:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to console.firebase.google.com</li>
              <li>Create a new project</li>
              <li>Add a web app</li>
              <li>Copy the config to src/firebase.js</li>
              <li>Enable Realtime Database</li>
              <li>Redeploy!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // User setup
  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-slate-800/50 rounded-3xl p-8 max-w-md w-full border border-slate-700 slide-up">
          <ShoppingCart className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-white text-center mb-2">
            Welcome to Family Shopping
          </h1>
          <p className="text-slate-400 text-center mb-8">Let's get you set up</p>
          
          {setupStep === 1 ? (
            <>
              <label className="block text-slate-300 mb-2 font-medium">What's your name?</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-lg focus:outline-none focus:border-emerald-500 mb-6"
                autoFocus
              />
              <button
                onClick={() => tempName.trim() && setSetupStep(2)}
                disabled={!tempName.trim()}
                className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <label className="block text-slate-300 mb-4 font-medium">
                <Palette className="inline w-5 h-5 mr-2" />
                Choose your colour
              </label>
              <p className="text-slate-500 text-sm mb-4">
                Items you add will show in this colour so everyone knows who added them.
              </p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {USER_COLOURS.map((colour) => (
                  <button
                    key={colour.value}
                    onClick={() => setTempColour(colour)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                      tempColour?.value === colour.value 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: colour.value }}
                  >
                    {tempColour?.value === colour.value && (
                      <Check className="w-6 h-6 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSetupStep(1)}
                  className="flex-1 p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={completeSetup}
                  disabled={!tempColour}
                  className="flex-1 p-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* List picker */}
            <button
              onClick={() => setShowListPicker(true)}
              className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors"
            >
              <List className="w-5 h-5" />
              <span className="font-display font-semibold" style={textStyle}>
                {currentList?.name || 'Select List'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>{completedCount} of {totalCount} done</span>
                {completedCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Clear done
                  </button>
                )}
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Quick add buttons */}
        {quickAddItems.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {quickAddItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => addItem(item.name)}
                  className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-full text-sm transition-colors border border-slate-700"
                >
                  + {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Swipe hint - shown once */}
        <p className="text-slate-600 text-xs text-center mb-3">
          Tap to complete • Swipe left to delete
        </p>

        {/* Shopping list */}
        <div className="space-y-2">
          {sortedItems.map(([id, item]) => {
            const itemColour = getUserColour(item.addedBy);
            
            return (
              <SwipeableItem
                key={id}
                onDelete={() => deleteItem(id)}
                onTap={() => toggleItem(id)}
              >
                <div
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    item.completed 
                      ? 'bg-slate-800/30 border-slate-800' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                  style={!item.completed ? { 
                    backgroundColor: itemColour.bg,
                    borderColor: `${itemColour.value}40`
                  } : {}}
                >
                  {/* Colour indicator */}
                  <div
                    className="w-3 h-3 rounded-full colour-dot flex-shrink-0"
                    style={{ backgroundColor: item.completed ? '#64748b' : itemColour.value }}
                  />
                  
                  {/* Item name */}
                  <span
                    className={`flex-1 ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}
                    style={textStyle}
                  >
                    {item.name}
                  </span>
                  
                  {/* Completed checkmark */}
                  {item.completed && (
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              </SwipeableItem>
            );
          })}
        </div>

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500" style={textStyle}>Your list is empty</p>
            <p className="text-slate-600 text-sm mt-1">Add items using the button below</p>
          </div>
        )}
      </main>

      {/* Add item input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 p-4">
        <div className="max-w-lg mx-auto relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newItem}
                onChange={(e) => {
                  setNewItem(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addItem(newItem);
                  if (e.key === 'Escape') setShowSuggestions(false);
                }}
                onFocus={() => newItem && setShowSuggestions(true)}
                placeholder="Add an item..."
                className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 pr-12"
                style={textStyle}
              />
              
              {/* User colour indicator */}
              <div
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{ backgroundColor: userColour?.value }}
              />
            </div>
            
            <button
              onClick={() => addItem(newItem)}
              disabled={!newItem.trim()}
              className="p-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
              {suggestions.map((item) => (
                <button
                  key={item.name}
                  onClick={() => addItem(item.name)}
                  className="w-full p-3 text-left text-white hover:bg-slate-700 transition-colors flex items-center justify-between"
                  style={smallerStyle}
                >
                  <span>{item.name}</span>
                  {item.count > 0 && (
                    <span className="text-slate-500 text-sm">used {item.count}x</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List picker modal */}
      {showListPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowListPicker(false)}
        >
          <div 
            className="bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <List className="w-5 h-5" />
                Your Lists
              </h2>
              <button onClick={() => setShowListPicker(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {Object.entries(lists).map(([id, list]) => (
                <div
                  key={id}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    id === currentListId 
                      ? 'bg-emerald-600/20 border border-emerald-500/50' 
                      : 'bg-slate-700/50 border border-transparent hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentListId(id);
                      savePrefs({ currentListId: id });
                      setShowListPicker(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <span className="text-white font-medium" style={textStyle}>{list.name}</span>
                    <span className="block text-sm text-slate-400">
                      {Object.keys(items).length} items
                    </span>
                  </button>
                  
                  {Object.keys(lists).length > 1 && (
                    <button
                      onClick={() => deleteList(id)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* New list input */}
            {showNewListInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createList()}
                  placeholder="List name..."
                  className="flex-1 p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  onClick={createList}
                  disabled={!newListName.trim()}
                  className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewListInput(true)}
                className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create new list
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Current user */}
            <div className="mb-6 p-4 bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: userColour?.value }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{userName}</div>
                  <div className="text-sm text-slate-400">{userColour?.name}</div>
                </div>
              </div>
            </div>

            {/* Family members */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Family Members
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(allUsers).map(([id, user]) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.colour?.value }}
                    />
                    <span className="text-sm text-slate-300">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Text size */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-400 mb-3 block">
                Text Size: {textSize}px
              </label>
              <input
                type="range"
                min="14"
                max="28"
                value={textSize}
                onChange={(e) => {
                  const size = parseInt(e.target.value);
                  setTextSize(size);
                  savePrefs({ textSize: size });
                }}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Smaller</span>
                <span>Larger</span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-slate-900/50 rounded-xl mb-4">
              <p style={textStyle} className="text-white">Preview text at current size</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
