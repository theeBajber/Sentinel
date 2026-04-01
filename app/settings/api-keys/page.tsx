"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
}

export default function ApiKeysPage() {
  const { apiFetch } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([
    "read:logs",
    "write:logs",
  ]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const availablePermissions = [
    { id: "read:logs", label: "Read Logs", description: "View detection logs" },
    {
      id: "write:logs",
      label: "Write Logs",
      description: "Submit detection logs from extension",
    },
    {
      id: "read:threats",
      label: "Read Threats",
      description: "View threat database",
    },
    {
      id: "write:threats",
      label: "Write Threats",
      description: "Add new threat patterns",
    },
    {
      id: "delete:threats",
      label: "Delete Threats",
      description: "Remove threat patterns",
    },
    {
      id: "read:stats",
      label: "Read Stats",
      description: "View system statistics",
    },
  ];

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await apiFetch("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.key);
        setNewKeyName("");
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this API key? This action cannot be undone.")) return;

    try {
      const res = await apiFetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen w-full p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2 text-accent-blue">
            Integration
          </p>
          <h1 className="text-3xl font-bold text-text-primary">API Keys</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage access tokens for browser extension and third-party
            integrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-accent-blue text-bg-primary hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      {/* Info Card */}
      <div className="mb-6 p-4 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-accent-blue mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-primary mb-1">
              Extension Setup
            </h3>
            <p className="text-sm text-text-muted">
              Use these keys to authenticate the Sentinel browser extension.
              Keys with{" "}
              <code className="bg-bg-card px-1 rounded text-xs">
                write:logs
              </code>{" "}
              permission can submit detection data.
            </p>
          </div>
        </div>
      </div>

      {/* Keys List */}
      <div className="rounded-xl bg-bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-muted">
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No API keys created yet</p>
            <p className="text-sm mt-1">Create a key to use the extension</p>
          </div>
        ) : (
          <div className="divide-y divide-bg-hover">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-4 hover:bg-bg-hover/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-text-primary">
                        {key.name}
                      </h3>
                      {!key.isActive && (
                        <span className="px-2 py-0.5 rounded text-xs bg-warning/20 text-warning">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
                      <span>
                        ID:{" "}
                        <code className="text-xs bg-bg-primary px-1 rounded">
                          {key.id.slice(0, 8)}...
                        </code>
                      </span>
                      <span>Created: {formatDate(key.createdAt)}</span>
                      {key.lastUsed && (
                        <span>Last used: {formatDate(key.lastUsed)}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {key.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-1 rounded text-xs bg-bg-primary text-accent-blue border border-accent-blue/20"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteKey(key.id)}
                    className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title="Delete key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCreateModal(false);
              setCreatedKey(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {!createdKey ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-primary">
                      Create API Key
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="p-1 rounded-lg hover:bg-bg-hover text-text-muted"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={createKey}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-muted mb-2">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production Extension"
                        className="w-full px-4 py-2 rounded-lg bg-bg-primary border border-bg-hover text-text-primary focus:border-accent-blue outline-none"
                        required
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text-muted mb-3">
                        Permissions
                      </label>
                      <div className="space-y-2">
                        {availablePermissions.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-hover cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={newKeyPermissions.includes(perm.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyPermissions([
                                    ...newKeyPermissions,
                                    perm.id,
                                  ]);
                                } else {
                                  setNewKeyPermissions(
                                    newKeyPermissions.filter(
                                      (p) => p !== perm.id,
                                    ),
                                  );
                                }
                              }}
                              className="mt-1 rounded border-bg-hover text-accent-blue focus:ring-accent-blue"
                            />
                            <div>
                              <p className="font-medium text-text-primary text-sm">
                                {perm.label}
                              </p>
                              <p className="text-xs text-text-muted">
                                {perm.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-text-muted hover:bg-bg-hover transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={
                          !newKeyName.trim() || newKeyPermissions.length === 0
                        }
                        className="flex-1 px-4 py-2 rounded-lg font-medium bg-accent-blue text-bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Create Key
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">
                      API Key Created
                    </h2>
                    <p className="text-sm text-text-muted">
                      Copy this key now. You won't be able to see it again.
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-bg-primary border border-accent-blue/30">
                      <code className="flex-1 font-mono text-sm text-text-primary break-all">
                        {createdKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdKey)}
                        className="p-2 rounded-lg hover:bg-bg-hover text-accent-blue"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <p className="text-sm text-text-muted">
                        Store this key securely. For security reasons, we cannot
                        show it again.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedKey(null);
                    }}
                    className="w-full px-4 py-2 rounded-lg font-medium bg-accent-blue text-bg-primary hover:opacity-90 transition-all"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
