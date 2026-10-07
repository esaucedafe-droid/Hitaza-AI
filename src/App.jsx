import { useEffect, useMemo, useState } from 'react';

const MODES = [
  'NORMAL',
  'RESUMEN',
  'INFORMACIÓN ACTUAL',
  'BUSCAR MÁS A FONDO',
  'INFORMACIÓN GENERAL',
];

const STORAGE_KEY = 'hitaza-state-v1';

const createNewChat = (title = 'Nuevo chat') => ({
  id: crypto.randomUUID(),
  title,
  favorite: false,
  createdAt: Date.now(),
  messages: [],
  collectionId: 'general',
  collectionLabel: 'General',
});

const initialState = {
  chats: [createNewChat('Primer chat')],
  activeChatId: null,
  selectedView: 'all',
  collections: [
    { id: 'general', name: 'General' },
    { id: 'astronomia', name: 'Astronomía' },
    { id: 'juegos', name: 'Videojuegos' },
  ],
};

const normalizeState = (saved) => {
  if (!saved || !Array.isArray(saved.chats) || saved.chats.length === 0) {
    return {
      ...initialState,
      activeChatId: null,
    };
  }

  const chats = saved.chats.map((chat) => ({
    ...chat,
    messages: Array.isArray(chat.messages) ? chat.messages : [],
  }));

  return {
    ...initialState,
    ...saved,
    chats,
    activeChatId: saved.activeChatId || chats[0].id,
    collections: Array.isArray(saved.collections) && saved.collections.length ? saved.collections : initialState.collections,
  };
};

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return normalizeState(parsed);
  });
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState('NORMAL');
  const [isLoading, setIsLoading] = useState(false);

  const activeChat = useMemo(
    () => state.chats.find((chat) => chat.id === state.activeChatId) || state.chats[0],
    [state],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.activeChatId && state.chats.length) {
      setState((prev) => ({ ...prev, activeChatId: prev.chats[0].id }));
    }
  }, [state.activeChatId, state.chats]);

  const visibleChats = useMemo(() => {
    if (state.selectedView === 'favorites') {
      return state.chats.filter((chat) => chat.favorite);
    }
    if (state.selectedView === 'all') {
      return state.chats;
    }
    return state.chats.filter((chat) => chat.collectionId === state.selectedView);
  }, [state]);

  const selectChat = (chatId) => {
    setState((prev) => ({ ...prev, activeChatId: chatId }));
  };

  const createChat = () => {
    const newChat = createNewChat('Nuevo chat');
    setState((prev) => ({
      ...prev,
      chats: [newChat, ...prev.chats],
      activeChatId: newChat.id,
      selectedView: 'all',
    }));
  };

  const deleteChat = (chatId) => {
    setState((prev) => {
      const remaining = prev.chats.filter((chat) => chat.id !== chatId);
      if (!remaining.length) {
        const fresh = createNewChat('Nuevo chat');
        return { ...prev, chats: [fresh], activeChatId: fresh.id };
      }
      const nextActiveId = prev.activeChatId === chatId ? remaining[0].id : prev.activeChatId;
      return { ...prev, chats: remaining, activeChatId: nextActiveId };
    });
  };

  const renameChat = (chatId) => {
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat) return;
    const nextName = window.prompt('Nombre del chat', chat.title || 'Nuevo chat');
    if (!nextName) return;
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((item) => item.id === chatId ? { ...item, title: nextName.trim() || 'Nuevo chat' } : item),
    }));
  };

  const toggleFavorite = (chatId) => {
    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) => chat.id === chatId ? { ...chat, favorite: !chat.favorite } : chat),
    }));
  };

  const sendMessage = async () => {
    const cleanDraft = draft.trim();
    if (!cleanDraft || isLoading || !activeChat) return;

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: cleanDraft };
    const chatMessageList = [...activeChat.messages, userMessage];

    setState((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === activeChat.id ? { ...chat, messages: chatMessageList } : chat,
      ),
    }));

    setDraft('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanDraft,
          mode,
          history: chatMessageList,
          chatId: activeChat.id,
        }),
      });

      const data = await response.json();
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || 'No he podido responder ahora mismo.',
      };

      setState((prev) => ({
        ...prev,
        chats: prev.chats.map((chat) =>
          chat.id === activeChat.id ? { ...chat, messages: [...chatMessageList, assistantMessage] } : chat,
        ),
      }));
    } catch (error) {
      const fallbackReply = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'He tenido un problema temporal al responder. Inténtalo de nuevo en un momento; estoy listo para seguir con la conversación.',
      };

      setState((prev) => ({
        ...prev,
        chats: prev.chats.map((chat) =>
          chat.id === activeChat.id ? { ...chat, messages: [...chatMessageList, fallbackReply] } : chat,
        ),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!activeChat) {
    return <div className="app-shell empty-shell">Cargando HITAZA…</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <img src="/hitaza-mark.svg" alt="HITAZA logo" className="brand-mark" />
          <div>
            <p className="eyebrow">ASISTENTE PERSONAL</p>
            <h1>HITAZA</h1>
          </div>
        </div>

        <button className="primary-button" onClick={createChat}>+ Nuevo chat</button>

        <div className="sidebar-block">
          <div className="section-title-row">
            <span>Vista</span>
          </div>
          <div className="view-pills">
            <button className={state.selectedView === 'all' ? 'chip active' : 'chip'} onClick={() => setState((prev) => ({ ...prev, selectedView: 'all' }))}>Todos</button>
            <button className={state.selectedView === 'favorites' ? 'chip active' : 'chip'} onClick={() => setState((prev) => ({ ...prev, selectedView: 'favorites' }))}>Favoritos</button>
          </div>
        </div>

        <div className="sidebar-block">
          <div className="section-title-row">
            <span>Colecciones</span>
          </div>
          <div className="collection-list">
            {state.collections.map((collection) => (
              <button
                key={collection.id}
                className={state.selectedView === collection.id ? 'collection-item active' : 'collection-item'}
                onClick={() => setState((prev) => ({ ...prev, selectedView: collection.id }))}
              >
                {collection.name}
              </button>
            ))}
          </div>
        </div>

        <div className="conversation-list">
          {visibleChats.map((chat) => (
            <div className={chat.id === activeChat.id ? 'chat-card active' : 'chat-card'} key={chat.id}>
              <button className="chat-select" onClick={() => selectChat(chat.id)}>
                <span className="chat-title">{chat.title}</span>
                <small>{chat.messages.length} mensajes</small>
              </button>
              <div className="chat-actions">
                <button onClick={() => toggleFavorite(chat.id)}>{chat.favorite ? '★' : '☆'}</button>
                <button onClick={() => renameChat(chat.id)}>✎</button>
                <button onClick={() => deleteChat(chat.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">CHAT ACTIVO</p>
            <h2>{activeChat.title}</h2>
          </div>
          <div className="mode-selector">
            {MODES.map((item) => (
              <button
                key={item}
                className={mode === item ? 'mode-pill active' : 'mode-pill'}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        <section className="messages-container">
          {activeChat.messages.length === 0 ? (
            <div className="empty-chat-card">
              <div className="empty-icon">◌</div>
              <h3>Listo para empezar</h3>
              <p>
                Pregúntame sobre videojuegos, astronomía, ciencia, filosofía o cualquier cosa general.
              </p>
            </div>
          ) : (
            activeChat.messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'bubble user-bubble' : 'bubble assistant-bubble'}>
                <div className="bubble-header">
                  <span>{message.role === 'user' ? 'Tú' : 'Hitaza'}</span>
                </div>
                <p>{message.content}</p>
              </div>
            ))
          )}

          {isLoading && (
            <div className="loading-bubble">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </section>

        <footer className="composer">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta para HITAZA..."
            rows={1}
          />
          <button className="send-button" onClick={sendMessage} disabled={isLoading || !draft.trim()}>
            Enviar
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
