import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  Folder,
  BarChart3,
  UploadCloud
} from 'lucide-react';
import { Sun, Moon } from 'lucide-react';
import { apiService } from '../../services/api';
import { Course } from '../../types';

const sidebarItems = [
  { id: 'dashboard', icon: Home, label: 'Dashboard / Home' },
  { id: 'learning', icon: BookOpen, label: 'My Learning & Certification' },
  { id: 'sessions', icon: Users, label: 'My Training Sessions' },
  { id: 'resources', icon: Folder, label: 'Resources & Collaboration' },
  { id: 'performance', icon: BarChart3, label: 'Performance & Feedback' },
  { id: 'uploads', icon: UploadCloud, label: 'Uploads & Documentation' }
];

// Theme toggle logic
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('theme');
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

export const TrainerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [theme, setTheme] = useState(getInitialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Real data state for Dashboard/Home
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTrainees, setActiveTrainees] = useState<number | null>(null);
  const [activeTraineesLoading, setActiveTraineesLoading] = useState(false);
  const [traineeProfiles, setTraineeProfiles] = useState<any[]>([]);
  const [traineeProfilesLoading, setTraineeProfilesLoading] = useState(false);

  useEffect(() => {
    if (activeSection === 'dashboard' && user?.id) {
      setLoading(true);
      setError(null);
      apiService.getUserCourses(user.id)
        .then(setCourses)
        .catch((err) => setError(err.message || 'Failed to fetch courses'))
        .finally(() => setLoading(false));
    }
  }, [activeSection, user?.id]);

  // Fetch real active trainees count after courses are loaded
  useEffect(() => {
    if (activeSection === 'dashboard' && courses.length > 0) {
      setActiveTraineesLoading(true);
      setTraineeProfilesLoading(true);
      Promise.all(
        courses.map((course) =>
          apiService.getCourseEnrollmentCount(course.id.toString())
        )
      )
        .then((counts) => {
          setActiveTrainees(counts.reduce((sum, count) => sum + (count || 0), 0));
        })
        .catch(() => setActiveTrainees(null))
        .finally(() => setActiveTraineesLoading(false));

      // Fetch all enrolled users for all courses and flatten
      Promise.all(
        courses.map((course) =>
          apiService.getCourseEnrollments(course.id.toString())
        )
      )
        .then((all) => {
          // Flatten and deduplicate by userid
          const merged = all.flat();
          const unique = Array.from(new Map(merged.map(u => [u.userid, u])).values());
          setTraineeProfiles(unique);
        })
        .catch(() => setTraineeProfiles([]))
        .finally(() => setTraineeProfilesLoading(false));
    } else {
      setActiveTrainees(null);
      setTraineeProfiles([]);
    }
  }, [activeSection, courses]);

  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [learningCourses, setLearningCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (activeSection === 'learning' && user?.id) {
      setLearningLoading(true);
      setLearningError(null);
      apiService.getUserCourses(user.id)
        .then(setLearningCourses)
        .catch((err) => setLearningError(err.message || 'Failed to fetch courses'))
        .finally(() => setLearningLoading(false));
    }
  }, [activeSection, user?.id]);

  // My Training Sessions state
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Course[]>([]);

  useEffect(() => {
    if (activeSection === 'sessions' && user?.id) {
      setSessionsLoading(true);
      setSessionsError(null);
      apiService.getUserCourses(user.id)
        .then(setSessions)
        .catch((err) => setSessionsError(err.message || 'Failed to fetch sessions'))
        .finally(() => setSessionsLoading(false));
    }
  }, [activeSection, user?.id]);

  const renderDashboardSection = () => {
    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!courses.length) return <div className="p-6 text-gray-600">No courses found.</div>;

    // --- Compute stats from real data ---
    // Sessions Delivered: count of completed sessions (progress 100 or end date in past)
    const now = Date.now();
    const sessionsDelivered = courses.filter(c => c.startdate && c.startdate * 1000 < now).length;
    // Active Trainees: real data from Moodle
    // const activeTrainees = ... (now comes from state)
    // Average Rating: average of course.rating (if available)
    const ratings = courses
      .map(c => typeof c.rating === 'number' ? c.rating : null)
      .filter((r): r is number => r !== null && typeof r === 'number');
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    // Completion Rate: average of course.progress (if available)
    const progresses = courses
      .map(c => typeof c.progress === 'number' ? c.progress : null)
      .filter((p): p is number => p !== null && typeof p === 'number');
    const completionRate = progresses.length ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0;

    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t('welcome')}, {user?.firstname || 'Trainer'}! 🎓
              </h1>
              <p className="text-green-100 text-lg mb-4">
                Your training impact dashboard
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>
                    {activeTraineesLoading
                      ? 'Loading...'
                      : `${Number(activeTrainees) || 0} Active Trainees`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{avgRating}/5 Average Rating</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{sessionsDelivered}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Sessions Delivered</h3>
            <p className="text-xs text-green-600">{sessionsDelivered > 0 ? `+${sessionsDelivered} this year` : 'No sessions yet'}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{activeTrainees}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Trainees</h3>
            <p className="text-xs text-green-600">{(activeTrainees ?? 0) > 0 ? `+${activeTrainees ?? 0} enrolled` : 'No trainees yet'}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Average Rating</h3>
            <p className="text-xs text-green-600">{avgRating !== 'N/A' ? '+0.1 improvement' : 'No ratings yet'}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Completion Rate</h3>
            <p className="text-xs text-green-600">{completionRate > 0 ? `+${completionRate}% this year` : 'No completions yet'}</p>
          </motion.div>
        </div>

        {/* All Active Trainees Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">All Active Trainees</h2>
          {traineeProfilesLoading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : traineeProfiles.length === 0 ? (
            <div className="text-gray-500 text-sm">No trainees found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {traineeProfiles.map((trainee) => (
                <div key={trainee.userid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {trainee.profileimageurl ? (
                    <img
                      src={trainee.profileimageurl}
                      alt={trainee.fullname}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/default-course.jpg'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {trainee.fullname ? trainee.fullname[0] : '?'}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 text-sm line-clamp-1">{trainee.fullname}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{trainee.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content + Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Tracker */}
            <div className="p-6 space-y-8">
              <h2 className="text-2xl font-bold mb-4">Your Progress Tracker</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow p-4 border border-gray-100"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {course.courseimage ? (
                        <img
                          src={course.courseimage}
                          alt={course.fullname}
                          className="w-10 h-10 rounded object-cover"
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/default-course.jpg'; }}
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-green-500" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 line-clamp-1">{course.fullname}</div>
                        <div className="text-xs text-gray-500">{course.type || 'Course'}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{course.progress ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${course.progress ?? 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            {/* Upcoming Assignments */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Upcoming Training Assignments</h3>
              <div className="space-y-2">
                {courses.filter(c => c.startdate && c.startdate * 1000 > Date.now()).length === 0 && (
                  <div className="text-gray-500 text-sm">No upcoming assignments.</div>
                )}
                {courses.filter(c => c.startdate && c.startdate * 1000 > Date.now()).map((course) => (
                  <div key={course.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-4">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-gray-900">{course.fullname}</div>
                      <div className="text-xs text-gray-600">Starts: {course.startdate ? new Date(course.startdate * 1000).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Performance Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Session Ratings Bar Chart */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Session Ratings</h3>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      // Calculate % of courses with this rating
                      const count = courses.filter(c => typeof c.rating === 'number' && Math.round(c.rating) === rating).length;
                      const percent = courses.length ? Math.round((count / courses.length) * 100) : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-4">{rating}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{percent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Completion Trends */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Completion Trends</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{completionRate}%</div>
                    <div className="text-sm text-gray-600">Average completion rate</div>
                    <div className="text-xs text-green-600 mt-2">{completionRate > 0 ? '↑' : ''} {completionRate}% this year</div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Placeholders for recommendations and alerts */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <h4 className="font-semibold mb-1">Course Recommendations</h4>
                <div className="text-gray-500 text-sm">(AI-driven recommendations coming soon)</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <h4 className="font-semibold mb-1">Alerts & Notifications</h4>
                <div className="text-gray-500 text-sm">(Reminders and alerts coming soon)</div>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Feedback */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Feedback</h2>
              <div className="space-y-4">
                {/* To show real feedback, extend Course type and fetch feedback from API */}
                {/* Placeholder feedback only, since real feedback is not available in Course type */}
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-sm">4.9/5</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    "Excellent session on teaching methodologies. Very practical and engaging."
                  </p>
                  <span className="text-xs text-gray-500">- Sarah M.</span>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm">4.8/5</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    "Great insights on assessment strategies. Will definitely apply these techniques."
                  </p>
                  <span className="text-xs text-gray-500">- Ahmed K.</span>
                </div>
              </div>
            </motion.div>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Schedule Session
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View Messages
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Issue Certificates
                </button>
              </div>
            </motion.div>
            {/* Active Trainees Sidebar Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Active Trainees</h2>
              {traineeProfilesLoading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
              ) : traineeProfiles.length === 0 ? (
                <div className="text-gray-500 text-sm">No trainees found.</div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {traineeProfiles.map((trainee) => (
                    <div key={trainee.userid} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                      {trainee.profileimageurl ? (
                        <img
                          src={trainee.profileimageurl}
                          alt={trainee.fullname}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/default-course.jpg'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                          {trainee.fullname ? trainee.fullname[0] : '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 text-sm line-clamp-1">{trainee.fullname}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{trainee.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  const renderLearningSection = () => {
    if (learningLoading) return <div className="p-6">Loading...</div>;
    if (learningError) return <div className="p-6 text-red-600">{learningError}</div>;
    if (!learningCourses.length) return <div className="p-6 text-gray-600">No learning pathway courses found.</div>;

    return (
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold mb-4">My Learning & Certification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-32 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                  {course.courseimage ? (
                    <img
                      src={course.courseimage}
                      alt={course.fullname}
                      className="w-full h-full object-cover rounded-lg"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/default-course.jpg'; }}
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-white opacity-80" />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-white bg-opacity-90 text-xs font-medium rounded-full">
                      {course.format || 'Course'}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.fullname}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {course.summary ? course.summary.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 'No description available'}
                </p>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{course.progress ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${course.progress ?? 0}%` }}
                  ></div>
                </div>
                {/* Certification status placeholder */}
                <div className="text-xs text-blue-600 font-medium">
                  {course.progress === 100 ? 'Certified' : 'In Progress'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderSessionsSection = () => {
    if (sessionsLoading) return <div className="p-6">Loading...</div>;
    if (sessionsError) return <div className="p-6 text-red-600">{sessionsError}</div>;
    if (!sessions.length) return <div className="p-6 text-gray-600">No training sessions found.</div>;

    const now = Date.now();
    const upcoming = sessions.filter(s => s.startdate && s.startdate * 1000 > now);
    const history = sessions.filter(s => s.startdate && s.startdate * 1000 <= now);

    return (
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold mb-4">My Training Sessions</h2>
        <div>
          <h3 className="text-lg font-semibold mb-2">Upcoming Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.length === 0 && <div className="text-gray-500 text-sm">No upcoming sessions.</div>}
            {upcoming.map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-8 h-8 text-green-500" />
                    <div>
                      <div className="font-semibold text-gray-900 line-clamp-1">{session.fullname}</div>
                      <div className="text-xs text-gray-500">{session.type || 'Session'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">Starts: {session.startdate ? new Date(session.startdate * 1000).toLocaleString() : 'N/A'}</div>
                  <div className="text-xs text-gray-600 mb-1">Attendees: {session.enrollmentCount ?? '-'}</div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{session.progress ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${session.progress ?? 0}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Session History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.length === 0 && <div className="text-gray-500 text-sm">No past sessions.</div>}
            {history.map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-8 h-8 text-blue-500" />
                    <div>
                      <div className="font-semibold text-gray-900 line-clamp-1">{session.fullname}</div>
                      <div className="text-xs text-gray-500">{session.type || 'Session'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">Date: {session.startdate ? new Date(session.startdate * 1000).toLocaleString() : 'N/A'}</div>
                  <div className="text-xs text-gray-600 mb-1">Attendees: {session.enrollmentCount ?? '-'}</div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{session.progress ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${session.progress ?? 0}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Resources & Collaboration (placeholder UI, real data if available)
  const renderResourcesSection = () => (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Resources & Collaboration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Shared Resource Library</h3>
            <p className="text-sm text-gray-600 mb-3">Access lesson plans, templates, presentations, and more.</p>
          </div>
          <button className="mt-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Go to Library</button>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Professional Learning Communities (PLCs)</h3>
            <p className="text-sm text-gray-600 mb-3">Join subject or role-based groups for discussion and resource sharing.</p>
          </div>
          <button className="mt-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">View PLCs</button>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Trainer Resource Folder</h3>
            <p className="text-sm text-gray-600 mb-3">Access curated toolkits and resources tailored for trainers.</p>
          </div>
          <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">Open Folder</button>
        </motion.div>
      </div>
    </div>
  );

  // Performance & Feedback (real data if available, otherwise placeholder)
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [perfCourses, setPerfCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (activeSection === 'performance' && user?.id) {
      setPerfLoading(true);
      setPerfError(null);
      apiService.getUserCourses(user.id)
        .then(setPerfCourses)
        .catch((err) => setPerfError(err.message || 'Failed to fetch performance data'))
        .finally(() => setPerfLoading(false));
    }
  }, [activeSection, user?.id]);

  const renderPerformanceSection = () => {
    if (perfLoading) return <div className="p-6">Loading...</div>;
    if (perfError) return <div className="p-6 text-red-600">{perfError}</div>;
    if (!perfCourses.length) return <div className="p-6 text-gray-600">No performance data found.</div>;

    return (
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold mb-4">Performance & Feedback</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {perfCourses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-8 h-8 text-yellow-500" />
                  <div>
                    <div className="font-semibold text-gray-900 line-clamp-1">{course.fullname}</div>
                    <div className="text-xs text-gray-500">{course.type || 'Course'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-1">Rating: {course.rating ?? 'N/A'}</div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{course.progress ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${course.progress ?? 0}%` }}
                  ></div>
                </div>
                {/* Feedback placeholder */}
                <div className="text-xs text-gray-600 mt-2">Feedback: (summary coming soon)</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Uploads & Documentation (placeholder UI, real data if available)
  const renderUploadsSection = () => (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 px-2 md:px-4">Uploads & Documentation</h2>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2 md:px-4">
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Submit Evidence</h3>
            <p className="text-sm text-gray-600 mb-3">Upload observation data, forms, or lesson delivery videos.</p>
          </div>
          <button className="mt-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Upload File</button>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Assignment/Project Submission</h3>
            <p className="text-sm text-gray-600 mb-3">Submit assignments or projects for certification.</p>
          </div>
          <button className="mt-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Submit Assignment</button>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Uploaded Files</h3>
            <p className="text-sm text-gray-600 mb-3">View your previously uploaded documentation.</p>
          </div>
          <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">View Files</button>
        </motion.div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardSection();
      case 'learning':
        return renderLearningSection();
      case 'sessions':
        return renderSessionsSection();
      case 'resources':
        return renderResourcesSection();
      case 'performance':
        return renderPerformanceSection();
      case 'uploads':
        return renderUploadsSection();
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-neutral-900 transition-colors">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 w-full max-w-xs bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex-col py-8 px-4 min-h-screen">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Trainer profile image */}
            {user?.profileimageurl ? (
              <img
                src={user.profileimageurl}
                alt={user.firstname || 'Trainer'}
                className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/default-course.jpg'; }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-500">
                {user?.firstname ? user.firstname[0] : 'T'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">Trainer Dashboard</h1>
              <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">Welcome, {user?.firstname || 'Trainer'}</div>
            </div>
          </div>
          <button
            aria-label="Toggle dark mode"
            className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors text-left gap-3 font-medium ${activeSection === item.id ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Mobile Sidebar */}
      <aside className="md:hidden w-full bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex flex-row items-center overflow-x-auto px-2 py-2 gap-2 sticky top-0 z-10">
        <button
          aria-label="Toggle dark mode"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors mr-2"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors text-xs font-medium ${activeSection === item.id ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
            onClick={() => setActiveSection(item.id)}
          >
            <item.icon className="w-5 h-5 mb-1" />
            {item.label.split(' ')[0]}
          </button>
        ))}
      </aside>
      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen px-0 py-4 md:py-8">
        {renderSection()}
      </main>
    </div>
  );
};