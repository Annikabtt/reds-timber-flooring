import React, { useState } from 'react';
import { 
  Briefcase, Users, Package, AlertCircle, 
  TrendingUp, Clock, CheckCircle2, ChevronRight,
  MapPin, Calendar, FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

export default function PortalDashboard() {
  const navigate = useNavigate();

  // --- Mock Data: ข้อมูลจำลองสำหรับ Dashboard ---
  const kpiStats = [
    { title: "Active Projects", value: "12", icon: <Briefcase size={24} />, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Pending Material Requests", value: "3", icon: <Package size={24} />, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Installers on Site", value: "8", icon: <Users size={24} />, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Completed This Month", value: "24", icon: <CheckCircle2 size={24} />, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  const activeJobs = [
    { id: "JOB-2026-084", customer: "Smith Residence", address: "123 Sunshine Blvd", installer: "Mike Team A", status: "In Progress", progress: 65, date: "Apr 10 - Apr 12" },
    { id: "JOB-2026-085", customer: "Oak Valley Office", address: "Floor 4, Building C", installer: "Not Assigned", status: "Pending Allocation", progress: 0, date: "Apr 14 - Apr 15" },
    { id: "JOB-2026-082", customer: "The Grand Villa", address: "45 Ocean Drive", installer: "Tom Team B", status: "Finishing", progress: 90, date: "Apr 8 - Apr 10" },
  ];

  const pendingRequests = [
    { reqId: "REQ-099", installer: "Mike Team A", job: "Smith Residence", items: 4, time: "2 hours ago" },
    { reqId: "REQ-100", installer: "Tom Team B", job: "The Grand Villa", items: 1, time: "5 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
      
      {/* --- Sidebar (เมนูด้านซ้าย) --- */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-black text-white tracking-tight">REDS<span className="text-red-500">PORTAL</span></h2>
          <p className="text-xs text-slate-500 mt-1">Owner Workspace</p>
        </div>
        <div className="p-4 flex-1 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-white bg-slate-800 font-bold hover:bg-slate-700 hover:text-white">
            <TrendingUp size={18} className="mr-3" /> Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate('/materials')} className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 font-medium">
            <Package size={18} className="mr-3" /> Material DB
          </Button>
          <Button variant="ghost" onClick={() => navigate('/workflow')} className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 font-medium">
            <FileText size={18} className="mr-3" /> System Workflow
          </Button>
        </div>
        <div className="p-4 border-t border-slate-800">
          <Button onClick={() => navigate('/')} variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-400 font-medium">
            Logout
          </Button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 md:ml-64 p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20">
            + Create New Job
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {kpiStats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ฝั่งซ้าย: ตารางงานที่กำลังดำเนินการ (กินพื้นที่ 2 ส่วน) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Active Jobs</h3>
                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50">View All</Button>
              </div>
              
              <div className="divide-y divide-slate-100">
                {activeJobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      
                      {/* Job Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">{job.id}</span>
                          <h4 className="font-bold text-slate-900">{job.customer}</h4>
                        </div>
                        <div className="text-sm text-slate-500 flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <span className="flex items-center gap-1"><MapPin size={14}/> {job.address}</span>
                          <span className="flex items-center gap-1"><Calendar size={14}/> {job.date}</span>
                        </div>
                      </div>

                      {/* Status & Progress */}
                      <div className="w-full sm:w-48 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={`${job.progress === 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {job.status}
                          </span>
                          <span className="text-slate-500">{job.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${job.progress === 0 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 pt-1">
                          Team: <span className="font-bold text-slate-700">{job.installer}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: แจ้งเตือนและเบิกของ (กินพื้นที่ 1 ส่วน) */}
          <div className="space-y-6">
            
            {/* กล่องรออนุมัติเบิกของ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Action Required</h3>
              </div>
              <div className="p-2">
                {pendingRequests.map((req, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        Material Request ({req.items} items)
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{req.installer} • {req.job}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock size={12}/> {req.time}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-amber-500" />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <Button variant="link" className="text-amber-600 font-bold text-sm">Review All Requests</Button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}