import { useNavigate } from 'react-router-dom';

export const PrincipalDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          onClick={() => navigate('/school-admin-dashboard')}
        >
          School Training Overview
        </button>
      </div>
    </div>
  );
}; 