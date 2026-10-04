import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import {
  User,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  Camera,
  X,
  CheckCircle,
  Building2,
} from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { currentUser, updateCurrentUserProfile } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [subject, setSubject] = useState(currentUser?.subject || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl.trim() || undefined,
      };

      if (address) updates.address = address.trim();
      if (department) updates.department = department.trim();
      if (subject) updates.subject = subject.trim();

      await updateCurrentUserProfile(updates);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleTitle = () => {
    switch (currentUser.role) {
      case 'hod':
        return 'HOD Administrator Profile';
      case 'teacher':
        return 'Faculty Member Profile';
      case 'student':
        return 'MBA Student Profile';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              Update Profile
            </h3>
            <p className="text-xs text-slate-500">
              {getRoleTitle()} • <span className="font-mono font-bold text-blue-600">{currentUser.userId}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="text-base font-bold text-slate-900">Profile Updated Successfully!</h4>
            <p className="text-xs text-slate-500">Your information has been saved to Cloud Firestore.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Preview & URL */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0 ring-2 ring-blue-300">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{name.substring(0, 2).toUpperCase() || currentUser.userId.substring(0, 2)}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Profile Photo (Upload File or Enter URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 transition-colors shrink-0">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 4 * 1024 * 1024) {
                              setError('Photo size must be under 4 MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPhotoUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Or paste photo URL..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                      <Camera className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Email & Phone in 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@mbanotes.app"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Role-Specific Fields */}
            {currentUser.role === 'teacher' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject / Specialization
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Financial Management, Marketing Strategy"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            {(currentUser.role === 'teacher' || currentUser.role === 'hod') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Department of Management Studies"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {currentUser.role === 'student' ? 'Hostel / Campus Address' : 'Office / Chamber Location'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={currentUser.role === 'student' ? 'e.g. MBA Hostel Block B, Room 204' : 'e.g. Dean Office, Management Block A'}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Read-Only Info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono font-bold text-slate-800">{currentUser.userId}</span>
              </div>
              <div className="flex justify-between">
                <span>Account Role:</span>
                <span className="font-bold text-blue-700 uppercase">{currentUser.role}</span>
              </div>
              {currentUser.batchId && (
                <div className="flex justify-between">
                  <span>Assigned Batch:</span>
                  <span className="font-bold text-slate-800">{currentUser.batchId}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
