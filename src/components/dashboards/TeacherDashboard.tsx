import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Course, Session, Achievement } from '../../types';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar, 
  Clock,
  Target,
  Star,
  ChevronRight,
  Play,
  Settings,
  Bell,
  Users as UsersIcon,
  BarChart3,
  Folder,
  Group,
  ChevronLeft
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import { CourseCard } from '../CourseCard';
import { LanguageToggle } from '../ui/LanguageToggle';

export const TeacherDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rtl, setRtl] = useState(i18n.language === 'ar');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseEnrollments, setCourseEnrollments] = useState<Record<string, any[]>>({});
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<any[]>([]); // Placeholder for real notifications

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userCourses = await apiService.getUserCourses(user.id);
        setCourses(userCourses);
        // Fetch enrollments and progress for each course
        const enrollments: Record<string, any[]> = {};
        const progress: Record<string, number> = {};
        await Promise.all(userCourses.map(async (course) => {
          enrollments[String(course.id)] = await apiService.getCourseEnrollments(String(course.id));
          progress[String(course.id)] = await apiService.getUserProgress(user.id, String(course.id));
        }));
        setCourseEnrollments(enrollments);
        setCourseProgress(progress);
        // Placeholder: fetch notifications if API available
        setNotifications([]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Sidebar items
  const sidebarItems = [
    { id: 'home', icon: BarChart3, label: 'Dashboard Home' },
    { id: 'pathway', icon: BookOpen, label: 'My Learning Pathway' },
    { id: 'recommendations', icon: Star, label: 'Course Recommendations' },
    { id: 'progress', icon: TrendingUp, label: 'My Progress' },
    { id: 'alerts', icon: Bell, label: 'Alerts & Notifications' },
    { id: 'sessions', icon: Calendar, label: 'ILT/VILT Sessions' },
    { id: 'communities', icon: Group, label: 'Peer Communities' },
    { id: 'resources', icon: Folder, label: 'Resource Library' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];
  const [activeSection, setActiveSection] = useState('home');

  // Sidebar component
  const Sidebar = () => (
    <aside className={`fixed md:static top-0 left-0 z-40 h-full w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col py-8 px-4 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}` + (rtl ? ' rtl' : '')}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Educator Dashboard</h1>
        <button className="md:hidden p-2" onClick={() => setSidebarOpen(false)}><ChevronLeft /></button>
      </div>
      <nav className="flex-1 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors text-left gap-3 font-medium ${activeSection === item.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
            onClick={() => setActiveSection(item.id)}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-8 flex items-center gap-2">
        <LanguageToggle />
        <span className="text-xs text-gray-500">EN/AR</span>
      </div>
    </aside>
  );

  // Main content sections
  const renderSection = () => {
    switch (activeSection) {
      case 'home': {
        // Dashboard overview with real stats
        const completedCourses = courses.filter(c => courseProgress[c.id] === 100);
        const inProgressCourses = courses.filter(c => courseProgress[c.id] > 0 && courseProgress[c.id] < 100);
        const upcomingSessions = courses.filter(c => c.startdate && c.startdate * 1000 > Date.now());

        // Mock data for advanced cards
        const mockRecs = [
          { id: '1', title: 'Digital Teaching Tools', reason: 'AI: You excel in tech courses', match: 97, icon: '💻' },
          { id: '2', title: 'Assessment Mastery', reason: 'AI: High assessment scores', match: 93, icon: '📝' },
        ];
        const now = Date.now();
        const overdue = courses.filter(c => (c.enddate ?? 0) * 1000 < now && (courseProgress[c.id] || 0) < 100);
        const upcoming = courses.filter(c => (c.startdate ?? 0) * 1000 > now);
        const mockAlerts = [
          ...overdue.map(c => ({ id: c.id + '-overdue', title: `Overdue: ${c.fullname}`, type: 'warning', timestamp: (c.enddate ?? 0) * 1000 })),
          ...upcoming.map(c => ({ id: c.id + '-upcoming', title: `Upcoming: ${c.fullname}`, type: 'info', timestamp: (c.startdate ?? 0) * 1000 })),
          { id: 'static-1', title: 'Complete your profile for better recommendations', type: 'info', timestamp: now },
        ];
        const mockCommunities = [
          { id: '1', name: 'Math Educators', members: 120, avatar: '🧮', trending: true },
          { id: '2', name: 'Science Teachers', members: 98, avatar: '🔬', trending: false },
        ];
        const mockResources = [
          { id: '1', title: 'Guide to Digital Assessments', type: 'PDF', icon: '📄' },
          { id: '2', title: 'Classroom Management Tips', type: 'Video', icon: '🎥' },
        ];
        const mockAchievements = [
          { id: '1', title: 'Course Completion Master', icon: '🏆', desc: 'Completed 10 courses' },
          { id: '2', title: 'Assessment Expert', icon: '⭐', desc: 'Scored 95%+ in 5 assessments' },
        ];
        const xp = 4200, xpGoal = 5000;

        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{courses.length}</span>
                <span className="text-sm text-gray-600 mt-2">Total Courses</span>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">{completedCourses.length}</span>
                <span className="text-sm text-gray-600 mt-2">Completed Courses</span>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-yellow-600">{inProgressCourses.length}</span>
                <span className="text-sm text-gray-600 mt-2">In Progress</span>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
                <span className="text-2xl font-bold text-purple-600">{upcomingSessions.length}</span>
                <span className="text-sm text-gray-600 mt-2">Upcoming Sessions</span>
              </div>
            </div>
            {/* Advanced Dashboard Cards: 2 per row, horizontal layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Smart Course Recommendations */}
              <div className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border-l-4 border-yellow-400">
                <div className="flex items-center gap-2 text-xl font-bold text-yellow-700 mb-2"><Star className="w-6 h-6" /> Smart Course Recommendations</div>
                {mockRecs.map(rec => (
                  <div key={rec.id} className="flex items-center gap-3">
                    <span className="text-2xl">{rec.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{rec.title}</div>
                      <div className="text-xs text-gray-500">{rec.reason}</div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${rec.match}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 ml-2">{rec.match}%</span>
                  </div>
                ))}
                <button className="mt-2 px-4 py-1 rounded bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition self-end">View All</button>
              </div>
              {/* Alerts & Notifications */}
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border-l-4 border-blue-400">
                <div className="flex items-center gap-2 text-xl font-bold text-blue-700 mb-2"><Bell className="w-6 h-6" /> Alerts & Notifications</div>
                {mockAlerts.slice(0,2).map(alert => (
                  <div key={alert.id} className={`flex items-center gap-2 text-sm ${alert.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'}`}>{alert.type === 'warning' ? '⚠️' : '🔔'}<span>{alert.title}</span></div>
                ))}
                <button className="mt-2 px-4 py-1 rounded bg-blue-500 text-white font-medium hover:bg-blue-600 transition self-end">View All</button>
              </div>
              {/* Peer Community Access */}
              <div className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border-l-4 border-pink-400">
                <div className="flex items-center gap-2 text-xl font-bold text-pink-700 mb-2"><Group className="w-6 h-6" /> Peer Community Access</div>
                {mockCommunities.map(comm => (
                  <div key={comm.id} className="flex items-center gap-3">
                    <span className="text-2xl">{comm.avatar}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{comm.name}</div>
                      <div className="text-xs text-gray-500">{comm.members} members</div>
                    </div>
                    {comm.trending && <span className="ml-2 px-2 py-0.5 rounded bg-pink-200 text-pink-800 text-xs font-bold">Trending</span>}
                  </div>
                ))}
                <button className="mt-2 px-4 py-1 rounded bg-pink-500 text-white font-medium hover:bg-pink-600 transition self-end">View All</button>
              </div>
              {/* Shared Resources */}
              <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border-l-4 border-indigo-400">
                <div className="flex items-center gap-2 text-xl font-bold text-indigo-700 mb-2"><Folder className="w-6 h-6" /> Shared Resources</div>
                {mockResources.map(res => (
                  <div key={res.id} className="flex items-center gap-3">
                    <span className="text-2xl">{res.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{res.title}</div>
                      <div className="text-xs text-gray-500">{res.type}</div>
                    </div>
                  </div>
                ))}
                <button className="mt-2 px-4 py-1 rounded bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition self-end">View All</button>
              </div>
              {/* Achievements & XP */}
              <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border-l-4 border-orange-400">
                <div className="flex items-center gap-2 text-xl font-bold text-orange-700 mb-2"><Award className="w-6 h-6" /> Achievements & XP</div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${Math.round((xp / xpGoal) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 ml-2">{xp} / {xpGoal} XP</span>
                </div>
                {mockAchievements.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className="text-2xl">{a.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-xs text-gray-500">{a.desc}</div>
                    </div>
                  </div>
                ))}
                <button className="mt-2 px-4 py-1 rounded bg-orange-500 text-white font-medium hover:bg-orange-600 transition self-end">View All</button>
              </div>
            </div>
          </div>
        );
      }
      case 'pathway': {
        // My Learning Pathway: show real courses as pathway steps
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300 flex items-center gap-2"><BookOpen className="inline w-6 h-6" /> My Learning Pathway</h2>
            <div className="flex flex-col gap-6">
              {courses.length === 0 ? (
                <div className="text-gray-500">No courses in your pathway yet.</div>
              ) : (
                courses.map((course, idx) => (
                  <div key={course.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 border-l-4 border-blue-400 relative">
                    <div className="absolute -left-3 top-6 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold">{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1">{course.fullname}</div>
                      <div className="text-xs text-gray-500 mb-2">{course.categoryname}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${courseProgress[course.id] || 0}%` }} />
                      </div>
                      <div className="text-xs text-gray-600">Progress: {courseProgress[course.id] || 0}%</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-400">Start</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{course.startdate ? new Date(course.startdate * 1000).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case 'recommendations': {
        // Advanced mock recommendations styled as AI-powered
        const mockRecs = [
          { id: '1', title: 'Digital Teaching Tools', reason: 'AI: You excel in tech courses', match: 97, icon: '💻' },
          { id: '2', title: 'Assessment Mastery', reason: 'AI: High assessment scores', match: 93, icon: '📝' },
          { id: '3', title: 'Inclusive Education', reason: 'AI: Popular among your peers', match: 89, icon: '🌍' },
        ];
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-600 flex items-center gap-2"><Star className="inline w-6 h-6" /> Smart Course Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockRecs.map(rec => (
                <div key={rec.id} className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-2 border-l-4 border-yellow-400 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-2 text-2xl">{rec.icon}<span className="font-semibold text-lg">{rec.title}</span></div>
                  <div className="text-xs text-gray-500 mb-2">{rec.reason}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${rec.match}%` }} />
                  </div>
                  <div className="text-xs text-gray-600">AI Match: {rec.match}%</div>
                  <button className="mt-2 px-4 py-1 rounded bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition">View Course</button>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'progress': {
        // My Progress: show real course progress in a modern grid
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600 flex items-center gap-2"><TrendingUp className="inline w-6 h-6" /> My Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.length === 0 ? (
                <div className="text-gray-500">No progress data available.</div>
              ) : (
                courses.map(course => (
                  <div key={course.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-2 border-l-4 border-green-400">
                    <div className="font-semibold text-lg mb-1">{course.fullname}</div>
                    <div className="text-xs text-gray-500 mb-2">{course.categoryname}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${courseProgress[course.id] || 0}%` }} />
                    </div>
                    <div className="text-xs text-gray-600">Progress: {courseProgress[course.id] || 0}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case 'alerts': {
        // Use real data for actionable alerts (overdue/incomplete/upcoming)
        const now = Date.now();
        const overdue = courses.filter(c => (c.enddate ?? 0) * 1000 < now && (courseProgress[c.id] || 0) < 100);
        const upcoming = courses.filter(c => (c.startdate ?? 0) * 1000 > now);
        const mockAlerts = [
          ...overdue.map(c => ({ id: c.id + '-overdue', title: `Overdue: ${c.fullname}`, type: 'warning', timestamp: (c.enddate ?? 0) * 1000 })),
          ...upcoming.map(c => ({ id: c.id + '-upcoming', title: `Upcoming: ${c.fullname}`, type: 'info', timestamp: (c.startdate ?? 0) * 1000 })),
          { id: 'static-1', title: 'Complete your profile for better recommendations', type: 'info', timestamp: now },
        ];
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600 flex items-center gap-2"><Bell className="inline w-6 h-6" /> Alerts & Notifications</h2>
            <div className="space-y-4">
              {mockAlerts.length === 0 && <div className="text-gray-500">No notifications.</div>}
              {mockAlerts.map(alert => (
                <div key={alert.id} className={`rounded-lg p-4 shadow flex items-center gap-3 ${alert.type === 'warning' ? 'bg-yellow-100 border-l-4 border-yellow-500' : 'bg-blue-100 border-l-4 border-blue-500'} hover:scale-[1.01] transition-transform`}>
                  <Bell className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-gray-900">{alert.title}</div>
                    <div className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                  {alert.type === 'warning' && <button className="ml-auto px-3 py-1 rounded bg-yellow-500 text-white text-xs font-medium hover:bg-yellow-600 transition">Resolve</button>}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'sessions': {
        // ILT/VILT Sessions: show upcoming and past sessions from real courses
        const now = Date.now();
        const upcoming = courses.filter(c => c.startdate && c.startdate * 1000 > now);
        const history = courses.filter(c => c.startdate && c.startdate * 1000 <= now);
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-600 flex items-center gap-2"><Calendar className="inline w-6 h-6" /> ILT/VILT Sessions</h2>
            <div>
              <h3 className="font-semibold text-lg mb-2">Upcoming Sessions</h3>
              {upcoming.length === 0 && <div className="text-gray-500">No upcoming sessions.</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map(session => (
                  <div key={session.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-400">
                    <div className="font-semibold text-lg mb-1">{session.fullname}</div>
                    <div className="text-xs text-gray-500 mb-2">{session.type || 'Session'}</div>
                    <div className="text-xs text-gray-600 mb-1">Starts: {session.startdate ? new Date(session.startdate * 1000).toLocaleString() : 'N/A'}</div>
                    <div className="text-xs text-gray-600 mb-1">Attendees: {session.enrollmentCount ?? '-'}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${courseProgress[session.id] || 0}%` }} />
                    </div>
                    <div className="text-xs text-gray-600">Progress: {courseProgress[session.id] || 0}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 mt-6">Session History</h3>
              {history.length === 0 && <div className="text-gray-500">No past sessions.</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map(session => (
                  <div key={session.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 border-l-4 border-gray-400">
                    <div className="font-semibold text-lg mb-1">{session.fullname}</div>
                    <div className="text-xs text-gray-500 mb-2">{session.type || 'Session'}</div>
                    <div className="text-xs text-gray-600 mb-1">Date: {session.startdate ? new Date(session.startdate * 1000).toLocaleString() : 'N/A'}</div>
                    <div className="text-xs text-gray-600 mb-1">Attendees: {session.enrollmentCount ?? '-'}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${courseProgress[session.id] || 0}%` }} />
                    </div>
                    <div className="text-xs text-gray-600">Progress: {courseProgress[session.id] || 0}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case 'communities': {
        // Advanced mock communities with avatars, trending tags
        const mockCommunities = [
          { id: '1', name: 'Math Educators', members: 120, description: 'Discuss math teaching strategies.', avatar: '🧮', trending: true },
          { id: '2', name: 'Science Teachers', members: 98, description: 'Share science resources and labs.', avatar: '🔬', trending: false },
          { id: '3', name: 'Assessment Innovators', members: 75, description: 'Explore new assessment methods.', avatar: '📊', trending: true },
        ];
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-600 flex items-center gap-2"><Group className="inline w-6 h-6" /> Peer Communities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockCommunities.map(comm => (
                <div key={comm.id} className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-2 border-l-4 border-pink-400 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-2 text-2xl">{comm.avatar}<span className="font-semibold text-lg">{comm.name}</span>{comm.trending && <span className="ml-2 px-2 py-0.5 rounded bg-pink-200 text-pink-800 text-xs font-bold">Trending</span>}</div>
                  <div className="text-xs text-gray-500 mb-2">{comm.members} members</div>
                  <div className="text-xs text-gray-600 mb-2">{comm.description}</div>
                  <button className="mt-2 px-4 py-1 rounded bg-pink-500 text-white font-medium hover:bg-pink-600 transition">Join</button>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'resources': {
        // Advanced mock resources with file icons, actions
        const mockResources = [
          { id: '1', title: 'Guide to Digital Assessments', type: 'PDF', uploaded: '2024-01-10', icon: '📄' },
          { id: '2', title: 'Classroom Management Tips', type: 'Video', uploaded: '2024-01-05', icon: '🎥' },
          { id: '3', title: 'Inclusive Teaching Checklist', type: 'Checklist', uploaded: '2024-01-02', icon: '✅' },
        ];
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-indigo-600 flex items-center gap-2"><Folder className="inline w-6 h-6" /> Resource Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockResources.map(res => (
                <div key={res.id} className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900 dark:to-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-2 border-l-4 border-indigo-400 hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-2 text-2xl">{res.icon}<span className="font-semibold text-lg">{res.title}</span></div>
                  <div className="text-xs text-gray-500 mb-2">Type: {res.type}</div>
                  <div className="text-xs text-gray-600 mb-2">Uploaded: {res.uploaded}</div>
                  <button className="mt-2 px-4 py-1 rounded bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition">Download</button>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'settings': {
        // Settings: simple mock settings UI
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2"><Settings className="inline w-6 h-6" /> Settings</h2>
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Dark Mode</span>
                {/* Assume a theme toggle exists elsewhere */}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">Language</span>
                <LanguageToggle />
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">Notifications</span>
                <span className="text-xs text-gray-500">Manage your notification preferences in your profile.</span>
              </div>
            </div>
          </div>
        );
      }
      case 'achievements': {
        // Achievements & XP: gamified advanced mock data
        const mockAchievements: { id: string; title: string; icon: string; desc: string; date: string }[] = [
          { id: '1', title: 'Course Completion Master', icon: '🏆', desc: 'Completed 10 courses', date: '2024-01-10' },
          { id: '2', title: 'Assessment Expert', icon: '⭐', desc: 'Scored 95%+ in 5 assessments', date: '2024-01-08' },
          { id: '3', title: 'Learning Streak', icon: '🔥', desc: '7 days of continuous learning', date: '2024-01-12' },
        ];
        const xp = 4200, xpGoal = 5000;
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-orange-600 flex items-center gap-2"><Award className="inline w-6 h-6" /> Achievements & XP</h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="mb-4 text-lg font-semibold">XP Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div className="bg-orange-400 h-4 rounded-full transition-all" style={{ width: `${Math.round((xp / xpGoal) * 100)}%` }} />
                </div>
                <div className="text-xs text-gray-600 mb-4">{xp} / {xpGoal} XP</div>
                <div className="mb-4 text-lg font-semibold">Streak</div>
                <div className="flex items-center gap-2 text-2xl"><span role="img" aria-label="streak">🔥</span> 7 days</div>
              </div>
              <div className="flex-1">
                <div className="mb-4 text-lg font-semibold">Badges & Achievements</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockAchievements.map((a: typeof mockAchievements[0]) => (
                    <div key={a.id} className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900 dark:to-neutral-900 rounded-xl shadow-lg p-4 flex flex-col gap-2 border-l-4 border-orange-400">
                      <div className="flex items-center gap-2 text-2xl">{a.icon}<span className="font-semibold text-lg">{a.title}</span></div>
                      <div className="text-xs text-gray-500 mb-2">{a.desc}</div>
                      <div className="text-xs text-gray-400">Earned: {a.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-neutral-900 transition-colors">
      {/* Sidebar (collapsible on mobile) */}
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen px-0 py-4 md:py-8">
        <button className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow" onClick={() => setSidebarOpen(true)}><ChevronRight /></button>
        {renderSection()}
      </main>
    </div>
  );
};