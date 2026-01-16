import React, { useState, useEffect } from 'react';
import { Plus, Link, Send, BookOpen, Loader2, Sparkles, MessageSquare, Trash2, Edit3, Check, X, Eye, EyeOff } from 'lucide-react';

export default function App() {
    const [items, setItems] = useState([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [type, setType] = useState('note'); // 'note' or 'url'
    const [content, setContent] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [viewingId, setViewingId] = useState(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/items');
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error('Failed to fetch items');
        }
    };

    const handleIngest = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsIngesting(true);
        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, content })
            });
            if (res.ok) {
                setContent('');
                fetchItems();
            }
        } catch (err) {
            alert('Ingestion failed');
        } finally {
            setIsIngesting(false);
        }
    };

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsQuerying(true);
        setAnswer(null);
        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await res.json();
            setAnswer(data);
        } catch (err) {
            alert('Query failed');
        } finally {
            setIsQuerying(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
            if (res.ok) fetchItems();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setEditTitle(item.title);
        setEditContent(item.content);
    };

    const handleUpdate = async (id) => {
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle, content: editContent })
            });
            if (res.ok) {
                setEditingId(null);
                fetchItems();
            }
        } catch (err) {
            alert('Update failed');
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Knowledge Inbox</h1>
                <p className="subtitle">Save thoughts & URLs. Ask anything using AI.</p>
            </header>

            <main>
                <div className="glass message-box" style={{ marginBottom: '40px' }}>
                    <form onSubmit={handleIngest}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <button
                                type="button"
                                onClick={() => setType('note')}
                                style={{ background: type === 'note' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
                            >
                                <BookOpen size={18} /> Note
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('url')}
                                style={{ background: type === 'url' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
                            >
                                <Link size={18} /> URL
                            </button>
                        </div>

                        <div className="input-group">
                            <input
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={type === 'note' ? 'Write a thought...' : 'Paste a URL...'}
                                required
                            />
                            <button disabled={isIngesting}>
                                {isIngesting ? <Loader2 className="animate-spin" /> : <Plus />}
                                {isIngesting ? 'Saving...' : 'Add'}
                            </button>
                        </div>
                    </form>
                </div>

                <section style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <MessageSquare size={20} className="text-primary" />
                        <h2 style={{ fontSize: '1.25rem' }}>Ask your knowledge base</h2>
                    </div>

                    <form onSubmit={handleQuery} className="input-group">
                        <input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="What did I save about machine learning?"
                        />
                        <button disabled={isQuerying} style={{ background: 'var(--accent)', color: '#000' }}>
                            {isQuerying ? <Loader2 className="animate-spin" /> : <Send />}
                            Ask AI
                        </button>
                    </form>

                    {answer && (
                        <div className="glass message-box" style={{ marginTop: '20px' }}>
                            {answer.error ? (
                                <div style={{ color: '#ef4444' }}>
                                    <strong>Error:</strong> {answer.error}
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                                        <Sparkles size={20} />
                                        <span style={{ fontWeight: 600 }}>AI Answer</span>
                                    </div>
                                    <p className="answer">{answer.answer}</p>

                                    {answer.sources && answer.sources.length > 0 && (
                                        <div className="sources">
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>CITATIONS:</span>
                                            {answer.sources.map((s, i) => {
                                                const sourceItem = items.find(item => item.id === s.item_id);
                                                return (
                                                    <div
                                                        key={i}
                                                        className="source-item clickable-source"
                                                        onClick={() => sourceItem && setViewingId(sourceItem.id)}
                                                        style={{ cursor: sourceItem ? 'pointer' : 'default' }}
                                                        title={sourceItem ? "Click to view full source" : ""}
                                                    >
                                                        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Eye size={14} />
                                                            Source: {s.source}
                                                        </div>
                                                        <div>"{s.content.substring(0, 150)}..."</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </section>

                <section>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Recent Items</h2>
                    <div className="items-grid">
                        {items.map(item => (
                            <div key={item.id} className="glass item-card">
                                <div className="item-actions">
                                    <button className="action-btn" onClick={() => setViewingId(viewingId === item.id ? null : item.id)} title="View Content">
                                        {viewingId === item.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button className="action-btn edit" onClick={() => startEditing(item)} title="Edit Title">
                                        <Edit3 size={14} />
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(item.id)} title="Delete Item">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <span className="item-type">{item.type}</span>

                                {editingId === item.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                        <input
                                            className="edit-input"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Title"
                                        />
                                        <textarea
                                            className="edit-input"
                                            style={{ minHeight: '100px', resize: 'vertical' }}
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            placeholder="Content"
                                        />
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => handleUpdate(item.id)} style={{ flex: 1 }}><Check size={14} /> Update</button>
                                            <button onClick={() => setEditingId(null)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)' }}><X size={14} /> Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="item-title">{item.title}</div>
                                )}

                                {viewingId === item.id && (
                                    <div className="glass" style={{ marginTop: '12px', padding: '12px', fontSize: '0.85rem', maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
                                        {item.content || "Processing content..."}
                                    </div>
                                )}

                                <div className="item-date">{new Date(item.created_at).toLocaleDateString()}</div>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>
                                Empty inbox. Start by adding some notes!
                            </p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
