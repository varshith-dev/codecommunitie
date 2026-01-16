import { Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { InvoiceGenerator } from '../utils/InvoiceGenerator'

export default function TransactionLogsTable({ transactions }) {

    const downloadInvoice = (tx) => {
        // Format: TRUVGO_INVOICE_ID_#DDMMYY-XXXXX
        const dateObj = new Date(tx.created_at);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);
        const uniqueSuffix = tx.id.split('-')[0].toUpperCase().slice(0, 5);
        const formattedId = `TRUVGO_INVOICE_ID_#${day}${month}${year}-${uniqueSuffix}`;

        InvoiceGenerator.download({
            id: tx.id,
            formattedId,
            amount: tx.amount,
            date: tx.created_at,
            description: 'Ad Credits Replenishment'
        }, {
            name: tx.advertiser?.display_name || tx.advertiser?.username || 'Advertiser',
            email: tx.advertiser?.email
        })
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">Transaction History</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {transactions.length} Records
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Transaction ID</th>
                            <th className="px-6 py-3 text-left">Advertiser</th>
                            <th className="px-6 py-3 text-left">Amount</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(tx.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                                        {tx.id.split('-')[0].toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {tx.advertiser?.display_name || tx.advertiser?.username || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-gray-500">{tx.advertiser?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ₹{tx.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                tx.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {tx.status === 'approved' && <CheckCircle size={12} />}
                                            {tx.status === 'rejected' && <XCircle size={12} />}
                                            {tx.status === 'pending' && <Clock size={12} />}
                                            {tx.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {tx.status === 'approved' && (
                                            <button
                                                onClick={() => downloadInvoice(tx)}
                                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download Invoice"
                                            >
                                                <Download size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
