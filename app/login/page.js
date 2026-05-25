'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [section, setSection] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const roles = [
    { id: 'student', title: 'Student', icon: '🎓', description: 'Submit suggestions, rate events, view transparency' },
    { id: 'faculty', title: 'Faculty', icon: '👩‍🏫', description: 'Post announcements, evaluate events' },
    { id: 'admin', title: 'Admin', icon: '⚙️', description: 'Full system control & moderation' },
  ];

  const validateStudentId = (id) => {
    if (!/^\d{9}$/.test(id)) return false;
    const year = parseInt(id.slice(0, 4));
    const semester = parseInt(id[4]);
    return (year >= 1900 && year <= 2099 && (semester === 1 || semester === 2));
  };

  const parseStudentId = (id) => ({
    year: parseInt(id.slice(0, 4)),
    semester: parseInt(id[4]),
    number: id.slice(5),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    if (selectedRole === 'student') {
      // Student login/signup using student ID
      const trimmedStudentId = studentId.trim();
      if (!validateStudentId(trimmedStudentId)) {
        toast.error('Invalid Student ID. Format: 9 digits (YYYY + semester + 4‑digit number)');
        setLoading(false);
        return;
      }
      const email = `${trimmedStudentId}@cec.edu.ph`;

      if (isLogin) {
        // Student login
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error('Invalid Student ID or password. Please sign up if you don’t have an account.');
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, student_id')
          .eq('id', data.user.id)
          .single();
        if (!profile || profile.role !== 'student') {
          toast.error('You are not registered as a student. Please select the correct role.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        if (!profile.student_id || profile.student_id !== trimmedStudentId) {
          await supabase.from('profiles').update({ student_id: trimmedStudentId }).eq('id', data.user.id);
        }
        window.location.href = '/student/dashboard';
      } else {
        // Student signup
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.includes('already registered')) toast.error('Student ID already exists. Please login.');
          else toast.error(error.message);
          setLoading(false);
          return;
        }
        if (data.user) {
          const { year, semester } = parseStudentId(trimmedStudentId);
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              student_id: trimmedStudentId,
              enrollment_year: year,
              semester: semester,
              role: 'student',
              email: email,
              full_name: fullName,
              section: section,
            }, { onConflict: 'id' });
          if (profileError) toast.error('Error creating profile. Please contact admin.');
          else {
            toast.success('Account created! You can now log in.');
            setIsLogin(true);
            setFullName('');
            setSection('');
          }
        }
      }
    } else {
      // Faculty or Admin login/signup using email
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        toast.error('Email is required.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) {
          toast.error('Invalid email or password. Please sign up if you don’t have an account.');
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (!profile || profile.role !== selectedRole) {
          toast.error(`You are not registered as a ${selectedRole}. Please select the correct role.`);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        const destination = selectedRole === 'admin' ? '/admin/dashboard' : '/faculty/dashboard';
        window.location.href = destination;
      } else {
        // Faculty signup only (admin signup not allowed)
        if (selectedRole === 'admin') {
          toast.error('Admin accounts cannot be created here. Please contact an existing admin.');
          setLoading(false);
          return;
        }
        const { error, data } = await supabase.auth.signUp({ email: trimmedEmail, password });
        if (error) {
          if (error.message.includes('already registered')) toast.error('Email already exists. Please login.');
          else toast.error(error.message);
          setLoading(false);
          return;
        }
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: trimmedEmail,
              role: 'faculty',
              full_name: fullName,
              student_id: null,
            }, { onConflict: 'id' });
          if (profileError) toast.error('Error creating profile. Please contact admin.');
          else {
            toast.success('Account created! You can now log in.');
            setIsLogin(true);
            setFullName('');
          }
        }
      }
    }
    setLoading(false);
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <Image src="/serena-logo.png" alt="SERENA" width={140} height={140} className="mx-auto" />
            <h1 className="text-4xl font-bold text-[#343434] mt-4">SERENA</h1>
            <p className="text-gray-500 max-w-xl mx-auto mt-2">
              System for Evaluation, Reporting, Engagement, Notification, and Accountability
            </p>
            <p className="text-sm text-gray-400 mt-1">
              The official transparency and governance portal of the College of Engineering and Computational Sciences Student Council.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map(role => (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(role.id)}
                className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all border border-gray-200"
              >
                <div className="text-5xl mb-3">{role.icon}</div>
                <h3 className="text-xl font-semibold text-[#343434] capitalize">{role.title}</h3>
                <p className="text-gray-500 text-sm mt-2">{role.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Role-specific form
  const isStudent = selectedRole === 'student';
  const isFaculty = selectedRole === 'faculty';
  const isAdmin = selectedRole === 'admin';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#343434] flex-col items-center justify-center p-8 text-white">
        <div className="text-center max-w-sm">
          <Image src="/white-serena-logo.png" alt="SERENA" width={160} height={160} className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Welcome to SERENA</h2>
          <p className="text-gray-300 text-sm">
            System for Evaluation, Reporting, Engagement, Notification, and Accountability
          </p>
          <div className="mt-6 h-px bg-white/20 my-6"></div>
          <p className="text-gray-400 text-xs">
            The official transparency and governance portal of the <br />
            College of Engineering and Computational Sciences <br />
            Student Council.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <button onClick={() => setSelectedRole(null)} className="text-sm text-[#343434] hover:underline">
              ← Back to role selection
            </button>
          </div>
          <div className="text-center mb-8">
            <div className="text-4xl">{roles.find(r => r.id === selectedRole).icon}</div>
            <h2 className="text-2xl font-bold mt-2 text-[#343434] capitalize">{selectedRole}</h2>
            <p className="text-gray-500">{isLogin ? 'Login to continue' : 'Create your account'}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {isStudent ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  placeholder="e.g., 202220003"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#343434]"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#343434]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                {isStudent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Section (optional)</label>
                    <input
                      type="text"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={section}
                      onChange={e => setSection(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {!isLogin && isAdmin && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                Admin accounts cannot be created here. Please contact an existing admin.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#343434] text-white py-2 rounded-lg font-medium hover:bg-[#1a1a1a] transition"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="mt-4 text-sm text-[#343434] hover:underline w-full text-center"
          >
            {isLogin ? `Need a ${selectedRole} account? Sign up` : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}