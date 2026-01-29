
import React, { useState, useEffect, useRef } from 'react';
import { User, StudentProfile, TeacherProfile, ParentProfile } from '../types';
import { XIcon, SpinnerIcon } from './icons/IconComponents';

declare const L: any; // Declare Leaflet global

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | string[] | number | null }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return (
        <div className="py-2">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-sm text-slate-900 dark:text-slate-200">{String(displayValue)}</p>
        </div>
    );
};

const LocationPinMap: React.FC<{ location: { lat: number; lng: number } }> = ({ location }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        let isMounted = true;
        let map: any;

        if (!mapRef.current || typeof L === 'undefined') {
            setMapStatus('error');
            return;
        }

        try {
            map = L.map(mapRef.current, {
                center: [location.lat, location.lng],
                zoom: 14,
                zoomControl: false,
                scrollWheelZoom: false,
                dragging: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            L.marker([location.lat, location.lng]).addTo(map);

            if (isMounted) {
                setMapStatus('loaded');
            }
        } catch (e) {
            console.error("Leaflet map initialization failed in UserProfileModal", e);
            if (isMounted) setMapStatus('error');
        }

        return () => {
            isMounted = false;
            if (map) {
                map.remove();
            }
        };
    }, [location]);


    return (
        <div className="py-2">
            <p className="text-sm font-medium text-slate-500">Location</p>
            <div className="mt-1 h-48 w-full rounded-lg overflow-hidden relative bg-slate-200 dark:bg-slate-700">
                {mapStatus === 'loading' && <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8 text-slate-500 animate-spin" /></div>}
                {mapStatus === 'error' && <div className="flex items-center justify-center h-full text-xs text-slate-500">Map could not be loaded.</div>}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`}></div>
            </div>
        </div>
    );
};


const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const profile = user.profile;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg animate-scaleIn max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img src={user.profilePicUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400 hover:text-slate-600"/></button>
          </div>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto border-t border-slate-200 dark:border-slate-700">
           <dl className="divide-y divide-slate-200 dark:divide-slate-700">
            <DetailItem label="User ID" value={user.id} />
            <DetailItem label="Platform ID" value={user.studentId || user.teacherId || user.parentId || user.adminId} />
            <DetailItem label="Phone" value={user.phone} />
            <DetailItem label="Status" value={(profile as any).status} />
            
            {(user.role === 'student' || user.role === 'teacher') && (profile as StudentProfile | TeacherProfile).address && (
                <DetailItem label="Address" value={(profile as StudentProfile | TeacherProfile).address} />
            )}
            
            {user.role === 'student' && (
                <>
                    <DetailItem label="Grade" value={(profile as StudentProfile).grade} />
                    <DetailItem label="Subjects of Interest" value={(profile as StudentProfile).subjectsOfInterest} />
                    <DetailItem label="Learning Goals" value={(profile as StudentProfile).learningGoals} />
                </>
            )}

            {user.role === 'teacher' && (
                <>
                    <DetailItem label="Subjects Taught" value={(profile as TeacherProfile).subjects} />
                    <DetailItem label="Experience" value={`${(profile as TeacherProfile).experience} years`} />
                    <DetailItem label="Qualification" value={(profile as TeacherProfile).qualification} />
                    <DetailItem label="Hourly Rate" value={(profile as TeacherProfile).hourlyRate ? `₹${(profile as TeacherProfile).hourlyRate}` : 'N/A'} />
                    <DetailItem label="Salary Range" value={`₹${(profile as TeacherProfile).salaryRange}`} />
                    <DetailItem label="Per Session Fee" value={(profile as TeacherProfile).perSessionFee ? `₹${(profile as TeacherProfile).perSessionFee}` : 'N/A'} />
                    <DetailItem label="CV" value={(profile as TeacherProfile).cvFileName} />
                    <DetailItem label="Certificates" value={(profile as TeacherProfile).certificatesFileName} />
                </>
            )}

            {user.role === 'parent' && (
                 <DetailItem label="Child's Student ID" value={(profile as ParentProfile).childStudentId} />
            )}
           </dl>
           {(user.role === 'student' || user.role === 'teacher') && (profile as StudentProfile | TeacherProfile).location && (
                <LocationPinMap location={(profile as StudentProfile | TeacherProfile).location!} />
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
