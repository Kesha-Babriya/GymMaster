import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from "../";
import { BASE_URL } from '../../utils/fetchData';

const AdminRoute = () => {
    const [ok, setOk] = useState(false);
    const [loading, setLoading] = useState(true);
    const { auth } = useAuth();

    useEffect(() => {
        const authCheck = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/v1/auth/admin-auth`);
                if (res?.data?.ok) {
                    setOk(true);
                } else {
                    setOk(false);
                }
            } catch (error) {
                setOk(false);
            } finally {
                setLoading(false);
            }
        };

        if (auth?.token) {
            authCheck();
        } else {
            setOk(false);
            setLoading(false);
        }
    }, [auth?.token]);

    if (loading) {
        return (
            <div className='flex justify-center items-center flex-col h-screen gap-5 bg-gray-900 text-white'>
                <div className="w-12 h-12 rounded-full animate-spin border border-dashed border-yellow-500 border-t-transparent"></div>
                <p>Verifying admin authorization...</p>
            </div>
        );
    }

    return ok ? <Outlet /> : <Spinner path={auth?.token ? 'dashboard/user' : 'login'} />;
};

export default AdminRoute;