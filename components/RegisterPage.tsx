
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Role, User, StudentProfile, TeacherProfile, ParentProfile } from '../types';
import { CheckIcon, XIcon, LocationMarkerIcon, SpinnerIcon, ExclamationTriangleIcon, CheckCircleIcon } from './icons/IconComponents';
import { CBSE_CLASSES, ALL_CBSE_SUBJECTS } from '../cbseData';
import SearchableMultiSelect from './SearchableMultiSelect';

declare const L: any; // Declare Leaflet global

interface RegisterPageProps {
  onRegister: (user: Omit<User, 'id' | 'pin'>) => void;
  onNavigateToLogin: () => void;
  allUsers: User[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;


const ProgressBar: React.FC<{ steps: string[], currentStep: number }> = ({ steps, currentStep }) => (
    <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
            {steps.map((stepName, stepIdx) => {
                const stepNumber = stepIdx + 1;
                const isCompleted = currentStep > stepNumber;
                const isCurrent = currentStep === stepNumber;
                return (
                    <li key={stepName} className="md:flex-1">
                        <div className={`group flex flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${isCompleted ? 'border-indigo-600' : isCurrent ? 'border-indigo-600' : 'border-gray-200 dark:border-slate-700'}`}>
                            <span className={`text-sm font-medium transition-colors ${isCompleted ? 'text-indigo-600' : isCurrent ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'}`}>{`Step ${stepNumber}`}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{stepName}</span>
                        </div>
                    </li>
                );
            })}
        </ol>
    </nav>
);

const SubmissionSuccessModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">Application Submitted!</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
                Thank you for registering. An administrator will review your application shortly. You will be notified once it's approved.
            </p>
            <p className="mt-2 text-sm text-slate-500">You can check your application status on the login page.</p>
            <button onClick={onClose} className="btn-primary w-full mt-6">
                Back to Login
            </button>
        </div>
    </div>
);

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onNavigateToLogin, allUsers }) => {
  const [step, setStep] = useState(1);

  // Common fields
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Student specific
  const [studentClass, setStudentClass] = useState('');
  const [subjectsOfInterest, setSubjectsOfInterest] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState('');
  
  // Teacher specific
  const [subjects, setSubjects] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [salaryRange, setSalaryRange] = useState(''); // Changed from monthlyRate
  const [hourlyRate, setHourlyRate] = useState('');
  const [perSessionFee, setPerSessionFee] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certsFile, setCertsFile] = useState<File | null>(null);

  // Parent specific
  const [childStudentId, setChildStudentId] = useState('');
  
  // Errors & State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSubmissionSuccess, setIsSubmissionSuccess] = useState(false);

  const steps = useMemo(() => {
    const baseSteps = ['Your Role', 'Account Security'];
    if (role === 'student' || role === 'teacher' || role === 'parent') {
        return [...baseSteps, 'Profile Details'];
    }
    return baseSteps;
  }, [role]);
  
  const validateStep1 = () => {
      const newErrors: Record<string, string> = {};
      if (!name.trim()) newErrors.name = 'Full name is required.';
      if (!email.trim()) newErrors.email = 'Email is required.';
      else if (!EMAIL_REGEX.test(email)) newErrors.email = 'Please enter a valid email address.';
      if (!phone.trim()) newErrors.phone = 'Phone number is required.';
      else if (!PHONE_REGEX.test(phone)) newErrors.phone = 'Phone number must be 10 digits.';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
      const newErrors: Record<string, string> = {};
      if (!password) newErrors.password = 'Password is required.';
      else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long.';
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
      let isValid = false;
      if (step === 1) isValid = validateStep1();
      if (step === 2) isValid = validateStep2();
      if (step === 3) isValid = true; // Final submit validation happens in handleSubmit
      
      if (isValid) {
          setStep(s => s + 1);
      }
  };

  const handlePrev = () => {
      setErrors({});
      setStep(s => s - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let profile: StudentProfile | TeacherProfile | ParentProfile;
    let finalValidationPass = true;
    const newErrors: Record<string, string> = {};

    if (role === 'student') {
        if (!studentClass) { newErrors.studentClass = "Class/Stream is required."; finalValidationPass = false; }
        if (subjectsOfInterest.length === 0) { newErrors.subjectsOfInterest = "At least one subject is required."; finalValidationPass = false; }
        if (!learningGoals) { newErrors.learningGoals = "Learning goals are required."; finalValidationPass = false; }
        if (!address.trim()) { newErrors.address = "Address is required."; finalValidationPass = false; }
        const grade = parseInt(studentClass.match(/\d+/)?.[0] || '0', 10);
        profile = { grade, subjectsOfInterest, learningGoals: learningGoals.toUpperCase(), status: 'pending', address: address.trim(), location: location || undefined, credits: 0, checkoutSession: null, activeSubscription: null };
    } else if (role === 'teacher') {
        if (subjects.length === 0) { newErrors.subjects = "At least one subject is required."; finalValidationPass = false; }
        if (!experience) { newErrors.experience = "Experience is required."; finalValidationPass = false; }
        if (!qualification) { newErrors.qualification = "Qualification is required."; finalValidationPass = false; }
        if (!salaryRange.trim()) { newErrors.salaryRange = "Salary range is required."; finalValidationPass = false; }
        if (!hourlyRate) { newErrors.hourlyRate = "Hourly rate is required."; finalValidationPass = false; }
        if (!perSessionFee) { newErrors.perSessionFee = "Per session fee is required."; finalValidationPass = false; }
        if (!address.trim()) { newErrors.address = "Address is required."; finalValidationPass = false; }
        profile = { subjects, experience: parseInt(experience, 10), qualification: qualification.toUpperCase(), salaryRange: salaryRange.trim(), hourlyRate: parseInt(hourlyRate, 10), perSessionFee: parseInt(perSessionFee, 10), status: 'pending', cvFileName: cvFile?.name, certificatesFileName: certsFile?.name, address: address.trim(), location: location || undefined };
    } else { // Parent
        if (!childStudentId) { newErrors.childStudentId = "Child's Student ID is required."; finalValidationPass = false; }
        else {
            const student = allUsers.find(u => u.role === 'student' && u.studentId?.toUpperCase() === childStudentId.trim().toUpperCase());
            if (!student) { newErrors.childStudentId = `No student found with ID "${childStudentId}".`; finalValidationPass = false; }
            else if ((student.profile as StudentProfile).parentId) { newErrors.childStudentId = `Student with ID "${childStudentId}" is already linked.`; finalValidationPass = false; }
        }
        profile = { childStudentId: childStudentId.trim().toUpperCase(), status: 'pending' };
    }
    
    if (!finalValidationPass) {
        setErrors(newErrors);
        return;
    }
    
    const user: Omit<User, 'id' | 'pin'> = { name: name.toUpperCase(), email: email.toLowerCase(), phone, password, role, profile };
    onRegister(user);
    setIsSubmissionSuccess(true);
  };
  
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
        setErrors(e => ({ ...e, address: "Geolocation is not supported by your browser." }));
        return;
    }

    setIsFetchingLocation(true);
    setErrors(e => ({ ...e, address: undefined }));

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });

            try {
                // Using OpenStreetMap's Nominatim for reverse geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch address.');
                }
                const data = await response.json();
                const { city, town, village, state } = data.address;
                const finalCity = city || town || village || 'Unknown City';
                setAddress(`${finalCity}, ${state}`);
            } catch (error) {
                console.error("Reverse geocoding error:", error);
                setErrors(e => ({ ...e, address: "Could not retrieve address. Please enter manually." }));
            } finally {
                setIsFetchingLocation(false);
            }
        },
        (error) => {
            let errorMessage = "Could not get your location. ";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "Permission denied.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "The request to get user location timed out.";
                    break;
                default:
                    errorMessage += "An unknown error occurred.";
                    break;
            }
            setErrors(e => ({ ...e, address: errorMessage }));
            setIsFetchingLocation(false);
        }
    );
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-slide-in">
             <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Let's get started. Which role best describes you?</h2>
             <div className="flex justify-center p-1 bg-gray-200 dark:bg-slate-700 rounded-lg">
              {(['student', 'teacher', 'parent'] as Role[]).map((r) => (
                <button type="button" key={r} onClick={() => setRole(r)} className={`w-full py-2.5 text-sm font-medium rounded-md capitalize transition-all duration-300 ${ role === r ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-slate-600/50'}`}>
                  I am a {r}
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="JOHN DOE" required className="input-style mt-1 uppercase" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} placeholder="john.doe@example.com" required className="input-style mt-1" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">10-Digit Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required className="input-style mt-1" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-slide-in">
             <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Create a secure password</h2>
             <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password (min. 8 characters)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" required className="input-style mt-1" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
             </div>
             <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="********" required className="input-style mt-1" />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
             </div>
          </div>
        );
      case 3:
        return (
            <div className="animate-slide-in">
              {role === 'student' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Tell us about your learning goals</h2>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                    <div className="relative mt-1">
                        <input 
                            type="text" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                            placeholder="Click the icon or enter manually..." 
                            required 
                            className="input-style w-full pr-10" 
                        />
                        <button 
                            type="button" 
                            onClick={handleFetchLocation} 
                            disabled={isFetchingLocation}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 disabled:cursor-not-allowed" 
                            title="Get Current Location"
                        >
                            {isFetchingLocation ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <LocationMarkerIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    <p className="text-xs text-slate-500 mt-1">Your location helps in finding nearby tutors. We only store coordinates and never share your exact address.</p>
                  </div>
                   <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Class / Stream</label>
                        <select value={studentClass} onChange={e => {setStudentClass(e.target.value); setSubjectsOfInterest([]);}} required className="input-style select-style mt-1">
                            <option value="">-- Select Class --</option>
                            {Object.keys(CBSE_CLASSES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.studentClass && <p className="text-xs text-red-500 mt-1">{errors.studentClass}</p>}
                   </div>
                   {studentClass && (
                        <div className="animate-fadeIn">
                             <SearchableMultiSelect 
                                label="Subjects of Interest"
                                options={CBSE_CLASSES[studentClass]}
                                selected={subjectsOfInterest}
                                onChange={setSubjectsOfInterest}
                                placeholder="Search and select subjects"
                            />
                            {errors.subjectsOfInterest && <p className="text-xs text-red-500 mt-1">{errors.subjectsOfInterest}</p>}
                        </div>
                   )}
                  <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning Goals</label><textarea value={learningGoals} onChange={(e) => setLearningGoals(e.target.value)} placeholder="e.g., Prepare for exams, understand complex topics" required rows={3} className="input-style mt-1 uppercase" />{errors.learningGoals && <p className="text-xs text-red-500 mt-1">{errors.learningGoals}</p>}</div>
                </div>
              )}
              {role === 'teacher' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Complete your teacher profile</h2>
                   <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                         <div className="relative mt-1">
                            <input 
                                type="text" 
                                value={address} 
                                onChange={(e) => setAddress(e.target.value)} 
                                placeholder="Click the icon or enter manually..." 
                                required 
                                className="input-style w-full pr-10" 
                            />
                            <button 
                                type="button" 
                                onClick={handleFetchLocation} 
                                disabled={isFetchingLocation}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 disabled:cursor-not-allowed" 
                                title="Get Current Location"
                            >
                                {isFetchingLocation ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <LocationMarkerIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        <p className="text-xs text-slate-500 mt-1">Your location helps students find you. We only store coordinates and never share your exact address.</p>
                    </div>
                    <SearchableMultiSelect 
                        label="Subjects Taught"
                        options={ALL_CBSE_SUBJECTS}
                        selected={subjects}
                        onChange={setSubjects}
                        placeholder="Search and select subjects you teach"
                    />
                    {errors.subjects && <p className="text-xs text-red-500 mt-1">{errors.subjects}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience (Yrs)</label><input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 10" required className="input-style mt-1" />{errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}</div>
                        <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Highest Qualification</label><input type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g., PhD in Physics" required className="input-style mt-1 uppercase" />{errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification}</p>}</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <h4 className="text-md font-semibold mb-2">Pricing Informatics (INR)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hourly</label><input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g., 1000" required className="input-style mt-1" />{errors.hourlyRate && <p className="text-xs text-red-500 mt-1">{errors.hourlyRate}</p>}</div>
                            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Salary Range</label><input type="text" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g., 2000-2500" required className="input-style mt-1" />{errors.salaryRange && <p className="text-xs text-red-500 mt-1">{errors.salaryRange}</p>}</div>
                            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Per Session</label><input type="number" value={perSessionFee} onChange={(e) => setPerSessionFee(e.target.value)} placeholder="e.g., 1500" required className="input-style mt-1" />{errors.perSessionFee && <p className="text-xs text-red-500 mt-1">{errors.perSessionFee}</p>}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload CV (Optional)</label><input type="file" onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mt-1" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Certificates (Optional)</label><input type="file" onChange={(e) => setCertsFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mt-1" /></div>
                    </div>
                </div>
              )}
              {role === 'parent' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Link to your child's account</h2>
                  <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Child's Student ID</label><input type="text" value={childStudentId} onChange={(e) => setChildStudentId(e.target.value.toUpperCase())} placeholder="e.g., STU-XY1234" required className="input-style mt-1 uppercase" />{errors.childStudentId && <p className="text-xs text-red-500 mt-1">{errors.childStudentId}</p>}<p className="text-xs text-slate-500 mt-1">Please get this ID from your child to link accounts.</p></div>
                </div>
              )}
            </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-mesh-gradient p-4">
      {isSubmissionSuccess && <SubmissionSuccessModal onClose={onNavigateToLogin} />}
      <div className="w-full max-w-2xl">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Join Pathshaala</h1>
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">Create your account to start your journey with us.</p>
            
            <div className="mt-8 mb-6">
                <ProgressBar steps={steps} currentStep={step} />
            </div>

            <form onSubmit={handleSubmit} className="min-h-[380px]">
              {renderStepContent()}
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button type="button" onClick={onNavigateToLogin} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in here
                </button>
            </p>
            <div className="flex items-center gap-4">
                {step > 1 && (
                    <button type="button" onClick={handlePrev} className="btn-secondary">Back</button>
                )}
                {step < steps.length ? (
                    <button type="button" onClick={handleNext} className="btn-primary">Next</button>
                ) : (
                    <button type="submit" onClick={handleSubmit} className="btn-primary">Submit Application</button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
