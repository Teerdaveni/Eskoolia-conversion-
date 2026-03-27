"use client";
import React, { useState } from 'react';

const FeesReportPage = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement search logic here
        console.log({
            selectedClass,
            selectedSection,
        });
    };

    return (
        <div className="legacy-panel">
            <section className="sms-breadcrumb mb-20">
                <div className="container-fluid">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Fees Report</h1>
                        <div className="flex gap-2 text-sm text-gray-500">
                            <span>Reports</span>
                            <span>/</span>
                            <span>Fees Report</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="admin-visitor-area up_st_admin_visitor">
                <div className="container-fluid p-0">
                    <div className="white-box bg-white border border-gray-200 rounded-lg p-4 mb-3">
                        <form onSubmit={handleSearch}>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Class</label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        className="h-9 border border-gray-300 rounded-md px-3"
                                    >
                                        <option value="">Select Class</option>
                                        {/* Add class options here */}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Section</label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        className="h-9 border border-gray-300 rounded-md px-3"
                                    >
                                        <option value="">Select Section</option>
                                        {/* Add section options here */}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="h-9 border border-blue-500 bg-blue-500 text-white rounded-md px-4 cursor-pointer"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="white-box bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-bold mb-3">Fees List</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left p-2 border-b border-gray-200">Admission No</th>
                                        <th className="text-left p-2 border-b border-gray-200">Name</th>
                                        <th className="text-left p-2 border-b border-gray-200">Class (Sec)</th>
                                        <th className="text-left p-2 border-b border-gray-200">Fees Type</th>
                                        <th className="text-left p-2 border-b border-gray-200">Due Date</th>
                                        <th className="text-left p-2 border-b border-gray-200">Amount</th>
                                        <th className="text-left p-2 border-b border-gray-200">Paid</th>
                                        <th className="text-left p-2 border-b border-gray-200">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={8} className="p-3 text-gray-500">
                                            No fees data found.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FeesReportPage;

