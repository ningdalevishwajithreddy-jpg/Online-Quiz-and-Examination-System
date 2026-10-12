/**
 * Role labels and capability summaries.
 *
 * DISPLAY ONLY. This map decides what the UI explains and links to; it never
 * grants access. Every request is authorised again by the server from the
 * verified session.
 */
export const ROLE_LABELS = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
  invigilator: 'Invigilator',
};

export const ROLE_CAPABILITIES = {
  admin: [
    'Manage users and assign the four platform roles',
    'Oversee every quiz, attempt, result and export',
    'Configure exam policy and invigilator assignments',
    'Read the append-only audit log',
  ],
  teacher: [
    'Create and own quizzes and their questions',
    'Set marks, duration, instructions and pass percentage',
    'Publish only quizzes that pass validation',
    'See results and analytics for own quizzes only',
    'Start and manage attempts on own quizzes',
  ],
  student: [
    'Register and maintain your own profile and password',
    'Browse published quizzes you are eligible for',
    'Start a timed attempt once, save answers automatically',
    'Submit before the deadline or be auto-submitted on expiry',
    'Review results as far as the quiz policy allows',
  ],
  invigilator: [
    'Monitor assigned exams and live session status',
    'Respond to student assistance requests',
    'Record timestamped incidents and escalate them',
    'Never modify answers, deadlines or scores',
  ],
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'Unknown';
}

export function capabilitiesFor(role) {
  return ROLE_CAPABILITIES[role] || [];
}

export const ROLE_OWNS_QUIZZES = new Set(['teacher', 'admin']);

export function canManageQuizzes(role) {
  return ROLE_OWNS_QUIZZES.has(role);
}
