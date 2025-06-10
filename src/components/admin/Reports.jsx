// src/components/admin/Reports.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Reports = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [completionRates, setCompletionRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // Added state to handle errors

    useEffect(() => {
        const fetchReports = async () => {
            try {
                // Using relative paths to leverage the proxy in package.json
                // CORRECTED: 'completion' endpoint (singular) for the backend
                const [enrollmentRes, revenueRes, completionRes] = await Promise.all([
                    axios.get('/api/reports/enrollments'),
                    axios.get('/api/reports/revenue'),
                    axios.get('/api/reports/completion') // Corrected to 'completion'
                ]);

                setEnrollments(enrollmentRes.data);
                setRevenue(revenueRes.data);
                setCompletionRates(completionRes.data);
                setLoading(false);
                setError(''); // Clear any previous error on successful fetch
            } catch (err) {
                console.error('Error fetching reports:', err);
                // Provide a user-friendly error message
                setError('Failed to load reports. Please check the browser console and backend server for details.');
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // Display loading state
    if (loading) return <p>Loading reports...</p>;

    // Display error state
    if (error) return <p className="text-red-600 font-semibold">{error}</p>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">System Reports</h2>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">📊 Enrollments per Module</h3>
                {enrollments.length === 0 ? (
                    <p className="text-gray-600">No enrollment data available yet.</p>
                ) : (
                    <ul className="list-disc list-inside">
                        {enrollments.map((item) => (
                            // CORRECTED: Use 'moduleId' and 'total_enrollments' as returned by backend
                            <li key={item.moduleId}>
                                Module: **{item.title || `ID ${item.moduleId}`}**: {item.total_enrollments} enrollments
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">💰 Revenue Report</h3>
                {revenue.length === 0 ? (
                    <p className="text-gray-600">No revenue data available yet.</p>
                ) : (
                    <ul className="list-disc list-inside">
                        {revenue.map((item) => (
                            // CORRECTED: Use 'moduleId' and 'total_revenue' as returned by backend
                            // Added robust typeof check before .toFixed(2) to prevent error
                            <li key={item.moduleId}>
                                Module: **{item.title || `ID ${item.moduleId}`}**: ${typeof item.total_revenue === 'number' ? item.total_revenue.toFixed(2) : '0.00'} total revenue
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-2">✅ Module Completion Rates</h3>
                {completionRates.length === 0 ? (
                    <p className="text-gray-600">No module completion data available yet.</p>
                ) : (
                    <ul className="list-disc list-inside">
                        {completionRates.map((item) => (
                            // CORRECTED: Use 'moduleId' as returned by backend
                            // Enhanced display to show completed count and total enrollments
                            <li key={item.moduleId}>
                                Module: **{item.title || `ID ${item.moduleId}`}**: {item.completion_rate}% completed ({item.completed_count} of {item.total_enrollments})
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Reports;