
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Ticket, User as UserIcon, UserCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const COLORS = ['#1E3A8A', '#10B981', '#F59E0B']; // Primary, Accent, Yellow

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [codesCount, setCodesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(usersData);
            setLoading(false);
        });

        const unsubCodes = onSnapshot(collection(db, "codes"), (snapshot) => {
            setCodesCount(snapshot.size);
        });

        return () => {
            unsubUsers();
            unsubCodes();
        };
    }, []);
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    const statCards = [
        { title: 'إجمالي المستخدمين', value: users.length, icon: Users, color: 'bg-blue-500' },
        { title: 'أكواد الدعوة', value: codesCount, icon: Ticket, color: 'bg-indigo-500' },
        { title: 'الطلاب', value: users.filter(u => u.type === 'student').length, icon: UserIcon, color: 'bg-green-500' },
        { title: 'المعلمين', value: users.filter(u => u.type === 'teacher').length, icon: UserCheck, color: 'bg-purple-500' },
    ];

    const userDistribution = [
        { name: 'الطلاب', value: users.filter(u => u.type === 'student').length },
        { name: 'المعلمين', value: users.filter(u => u.type === 'teacher').length },
        { name: 'الأدمن', value: users.filter(u => u.type === 'admin').length },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Card key={card.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <div className={`p-2 rounded-md ${card.color}`}>
                                <card.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center">
                <Card className="w-full lg:w-1/2">
                    <CardHeader>
                        <CardTitle>توزيع المستخدمين</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={userDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {userDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

