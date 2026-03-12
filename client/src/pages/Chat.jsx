import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { searchUsers, listConversations, getMessages, sendMessage, legacyConversations, legacyMessages, uploadImageMessage, getUserByEmail } from "../services/chat";
import { sendMessage as sendLegacyItemMessage, getItemSummary, sendImageMessage as sendLegacyItemImageMessage } from "../services/items";
import "../styles/viewitems.css";

export default function Chat() {
  const me = JSON.parse(localStorage.getItem("user")) || null;
  const userId = me?.id;
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activePeer, setActivePeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [itemDetails, setItemDetails] = useState(null);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const email = me?.email || localStorage.getItem("userEmail") || "";
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
  
  const resolveMedia = (url) => {
    if (!url) return url;
    return url.startsWith("http://") || url.startsWith("https://") ? url : `${BASE_URL}${url}`;
  };

  const socket = useMemo(() => io(SOCKET_URL, {
    auth: { userId }
  }), [userId, SOCKET_URL]);

  const updateConversationList = (peer, lastMessage, lastType, lastAt = new Date(), incoming = false) => {
    if (!peer) return;
    setConversations(prev => {
      const existingIdx = prev.findIndex(c => 
        (peer._id && c.peer?._id && String(c.peer._id) === String(peer._id)) ||
        (!peer._id && peer.email && c.peer?.email === peer.email && peer.itemId === c.peer?.itemId)
      );

      const existing = existingIdx > -1 ? prev[existingIdx] : null;
      const rest = prev.filter((_, i) => i !== existingIdx);

      const entry = {
        peer: existing?.peer || peer,
        lastMessage,
        lastType,
        lastAt,
        unseenCount: incoming ? (existing?.unseenCount || 0) + 1 : 0
      };

      return [entry, ...rest];
    });

    try {
      const key = "chat:recent";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const base = {
        id: peer._id || null,
        email: peer.email || null,
        name: peer.name || null,
        itemId: peer.itemId || null,
        itemName: peer.itemName || null,
        contact: peer.contact || null
      };
      const filtered = existing.filter(p => (p.id ? p.id !== base.id : (p.email !== base.email || p.itemId !== base.itemId)));
      localStorage.setItem(key, JSON.stringify([{ ...base, ts: Date.now() }, ...filtered].slice(0, 20)));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const last = JSON.parse(localStorage.getItem("chat:lastPeer") || "null");
        if (last?.id || last?.email) {
          let peer = {
            _id: last.id || null,
            email: last.email || "",
            name: last.name || last.email?.split("@")[0] || "Conversation",
            itemId: last.itemId || null,
            itemName: last.itemName || null,
            contact: last.contact || null
          };

          // Resolve _id by email if missing
          if (!peer._id && peer.email) {
            try {
              const u = await getUserByEmail(peer.email);
              if (u?._id) peer._id = u._id;
            } catch {}
          }

          // Fetch Item Details if itemId exists
          if (peer.itemId) {
            try {
              const item = await getItemSummary(peer.itemId);
              setItemDetails(item);
              if (item?.name) peer.itemName = item.name;
            } catch {}
          }
          setActivePeer(peer);
          updateConversationList(peer, "", "text", new Date(), false);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const modern = await listConversations();
        const legacy = await legacyConversations(email);
        const legacyMapped = legacy.map(c => ({
          peer: { _id: null, name: c.peerEmail.split("@")[0], email: c.peerEmail, itemId: c.itemId, itemName: c.itemName, contact: c.contact },
          lastMessage: c.lastMessage,
          lastType: c.lastType,
          lastAt: c.lastAt,
          unseenCount: c.unseenCount
        }));

        // Merge and deduplicate conversations
        const map = new Map();
        
        // Add legacy first (will be overridden by modern if email matches)
        legacyMapped.forEach(c => {
          const key = c.peer.email;
          if (key) map.set(key, c);
        });

        // Add modern (overrides legacy if same peer)
        modern.forEach(c => {
          const key = c.peer?.email || c.peer?._id;
          if (key) map.set(String(key), c);
        });

        // Add recents from localStorage if missing
        try {
          const recents = JSON.parse(localStorage.getItem("chat:recent") || "[]");
          for (const r of recents) {
            const key = r.email || r.id;
            if (key && !map.has(String(key))) {
              map.set(String(key), {
                peer: {
                  _id: r.id || null,
                  email: r.email || "",
                  name: r.name || (r.email ? r.email.split("@")[0] : "User"),
                  itemId: r.itemId || null,
                  itemName: r.itemName || null,
                  contact: r.contact || null
                },
                lastMessage: "",
                lastType: "text",
                lastAt: new Date(r.ts || Date.now()),
                unseenCount: 0
              });
            }
          }
        } catch {}

        const all = Array.from(map.values()).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
        setConversations(all);

        const last = JSON.parse(localStorage.getItem("chat:lastPeer") || "null");
        let peer = null;
        if (last?.id) peer = all.find(c => c.peer?._id && String(c.peer._id) === String(last.id))?.peer;
        if (!peer && last?.email) peer = all.find(c => c.peer?.email === last.email)?.peer;
        
        if (peer) {
          if (!peer._id && peer.email) {
            try {
              const u = await getUserByEmail(peer.email);
              if (u?._id) peer._id = u._id;
            } catch {}
          }
          setActivePeer(peer);
          if (peer.itemId) {
            getItemSummary(peer.itemId).then(setItemDetails).catch(() => {});
          }
        } else if (!last && all.length > 0) {
          setActivePeer(all[0].peer);
          if (all[0].peer?.itemId) {
            getItemSummary(all[0].peer.itemId).then(setItemDetails).catch(() => {});
          }
        }
      } catch (err) {
        // Silent fail or minimal log
      }
    })();
  }, [email]);

  useEffect(() => {
    if (!activePeer) return;
    (async () => {
      if (activePeer._id) {
        const list = await getMessages(activePeer._id);
        setMessages(list);
        if (list?.length) {
          updateConversationList(activePeer, list[list.length - 1].message || "", list[list.length - 1].messageType, list[list.length - 1].createdAt, false);
          
          // Auto-resolve itemId if missing in activePeer but present in messages
           if (!activePeer.itemId) {
             const foundItem = [...list].reverse().find(m => m.itemId);
             if (foundItem) {
               setActivePeer(prev => ({ ...prev, itemId: foundItem.itemId }));
               getItemSummary(foundItem.itemId).then(item => {
                 setItemDetails(item);
                 if (item?.name) setActivePeer(prev => ({ ...prev, itemName: item.name }));
               }).catch(() => {});
             }
           }
        }
      } else {
        const list = await legacyMessages({ email, peerEmail: activePeer.email });
        setMessages(list);
        if (list?.length) updateConversationList(activePeer, list[list.length - 1].text || "", "text", list[list.length - 1].createdAt, false);
      }
      scrollToBottom();
    })();
  }, [activePeer]);

  useEffect(() => {
    socket.on("chat:message", async (msg) => {
      const isMe = String(msg.senderId) === String(userId);
      const peerId = isMe ? msg.receiverId : msg.senderId;
      
      if (activePeer && (String(msg.senderId) === String(activePeer._id) || String(msg.receiverId) === String(activePeer._id))) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
        if (msg.itemId && (!activePeer.itemId || activePeer.itemId !== msg.itemId)) {
          setActivePeer(prev => ({ ...prev, itemId: msg.itemId }));
          getItemSummary(msg.itemId).then(setItemDetails).catch(() => {});
        }
      }

      // Fetch peer info if not in list
      let peer = conversations.find(c => c.peer?._id === peerId)?.peer;
      if (!peer) {
        try {
          peer = await getUserById(peerId);
        } catch {}
      }
      
      if (peer) {
        if (msg.itemId) {
          peer = { ...peer, itemId: msg.itemId };
        }
        updateConversationList(peer, msg.message, msg.messageType, msg.createdAt, !isMe);
      }
    });
    socket.on("typing", () => {});
    return () => {
      socket.off("chat:message");
      socket.off("typing");
    };
  }, [socket, activePeer, userId, conversations]);

  const doSearch = async (q) => {
    setQuery(q);
    const res = await searchUsers(q);
    setSearchResults(res.filter(u => u._id !== userId));
  };
  const openPeer = (u) => {
    setActivePeer(u);
    setItemDetails(null);
    if (u?.itemId) {
      getItemSummary(u.itemId).then(item => {
        setItemDetails(item);
        if (item?.name && !u.itemName) {
          setActivePeer(prev => ({ ...prev, itemName: item.name }));
        }
      }).catch(() => {});
    }
    try {
      const payload = {
        id: u?._id || null,
        email: u?.email || null,
        name: u?.name || null,
        itemId: u?.itemId || null,
        itemName: u?.itemName || null,
        contact: u?.contact || null
      };
      localStorage.setItem("chat:lastPeer", JSON.stringify(payload));
      // maintain recent peers list
      const key = "chat:recent";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = existing.filter(p => (p.id ? p.id !== payload.id : (p.email !== payload.email || p.itemId !== payload.itemId)));
      const next = [{ ...payload, ts: Date.now() }, ...filtered].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };
  const send = async () => {
    if (!text.trim() || !activePeer) return;
    let msg = null;
    if (activePeer._id) {
      msg = await sendMessage({ receiverId: activePeer._id, message: text.trim(), itemId: activePeer.itemId });
      updateConversationList(activePeer, text.trim(), "text", new Date(), false);
      // write into recent peers
      try {
        const key = "chat:recent";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const base = { id: activePeer._id, email: activePeer.email, name: activePeer.name, itemId: activePeer.itemId, itemName: activePeer.itemName };
        const filtered = existing.filter(p => p.id !== base.id);
        localStorage.setItem(key, JSON.stringify([{ ...base, ts: Date.now() }, ...filtered].slice(0, 20)));
      } catch {}
    } else {
      // legacy reply via item message API
      const fromEmail = email;
      const toEmail = activePeer.email;
      const itemId = activePeer.itemId;
      msg = await sendLegacyItemMessage(itemId, fromEmail, toEmail, text.trim());
      updateConversationList(activePeer, text.trim(), "text", new Date(), false);
      try {
        const key = "chat:recent";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const base = { id: null, email: activePeer.email, name: activePeer.name, itemId: activePeer.itemId, itemName: activePeer.itemName };
        const filtered = existing.filter(p => p.email !== base.email || p.itemId !== base.itemId);
        localStorage.setItem(key, JSON.stringify([{ ...base, ts: Date.now() }, ...filtered].slice(0, 20)));
      } catch {}
    }
    setMessages(prev => [...prev, msg]);
    setText("");
    scrollToBottom();
  };
  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };
  const pickImage = () => {
    if (!activePeer) return;
    fileRef.current?.click();
  };
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activePeer) return;
    try {
      let msg = null;
      if (activePeer._id) {
        msg = await uploadImageMessage({ receiverId: activePeer._id, file, itemId: activePeer.itemId });
        updateConversationList(activePeer, "[image]", "image", new Date(), false);
      } else {
        // legacy image upload via item message API
        const fromEmail = email;
        const toEmail = activePeer.email;
        const itemId = activePeer.itemId;
        msg = await sendLegacyItemImageMessage(itemId, fromEmail, toEmail, file);
        updateConversationList(activePeer, "[image]", "image", new Date(), false);
      }
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      alert("Failed to upload image. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  const rel = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "online";
    if (mins < 60) return `left ${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    return `left ${hrs} hour${hrs>1?"s":""} ago`;
  };

  const srcFor = (img) => {
    if (!img || typeof img !== "string") return "/images/item-placeholder.svg";
    if (img.startsWith("/uploads/")) return `${BASE_URL}${img}`;
    if (img.startsWith("/images/")) return img;
    if (/^https?:\/\//.test(img)) return img;
    return "/images/item-placeholder.svg";
  };

  return (
    <div className="chat-shell">
      <div className="peer-pane">
        <div className="peer-search">
          <input className="peer-input" placeholder="Search…" value={query} onChange={e => doSearch(e.target.value)} />
        </div>
        <div className="peer-results">
          {searchResults.map(u => (
            <button key={u._id} className="peer-item" onClick={() => openPeer(u)}>
              <div className="peer-avatar">{(u.name || u.email || "?").slice(0,1).toUpperCase()}</div>
              <div className="peer-meta">
                <div className="peer-name">{u.name || (u.email ? u.email.split("@")[0] : "User")}</div>
                <div className="peer-status"><span className="dot online"></span> tap to chat</div>
              </div>
            </button>
          ))}
        </div>
        <div className="peer-header">Conversations</div>
        <div className="peer-list">
          {conversations.map((c, idx) => {
            const name = c.peer?.name || (c.peer?.email ? c.peer.email.split("@")[0] : "User");
            const last = rel(c.lastAt);
            const active = activePeer && ((c.peer?._id && activePeer._id && String(c.peer._id) === String(activePeer._id)) || (c.peer?.email && activePeer.email && c.peer.email === activePeer.email));
            return (
              <button key={idx} className={"peer-item" + (active ? " active": "")} onClick={() => openPeer(c.peer)}>
                <div className="peer-avatar">{(name || "?").slice(0,1).toUpperCase()}</div>
                <div className="peer-meta">
                  <div className="peer-name">{name}</div>
                  <div className="peer-last-msg">{c.lastMessage}</div>
                </div>
                <div className="peer-timestamp">{new Date(c.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="thread-pane glass" style={{ borderRadius: 18 }}>
        {activePeer ? (
          <>
            <div className="chat-header2">
              <div className="peer-avatar lg">{(activePeer.name || activePeer.itemName || activePeer.email || "?").slice(0,1).toUpperCase()}</div>
              <div className="chat-head-meta">
                <div className="chat-title">Chat with {activePeer.name || (activePeer.email ? activePeer.email.split("@")[0] : "User")}</div>
                <div className="chat-sub">
                  {activePeer.itemName && <span style={{ color: "#3b82f6", fontWeight: 700 }}>About: {activePeer.itemName} • </span>}
                  {messages.length} messages
                </div>
              </div>
            </div>

            {itemDetails && (
              <div className="item-context-banner glass" style={{ margin: "0 12px 12px 12px" }}>
                <div className="context-img-wrap">
                  <img src={srcFor(itemDetails.image)} alt={itemDetails.name} />
                </div>
                <div className="context-info">
                  <div className="context-name">Item: {itemDetails.name}</div>
                  <div className="context-meta">
                    <span className={`badge ${itemDetails.status === "Lost" ? "lost" : "found"}`}>{itemDetails.status}</span>
                    <span className="badge">{itemDetails.category}</span>
                  </div>
                  <div className="context-loc">{itemDetails.location}</div>
                </div>
              </div>
            )}

            <div ref={listRef} className="message-list">
              {messages.map(m => {
                const isMe = m.senderId ? String(m.senderId) === String(userId) : (m.from && m.from === email);
                return (
                  <div key={m._id} className={`bubble ${isMe ? "me" : "them"}`}>
                    {m.messageType === "image" ? <img src={resolveMedia(m.message)} alt="" /> : (m.message || m.text)}
                    <div className="time">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
            <div className="chat-compose">
              <input className="ui-input" placeholder="Type a message…" value={text} onChange={e => { setText(e.target.value); if (activePeer._id) socket.emit("typing", { to: activePeer._id }); }} />
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
              <button className="action-btn blue" title="Send image" onClick={pickImage}>Image</button>
              <button className="action-btn green" onClick={send}>Send</button>
            </div>
          </>
        ) : (
          <div style={{ height: 460, display: "flex", alignItems: "center", justifyContent: "center", opacity: .7 }}>
            Select a conversation or search a user to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
