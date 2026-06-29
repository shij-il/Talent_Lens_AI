import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobs, deleteJob } from '../services/api'
import { Plus, Briefcase, Users, Trash2, ChevronRight, Search } from 'lucide-react'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data } = await getJobs()
      setJobs(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this job and all its candidates?')) return
    await deleteJob(id)
    setJobs(jobs.filter((j) => j.id !== id))
  }

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase())
  )

  const totalCandidates = jobs.reduce((a, j) => a + j.candidate_count, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your job postings and candidates</p>
        </div>
        <button onClick={() => navigate('/jobs/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Post New Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <Briefcase size={22} className="text-primary-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            <p className="text-sm text-gray-500">Active Jobs</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <Users size={22} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
            <p className="text-sm text-gray-500">Total Candidates</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <Search size={22} className="text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {jobs.length > 0 ? Math.round(totalCandidates / jobs.length) : 0}
            </p>
            <p className="text-sm text-gray-500">Avg. Candidates / Job</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9 max-w-sm"
          placeholder="Search jobs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Job List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading jobs…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No jobs found</p>
          <p className="text-sm text-gray-400 mt-1">Post a job to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between hover:border-primary-200 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Briefcase size={18} className="text-primary-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600">
                    {job.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{job.location || 'Remote'}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{job.employment_type}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {job.min_experience_years}+ yrs exp
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{job.candidate_count}</p>
                  <p className="text-xs text-gray-500">Candidates</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, job.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
