// Registration number validation utilities
// Student Pattern: COURSE/LEVEL/NUMBER/YEAR (e.g., ITE/D/01-06605/2023)
// COURSE: Course code (ITE, BCS, etc.)
// LEVEL: D=Diploma, B=Degree
// NUMBER: Student number (XX-XXXXX format)
// YEAR: Intake year

interface RegNoValidation {
  isValid: boolean;
  yearOfStudy: number | null;
  courseName: string | null;
  canSubmit: boolean;
  levelOfStudy: string | null;
  error?: string;
}

interface StaffIdValidation {
  isValid: boolean;
  error?: string;
}

// Academic year starts in September
const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth(); // 0-11

// Calculate current academic year (September = month 8)
// If we're before September, we're still in the previous academic year
const CURRENT_ACADEMIC_YEAR = CURRENT_MONTH >= 8 ? CURRENT_YEAR : CURRENT_YEAR - 1;

// Course codes mapping
const COURSE_CODES: Record<string, string> = {
  'ITE': 'Information Technology',
  'BCS': 'Computer Science',
  'BBIT': 'Business Information Technology',
  'BIT': 'Information Technology',
  'BSE': 'Software Engineering',
  'BCE': 'Computer Engineering',
  'CS': 'Computer Science',
  'IT': 'Information Technology',
  'SE': 'Software Engineering',
  'IS': 'Information Systems',
  'DS': 'Data Science',
  'AI': 'Artificial Intelligence',
  'CY': 'Cyber Security',
};

// Level codes
const LEVEL_CODES: Record<string, string> = {
  'D': 'Diploma',
  'B': 'Degree',
  'M': 'Masters',
  'P': 'PhD',
};

export const validateRegistrationNumber = (regNo: string): RegNoValidation => {
  if (!regNo || regNo.trim() === '') {
    return {
      isValid: false,
      yearOfStudy: null,
      courseName: null,
      canSubmit: false,
      levelOfStudy: null,
      error: 'Registration number is required'
    };
  }

  // Clean and normalize the registration number
  const cleanRegNo = regNo.trim().toUpperCase();
  
  // Pattern: COURSE/LEVEL/NUMBER/YEAR (e.g., ITE/D/01-06605/2023)
  const pattern = /^([A-Z]+)\/([A-Z])\/(\d{2}-\d{4,6})\/(\d{4})$/;
  const match = cleanRegNo.match(pattern);

  if (!match) {
    return {
      isValid: false,
      yearOfStudy: null,
      courseName: null,
      canSubmit: false,
      levelOfStudy: null,
      error: 'Invalid format. Expected: COURSE/LEVEL/NUMBER/YEAR (e.g., ITE/D/01-06605/2023)'
    };
  }

  const [, courseCode, levelCode, , yearStr] = match;
  const intakeYear = parseInt(yearStr, 10);

  // Validate year
  if (intakeYear < 2000 || intakeYear > CURRENT_YEAR) {
    return {
      isValid: false,
      yearOfStudy: null,
      courseName: null,
      canSubmit: false,
      levelOfStudy: null,
      error: 'Invalid intake year in registration number'
    };
  }

  // Validate level code
  const levelOfStudy = LEVEL_CODES[levelCode];
  if (!levelOfStudy) {
    return {
      isValid: false,
      yearOfStudy: null,
      courseName: null,
      canSubmit: false,
      levelOfStudy: null,
      error: 'Invalid level code. Use D for Diploma, B for Degree'
    };
  }

  // Calculate year of study based on academic year (September start)
  // If intake was 2023 and current academic year is 2025, they're in 3rd year
  const yearOfStudy = CURRENT_ACADEMIC_YEAR - intakeYear + 1;

  // Check if course code exists
  const courseName = COURSE_CODES[courseCode] 
    ? `${levelOfStudy} in ${COURSE_CODES[courseCode]}` 
    : `${levelOfStudy} - ${courseCode} Program`;

  // First year students (current academic year intake) cannot register
  if (intakeYear === CURRENT_ACADEMIC_YEAR) {
    return {
      isValid: false,
      yearOfStudy: 1,
      courseName,
      canSubmit: false,
      levelOfStudy,
      error: 'First-year students are not eligible to register'
    };
  }

  // Only 3rd and 5th year students can submit projects
  const canSubmit = yearOfStudy === 3 || yearOfStudy === 5;

  return {
    isValid: true,
    yearOfStudy,
    courseName,
    canSubmit,
    levelOfStudy,
    error: canSubmit ? undefined : `Year ${yearOfStudy} students can view but cannot submit projects. Only 3rd and 5th year students may submit.`
  };
};

export const validateStaffId = (staffId: string): StaffIdValidation => {
  if (!staffId || staffId.trim() === '') {
    return {
      isValid: false,
      error: 'Staff ID is required'
    };
  }

  const cleanStaffId = staffId.trim();
  
  // Staff ID should be numbers only
  const pattern = /^\d{4,10}$/;
  
  if (!pattern.test(cleanStaffId)) {
    return {
      isValid: false,
      error: 'Staff ID must be 4-10 digits only (e.g., 123456)'
    };
  }

  return {
    isValid: true
  };
};

export const getYearSuffix = (year: number): string => {
  if (year === 1) return '1st';
  if (year === 2) return '2nd';
  if (year === 3) return '3rd';
  return `${year}th`;
};
