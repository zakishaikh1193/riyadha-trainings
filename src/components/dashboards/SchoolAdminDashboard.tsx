import React, { useState, useEffect } from 'react';
import { BarChart3, Users, AlertTriangle, Activity, FileText, Award, Folder, Layers, Upload, Star, Calendar, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';

// TODO: Replace with real AuthContext
const mockUser = {
  id: '123',
  company: '1', // Example company/school ID
  role: 'school_admin',
};

const sections = [
  { id: 'participation', label: 'Participation', icon: Users },
  { id: 'heatmap', label: 'Competency Heatmap', icon: BarChart3 },
  { id: 'alerts', label: 'Overdue Alerts', icon: AlertTriangle },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'drilldown', label: 'Drill-Down', icon: Layers },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'assign', label: 'Assign Modules', icon: CheckCircle },
  { id: 'upload', label: 'Document Upload', icon: Upload },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'compliance', label: 'Compliance', icon: Star },
];

export const SchoolAdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('participation');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [school, setSchool] = useState<any>(null);
  const [schoolUsers, setSchoolUsers] = useState<any[]>([]);
  const [schoolCourses, setSchoolCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, any[]>>({});
  const [completions, setCompletions] = useState<Record<string, any>>({});
  const isRTL = false; // TODO: wire to language context

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get all companies (schools)
        const companies = await apiService.getCompanies();
        const myCompany = companies.find((c: any) => String(c.id) === String(mockUser.company));
        setSchool(myCompany);

        // 2. Get all users, filter by company
        const allUsers = await apiService.getAllUsers();
        const filteredUsers = allUsers.filter((u: any) => String(u.company) === String(myCompany.id));
        setSchoolUsers(filteredUsers);

        // 3. Get all courses, filter by company (if possible)
        const allCourses = await apiService.getAllCourses();
        // If your courses have a companyid field, filter by it. Otherwise, show all.
        const filteredCourses = allCourses.filter((c: any) => String(c.companyid) === String(myCompany.id) || !c.companyid);
        setSchoolCourses(filteredCourses);

        // 4. For each course, get enrollments and completions for school users
        const enrollmentsObj: Record<string, any[]> = {};
        const completionsObj: Record<string, any> = {};
        for (const course of filteredCourses) {
          const courseEnrollments = await apiService.getCourseEnrollments(String(course.id));
          enrollmentsObj[String(course.id)] = courseEnrollments.filter((e: any) => filteredUsers.some((u: any) => String(u.id) === String(e.userid)));
          // Optionally, fetch completion for each user in this course
          // completionsObj[course.id] = ...
        }
        setEnrollments(enrollmentsObj);
        setCompletions(completionsObj);
      } catch (err: any) {
        setError(err.message || 'Failed to load school data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sectionContent: Record<string, React.ReactNode> = {
    participation: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2"><Users className="w-6 h-6" /> Training Participation Snapshot</h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
              <span className="text-3xl font-bold text-green-600">{schoolUsers.length}</span>
              <span className="text-sm text-gray-600 mt-2">Teachers in School</span>
            </div>
            <div className="flex-1 bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600">{schoolCourses.length}</span>
              <span className="text-sm text-gray-600 mt-2">Courses</span>
            </div>
            <div className="flex-1 bg-white dark:bg-neutral-800 rounded-xl shadow p-6 flex flex-col items-center">
              <span className="text-3xl font-bold text-yellow-600">{Object.values(enrollments).reduce((sum, arr) => sum + arr.length, 0)}</span>
              <span className="text-sm text-gray-600 mt-2">Enrollments</span>
            </div>
          </div>
        )}
      </div>
    ),
    heatmap: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Competency Heatmap</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Heatmap visualization coming soon]</div>
        </div>
      </div>
    ),
    alerts: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-red-600 flex items-center gap-2"><AlertTriangle className="w-6 h-6" /> Overdue Training Alerts</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[List of users with overdue modules or low scores]</div>
        </div>
      </div>
    ),
    performance: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-700 flex items-center gap-2"><Activity className="w-6 h-6" /> Performance Visualizations</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Charts for engagement, attendance, completion]</div>
        </div>
      </div>
    ),
    drilldown: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-600 flex items-center gap-2"><Layers className="w-6 h-6" /> Drill-Down Views</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Click to inspect department/user-level detail]</div>
        </div>
      </div>
    ),
    reports: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-2"><FileText className="w-6 h-6" /> Report Generation</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <button className="px-4 py-2 rounded bg-purple-600 text-white font-medium hover:bg-purple-700 transition">Export Certification Report</button>
        </div>
      </div>
    ),
    assign: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-pink-700 flex items-center gap-2"><CheckCircle className="w-6 h-6" /> Assign Mandatory Modules</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Assign training to groups/individuals]</div>
        </div>
      </div>
    ),
    upload: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><Upload className="w-6 h-6" /> Document Upload</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Upload School Development Plans]</div>
        </div>
      </div>
    ),
    achievements: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-orange-700 flex items-center gap-2"><Award className="w-6 h-6" /> Gamified Achievement Tracking</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Staff points, badges, leaderboards]</div>
        </div>
      </div>
    ),
    sessions: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2"><Calendar className="w-6 h-6" /> Session Management (ILT/VILT)</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Create/manage sessions, assign trainers]</div>
        </div>
      </div>
    ),
    compliance: (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-700 flex items-center gap-2"><Star className="w-6 h-6" /> Compliance View</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
          <div className="text-gray-500">[Completion %, audit logs, exportable CSV]</div>
        </div>
      </div>
    ),
  };

  return (
    <div className={`flex min-h-screen w-full bg-gray-50 dark:bg-neutral-900 transition-colors${isRTL ? ' flex-row-reverse' : ''}`}>
      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col py-8 px-4` + (isRTL ? ' rtl' : '')}>
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-8">School Admin Dashboard</h1>
        <nav className="flex-1 space-y-2">
          {sections.map((item) => (
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
      </aside>
      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen px-0 py-4 md:py-8">
        {sectionContent[activeSection]}
      </main>
    </div>
  );
};

export default SchoolAdminDashboard; 