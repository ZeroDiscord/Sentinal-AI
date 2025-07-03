"use client";
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export default function AdminPanel() {
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('student');
  const [school, setSchool] = useState('');
  const [hostel, setHostel] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetRole = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const setUserRole = httpsCallable(functions, 'setUserRole');
      const result = await setUserRole({ uid, role, school, hostel });
      setMessage(result.data.message);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-background rounded-lg shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4">Admin Panel: Assign User Roles</h2>
      <form onSubmit={handleSetRole} className="flex flex-col gap-4">
        <input
          className="input input-bordered"
          value={uid}
          onChange={e => setUid(e.target.value)}
          placeholder="User UID"
          required
        />
        <select
          className="input input-bordered"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="member">DC Member</option>
          <option value="secretary">Secretary</option>
          <option value="warden">Warden</option>
          <option value="school_proctor">School Proctor</option>
          <option value="cpo">CPO</option>
        </select>
        <input
          className="input input-bordered"
          value={school}
          onChange={e => setSchool(e.target.value)}
          placeholder="School (optional)"
        />
        <input
          className="input input-bordered"
          value={hostel}
          onChange={e => setHostel(e.target.value)}
          placeholder="Hostel (optional)"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Assigning...' : 'Set Role'}
        </button>
      </form>
      {message && <div className="mt-4 text-center text-foreground">{message}</div>}
    </div>
  );
} 