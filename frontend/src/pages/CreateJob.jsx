import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createJob } from '../services/api'
import { Plus, X, ArrowLeft } from 'lucide-react'

export default function CreateJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_skills: [],
    min_experience_years: 0,
    location: '',
    employment_type: 'Full-time',
  })
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addSkill = (e) => {
    e.preventDefault()
    const s = skillInput.trim()
    if (s && !form.required_skills.includes(s)) {
      setForm({ ...form, required_skills: [...form.required_skills, s] })
    }
    setSkillInput('')
  }

  const removeSkill = (s) =>
    setForm({ ...form, required_skills: form.required_skills.filter((x) => x !== s) })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description) {
      setError('Title and description are required.')
      return
    }
    setLoading(true)
    try {
      const { data } = await createJob(form)
      navigate(`/jobs/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job.')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Post New Job</h1>
      <p className="text-gray-500 text-sm mb-8">Define the role and AI will screen candidates against it</p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title *</label>
            <input
              className="input"
              placeholder="e.g. Senior Full Stack Developer"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input
                className="input"
                placeholder="e.g. Remote / Bangalore"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Type</label>
              <select
                className="input"
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Minimum Experience (years)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              className="input w-32"
              value={form.min_experience_years}
              onChange={(e) =>
                setForm({ ...form, min_experience_years: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Job Description *
            </label>
            <textarea
              className="input resize-none h-36"
              placeholder="Describe the role, responsibilities, and ideal candidate…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Skills</label>
            <div className="flex gap-2 mb-3">
              <input
                className="input flex-1"
                placeholder="e.g. React, Python, Docker…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill(e)}
              />
              <button type="button" onClick={addSkill} className="btn-secondary flex items-center gap-1.5">
                <Plus size={15} />
                Add
              </button>
            </div>
            {form.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.required_skills.map((s) => (
                  <span
                    key={s}
                    className="badge bg-primary-50 text-primary-700 flex items-center gap-1.5"
                  >
                    {s}
                    <button type="button" onClick={() => removeSkill(s)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Job Posting'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
