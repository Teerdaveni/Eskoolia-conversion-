import React from 'react';
import Link from 'next/link';

const ReportsSidebar = () => {
    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Reports</h2>
            <ul>
                <li className="mb-2">
                    <Link href="/reports/student">
                        <a className="text-gray-700 hover:text-indigo-600">Student Report</a>
                    </Link>
                </li>
                <li className="mb-2">
                    <Link href="/reports/exam">
                        <a className="text-gray-700 hover:text-indigo-600">Exam Report</a>
                    </Link>
                </li>
                <li className="mb-2">
                    <Link href="/reports/staff">
                        <a className="text-gray-700 hover:text-indigo-600">Staff Report</a>
                    </Link>
                </li>
                <li className="mb-2">
                    <Link href="/reports/fees">
                        <a className="text-gray-700 hover:text-indigo-600">Fees Report</a>
                    </Link>
                </li>
                <li className="mb-2">
                    <Link href="/reports/accounts">
                        <a className="text-gray-700 hover:text-indigo-600">Accounts Report</a>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default ReportsSidebar;
