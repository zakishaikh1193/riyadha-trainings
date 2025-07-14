import React, { useState } from 'react';
import { createCategory } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const initialState = {
  name: '',
  description: '',
};

const AddCategoryPage: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Fetch all categories to determine last_id
      const categories = await apiService.getCourseCategories();
      const lastId = categories.length > 0 ? Math.max(...categories.map((cat: any) => Number(cat.id))) : 0;
      const payload: any = {
        name: form.name,
        parent: 0,
        idnumber: String(lastId + 1),
        description: form.description,
        descriptionformat: 1,
      };
      const result = await createCategory(payload);
      setSuccess('Category created successfully!');
      setForm(initialState);
      setTimeout(() => navigate('/'), 1200); // Redirect to home or another relevant page
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Add New Category</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded shadow">
        <div>
          <label className="block font-medium mb-1">Category Name *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Category'}
        </button>
      </form>
    </div>
  );
};

export default AddCategoryPage; 