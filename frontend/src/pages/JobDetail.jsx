import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getJob, getCandidates, uploadResumes, updateStatus, deleteCandidate, exportCSV
} from '../services/api'
import ScoreBar from '../components/ScoreBar'
import {
  ArrowLeft, Upload, Download, Trash2, CheckCircle2, XCircle,
  Clock, ChevronDown, ChevronUp, Users, Award, Star
} from 'lucide-react'

const STATUS_CONFIG = {
  shortlisted: { label: 'Shortlisted', color: 'bg-green-100 text-green-700' },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-600'   },
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
}

function ScoreBadge({ score }) {
  const color =
    score >= 75 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-600'
  return (
    <span className={`badge ${color} text-sm font-bold px-3`}>{score.toFixed(1)}</span>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [job, setJob] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [{ data: jobData }, { data: cands }] = await Promise.all([
        getJob(id),
        getCandidates(id),
      ])
      setJob(jobData)
      setCandidates(cands)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setUploadMsg('')
    try {
      const { data } = await uploadResumes(id, files)
      setUploadMsg(`✅ ${data.uploaded} resume(s) processed successfully`)
      await fetchData()
    } catch {
      setUploadMsg('❌ Upload failed. Ensure files are valid PDFs.')
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const handleStatus = async (candidateId, status) => {
    await updateStatus(candidateId, status)
    setCandidates(
      candidates.map((c) => (c.id === candidateId ? { ...c, status } : c))
    )
  }

  const handleDelete = async (candidateId) => {
    if (!confirm('Remove this candidate?')) return
    await deleteCandidate(candidateId)
    setCandidates(candidates.filter((c) => c.id !== candidateId))
  }

  const handleExport = async () => {
    const { data } = await exportCSV(id)
    const url = URL.createObjectURL(new Blob([data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates_${id}.csv`
    a.click()
  }

  const filtered = candidates.filter(
    (c) => filter === 'all' || c.status === filter
  )

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!job) return <div className="p-8 text-gray-400">Job not found</div>

  const shortlisted = candidates.filter((c) => c.status === 'shortlisted').length
  const topScore = candidates[0]?.final_score || 0

  return (
    <div className="p-8">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Job Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{job.location || 'Remote'}</span>
              <span className="text-gray-200">•</span>
              <span className="text-sm text-gray-500">{job.employment_type}</span>
              <span className="text-gray-200">•</span>
              <span className="text-sm text-gray-500">{job.min_experience_years}+ yrs</span>
            </div>
            {job.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {job.required_skills.map((s) => (
                  <span key={s} className="badge bg-primary-50 text-primary-600">{s}</span>
                ))}
              </div>
            )}
          </div>
          {/* Mini stats */}
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xl font-bold text-gray-900">{candidates.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{shortlisted}</p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary-600">{topScore.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Top Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload + Actions */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={16} />
          {uploading ? 'Processing…' : 'Upload Resumes (PDF)'}
        </button>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </button>

        {/* Filter tabs */}
        <div className="ml-auto flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'pending', 'shortlisted', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {uploadMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
          {uploadMsg}
        </div>
      )}

      {/* Candidates Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No candidates yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload PDF resumes to start screening</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, idx) => (
            <div
              key={c.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all"
            >
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                {/* Rank */}
                <div className="w-8 text-center">
                  {idx === 0 && filter === 'all' ? (
                    <Award size={18} className="text-yellow-500 mx-auto" />
                  ) : (
                    <span className="text-sm font-semibold text-gray-400">#{idx + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-semibold text-sm">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.email || 'No email'} · {c.filename}
                  </p>
                </div>

                {/* Skills */}
                <div className="hidden md:flex gap-1 flex-wrap max-w-xs">
                  {c.skills_detected.slice(0, 4).map((s) => (
                    <span key={s} className="badge bg-gray-100 text-gray-600">{s}</span>
                  ))}
                  {c.skills_detected.length > 4 && (
                    <span className="badge bg-gray-100 text-gray-400">
                      +{c.skills_detected.length - 4}
                    </span>
                  )}
                </div>

                {/* Score */}
                <ScoreBadge score={c.final_score} />

                {/* Status badge */}
                <span className={`badge ${STATUS_CONFIG[c.status].color}`}>
                  {STATUS_CONFIG[c.status].label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatus(c.id, 'shortlisted')}
                    title="Shortlist"
                    className={`p-1.5 rounded-lg transition-colors ${
                      c.status === 'shortlisted'
                        ? 'text-green-500 bg-green-50'
                        : 'text-gray-300 hover:text-green-500 hover:bg-green-50'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    onClick={() => handleStatus(c.id, 'rejected')}
                    title="Reject"
                    className={`p-1.5 rounded-lg transition-colors ${
                      c.status === 'rejected'
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <XCircle size={16} />
                  </button>
                  <button
                    onClick={() => handleStatus(c.id, 'pending')}
                    title="Reset to Pending"
                    className="p-1.5 rounded-lg text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 transition-colors"
                  >
                    <Clock size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors ml-1"
                  >
                    {expanded === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Score Breakdown */}
              {expanded === c.id && (
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score breakdown */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Score Breakdown
                      </p>
                      <ScoreBar label="Skills Match (40%)" score={c.skills_score} color="bg-primary-500" />
                      <ScoreBar label="Experience (25%)" score={c.experience_score} color="bg-purple-400" />
                      <ScoreBar label="Semantic Match (35%)" score={c.semantic_score} color="bg-teal-400" />
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-700">Final Score</span>
                          <span className="font-bold text-gray-900">{c.final_score.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Candidate Details
                      </p>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Experience</dt>
                          <dd className="font-medium">{c.experience_years} yrs</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Phone</dt>
                          <dd className="font-medium">{c.phone || '—'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">File</dt>
                          <dd className="font-medium text-xs truncate max-w-[180px]">{c.filename}</dd>
                        </div>
                      </dl>
                      {c.skills_detected.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1.5">All Detected Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {c.skills_detected.map((s) => (
                              <span key={s} className="badge bg-primary-50 text-primary-600">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
