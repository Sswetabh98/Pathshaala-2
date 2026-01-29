export const PRIMARY_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Environmental Science (EVS)', 'Art', 'Music', 'General Knowledge'];
export const MIDDLE_SUBJECTS = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Art', 'Music'];
export const HIGHER_ED_SUBJECTS_ARTS = ['History', 'Political Science', 'Sociology', 'Psychology', 'Economics', 'English Literature', 'Philosophy', 'Journalism'];
export const HIGHER_ED_SUBJECTS_SCIENCE = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Botany', 'Zoology', 'Computer Science', 'Statistics', 'Geology'];
export const HIGHER_ED_SUBJECTS_COMMERCE = ['Accountancy', 'Business Studies', 'Economics', 'Corporate Law', 'Taxation', 'Financial Management'];
export const HIGHER_ED_SUBJECTS_ENG = ['Computer Science Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Chemical Engineering', 'Aerospace Engineering'];
export const HIGHER_ED_SUBJECTS_MED = ['Anatomy', 'Physiology', 'Biochemistry', 'Pharmacology', 'Pathology', 'General Surgery', 'Pediatrics'];

export const CBSE_CLASSES: { [key: string]: string[] } = {
  'Class 1': PRIMARY_SUBJECTS,
  'Class 2': PRIMARY_SUBJECTS,
  'Class 3': PRIMARY_SUBJECTS,
  'Class 4': PRIMARY_SUBJECTS,
  'Class 5': PRIMARY_SUBJECTS,
  'Class 6': MIDDLE_SUBJECTS,
  'Class 7': MIDDLE_SUBJECTS,
  'Class 8': MIDDLE_SUBJECTS,
  'Class 9': ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer Applications'],
  'Class 10': ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer Applications'],
  'Class 11 - Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science', 'Physical Education', 'Informatics Practices'],
  'Class 11 - Commerce': ['Accountancy', 'Business Studies', 'Economics', 'English', 'Mathematics', 'Informatics Practices', 'Physical Education'],
  'Class 11 - Humanities': ['History', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'English', 'Economics', 'Physical Education', 'Home Science'],
  'Class 12 - Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science', 'Physical Education', 'Informatics Practices'],
  'Class 12 - Commerce': ['Accountancy', 'Business Studies', 'Economics', 'English', 'Mathematics', 'Informatics Practices', 'Physical Education'],
  'Class 12 - Humanities': ['History', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'English', 'Economics', 'Physical Education', 'Home Science'],
  'Undergraduate - B.Tech': HIGHER_ED_SUBJECTS_ENG,
  'Undergraduate - B.A.': HIGHER_ED_SUBJECTS_ARTS,
  'Undergraduate - B.Sc.': HIGHER_ED_SUBJECTS_SCIENCE,
  'Undergraduate - B.Com': HIGHER_ED_SUBJECTS_COMMERCE,
  'Undergraduate - MBBS': HIGHER_ED_SUBJECTS_MED,
  'Postgraduate - M.Tech': HIGHER_ED_SUBJECTS_ENG,
  'Postgraduate - M.A.': HIGHER_ED_SUBJECTS_ARTS,
  'Postgraduate - M.Sc.': HIGHER_ED_SUBJECTS_SCIENCE,
  'Doctorate - Ph.D.': [...HIGHER_ED_SUBJECTS_ARTS, ...HIGHER_ED_SUBJECTS_SCIENCE, ...HIGHER_ED_SUBJECTS_COMMERCE, ...HIGHER_ED_SUBJECTS_ENG, ...HIGHER_ED_SUBJECTS_MED]
};

export const ALL_CBSE_SUBJECTS = [...new Set(Object.values(CBSE_CLASSES).flat())].sort();