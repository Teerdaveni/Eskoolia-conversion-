"use client";
import React, { useState } from "react";

const StudentReportPage = () => {
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedGender, setSelectedGender] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement search logic here
    };

    return (
        <div>
            {/* Breadcrumb */}
            <section className="sms-breadcrumb mb-6 bg-white py-3 px-4 rounded shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
                <h1 className="text-xl font-semibold text-gray-800">Student Report</h1>
                <div className="flex gap-2 text-sm text-gray-500 mt-2 md:mt-0">
                    <a href="/" className="hover:underline">Dashboard</a>
                    <span>/</span>
                    <span>Reports</span>
                    <span>/</span>
                    <span className="text-primary">Student Report</span>
                </div>
            </section>

            {/* Criteria Card */}
            <section className="admin-visitor-area up_admin_visitor">
                <div className="bg-white rounded shadow p-6 max-w-5xl mx-auto mb-8">
                    <h3 className="mb-4 text-lg font-semibold text-gray-700">Select Criteria</h3>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Class</label>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="primary_select w-full">
                                <option value="">Select Class</option>
                                <option value="10">10</option>
                                <option value="11">11</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Section</label>
                            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="primary_select w-full">
                                <option value="">Select Section</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="primary_select w-full">
                                <option value="">Select Type</option>
                                <option value="Regular">Regular</option>
                                <option value="Irregular">Irregular</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Gender</label>
                            <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} className="primary_select w-full">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className="md:col-span-4 text-right mt-2">
                            <button type="submit" className="primary-btn small fix-gr-bg inline-flex items-center gap-2">
                                <span className="ti-search pr-2"></span>Search
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Student List Table */}
            <section className="max-w-5xl mx-auto">
                <div className="bg-white rounded shadow p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-700">Student Report</h3>
                    <div className="overflow-x-auto">
                        <table className="table w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 border">Class</th>
                                    <th className="px-3 py-2 border">Section</th>
                                    <th className="px-3 py-2 border">Admission No</th>
                                    <th className="px-3 py-2 border">Name</th>
                                    <th className="px-3 py-2 border">Father Name</th>
                                    <th className="px-3 py-2 border">Date of Birth</th>
                                    <th className="px-3 py-2 border">Gender</th>
                                    <th className="px-3 py-2 border">Type</th>
                                    <th className="px-3 py-2 border">Phone</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Example row, replace with dynamic data */}
                                <tr>
                                    <td className="px-3 py-2 border">10</td>
                                    <td className="px-3 py-2 border">A</td>
                                    <td className="px-3 py-2 border">12345</td>
                                    <td className="px-3 py-2 border">John Doe</td>
                                    <td className="px-3 py-2 border">Richard Doe</td>
                                    <td className="px-3 py-2 border">2010-01-15</td>
                                    <td className="px-3 py-2 border">Male</td>
                                    <td className="px-3 py-2 border">Regular</td>
                                    <td className="px-3 py-2 border">555-1234</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StudentReportPage;
