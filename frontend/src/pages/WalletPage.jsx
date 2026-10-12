import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/axios';

const TYPE_COLOURS = {
  earn_quiz:       'badge-green',
  earn_cgpa:       'badge-green',
  earn_signup_bonus: 'badge-blue',
  earn_admin:      'badge-blue',
  spend_referral:  'badge-red',
  refund_referral: 'badge-yellow',
  deduct_admin:    'badge-red',
};

export default function WalletPage() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/me/points?page=${page}&limit=20`).then(({ data }) => {
      setBalance(data.data.balance);
      setHistory(data.data.history.entries || data.data.history);
      setTotal(data.data.history.total || 0);
    }).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Referral Wallet</h1>

      {/* Balance card */}
      <div className="card mb-6 bg-gradient-to-r from-brand-700 to-brand-900 text-white">
        <p className="text-sm font-medium opacity-80">Available Points</p>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-5xl font-bold">{balance ?? '—'}</span>
          <span className="text-xl opacity-70 pb-1">🪙</span>
        </div>
        <p className="text-xs opacity-70 mt-3">
          Each point buys one referral request. Earn by passing quizzes. Declined requests are refunded.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        <span className="badge-green badge">+ Earned</span>
        <span className="badge-red badge">- Spent</span>
        <span className="badge-yellow badge">↩ Refunded</span>
      </div>

      {/* Transaction history */}
      <h2 className="font-semibold text-gray-800 mb-3">Transaction History</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-gray-400 text-sm">No transactions yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {history.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-800">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${TYPE_COLOURS[tx.type] || 'badge-gray'} text-xs`}>
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(tx.createdAt))} ago
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </p>
                  <p className="text-xs text-gray-400">bal: {tx.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>

          {total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">← Prev</button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="btn-secondary">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
