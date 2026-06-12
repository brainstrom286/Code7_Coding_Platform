import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { clearAuth, getUser } from '../lib/auth';
import { formatDate } from '../lib/format';

function Modal({ open, title, onClose, children, footer, maxWidth = 700 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth }}>
        <h3>{title}</h3>
        {children}
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmText, confirmClass, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState({ totalStudents: 0, totalTests: 0, totalAttempts: 0, recentAttempts: [] });
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [resultTests, setResultTests] = useState([]);
  const [selectedResultTest, setSelectedResultTest] = useState('');
  const [resultData, setResultData] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    duration: 60,
    total_marks: 0,
    instructions: '',
    is_active: 1,
  });
  const [testError, setTestError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login', { replace: true });
      return;
    }

    loadDashboard();
    loadTests();
    loadStudents();
    loadResultsTestList();
    setLoading(false);
  }, [navigate, user]);

  async function loadDashboard() {
    try {
      const data = await apiFetch('/admin/dashboard');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTests() {
    try {
      const data = await apiFetch('/admin/tests');
      setTests(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStudents() {
    try {
      const data = await apiFetch('/admin/students');
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadResultsTestList() {
    try {
      const data = await apiFetch('/admin/tests');
      setResultTests(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadResults(testId) {
    if (!testId) {
      setResultData([]);
      return;
    }
    try {
      const data = await apiFetch(`/admin/tests/${testId}/results`);
      setResultData(data);
    } catch (err) {
      setResultData([]);
    }
  }

  async function viewSubmission(attemptId) {
    try {
      const data = await apiFetch(`/admin/attempts/${attemptId}`);
      setSubmission(data);
    } catch (err) {
      setSubmission({ error: err.message });
    }
  }

  function openCreateTest() {
    setEditingTestId(null);
    setTestForm({
      title: '',
      description: '',
      duration: 60,
      total_marks: 0,
      instructions: '',
      is_active: 1,
    });
    setTestError('');
    setTestModalOpen(true);
  }

  async function openEditTest(id) {
    setEditingTestId(id);
    setTestError('');
    const test = await apiFetch(`/admin/tests/${id}`);
    setTestForm({
      title: test.title || '',
      description: test.description || '',
      duration: test.duration || 60,
      total_marks: test.total_marks || 0,
      instructions: test.instructions || '',
      is_active: test.is_active ? 1 : 0,
    });
    setTestModalOpen(true);
  }

  async function saveTest() {
    if (!testForm.title || !testForm.duration) {
      setTestError('Title and duration are required');
      return;
    }

    const body = {
      ...testForm,
      duration: parseInt(testForm.duration, 10),
      total_marks: parseInt(testForm.total_marks, 10) || 0,
      is_active: parseInt(testForm.is_active, 10),
    };

    try {
      if (editingTestId) {
        await apiFetch(`/admin/tests/${editingTestId}`, { method: 'PUT', body });
      } else {
        await apiFetch('/admin/tests', { method: 'POST', body });
      }
      setTestModalOpen(false);
      await loadTests();
      await loadDashboard();
      await loadResultsTestList();
    } catch (err) {
      setTestError(err.message);
    }
  }

  async function deleteTest(id) {
    if (!window.confirm('Delete this test and all its data? This cannot be undone.')) return;
    await apiFetch(`/admin/tests/${id}`, { method: 'DELETE' });
    await loadTests();
    await loadDashboard();
    await loadResultsTestList();
  }

  async function deleteStudent(id) {
    if (!window.confirm('Delete this student and all their data?')) return;
    await apiFetch(`/admin/students/${id}`, { method: 'DELETE' });
    await loadStudents();
    await loadDashboard();
  }

  async function executeAction() {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;

    if (action === 'reset-attempts') {
      await apiFetch('/admin/reset/attempts', { method: 'DELETE' });
    } else if (action === 'reset-all') {
      await apiFetch('/admin/reset/all', { method: 'DELETE' });
      await loadStudents();
    } else if (action === 'delete-tests') {
      for (const t of tests) {
        await apiFetch(`/admin/tests/${t.id}`, { method: 'DELETE' });
      }
    }
    await loadDashboard();
    await loadTests();
    await loadResultsTestList();
    setSelectedResultTest('');
    setResultData([]);
  }

  const recentAttempts = stats.recentAttempts || [];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Code7</h2>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${section === 'overview' ? 'active' : ''}`} onClick={() => setSection('overview')}>Overview</button>
          <button className={`nav-item ${section === 'tests' ? 'active' : ''}`} onClick={() => setSection('tests')}>Manage Tests</button>
          <button className={`nav-item ${section === 'students' ? 'active' : ''}`} onClick={() => setSection('students')}>Students</button>
          <button className={`nav-item ${section === 'results' ? 'active' : ''}`} onClick={() => setSection('results')}>Results</button>
          <button className={`nav-item ${section === 'settings' ? 'active' : ''}`} onClick={() => setSection('settings')}>Settings</button>
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-ghost w-full" onClick={() => { clearAuth(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        {section === 'overview' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Dashboard Overview</h2>
                <p>Platform statistics at a glance</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={loadDashboard}>Refresh</button>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{stats.totalStudents}</div><div className="stat-label">Total Students</div></div>
              <div className="stat-card"><div className="stat-value">{stats.totalTests}</div><div className="stat-label">Total Tests</div></div>
              <div className="stat-card"><div className="stat-value">{stats.totalAttempts}</div><div className="stat-label">Total Attempts</div></div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Recent Activity</h3></div>
              <div className="table-wrap">
                {recentAttempts.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Enrollment</th>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttempts.map(a => (
                        <tr key={a.id}>
                          <td>{a.name}</td>
                          <td>{a.enrollment || '-'}</td>
                          <td>{a.test_title}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success)' }}>{a.total_marks_obtained}</td>
                          <td><span className={`badge ${a.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span></td>
                          <td className="text-sm text-muted">{formatDate(a.submitted_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted text-center" style={{ padding: 20 }}>No activity yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {section === 'tests' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Manage Tests</h2>
                <p>Create and manage coding assessments</p>
              </div>
              <button className="btn btn-primary" onClick={openCreateTest}>+ Create Test</button>
            </div>
            {tests.length ? tests.map(t => (
              <div className="card" key={t.id}>
                <div className="card-header">
                  <div>
                    <h3>{t.title}</h3>
                    <div className="text-sm text-muted">
                      {t.duration} min &middot; {t.total_marks} marks &middot;{' '}
                      <span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/test-editor?id=${t.id}`)}>Edit Questions</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditTest(t.id)}>Settings</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTest(t.id)}>Delete</button>
                  </div>
                </div>
                <p className="text-sm text-muted">{t.description || 'No description'}</p>
              </div>
            )) : (
              <div className="card text-center text-muted" style={{ padding: 40 }}>No tests yet. Create your first test!</div>
            )}
          </div>
        )}

        {section === 'students' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Students</h2>
                <p>All registered students</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={loadStudents}>Refresh</button>
            </div>
            {students.length ? (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Enrollment</th>
                        <th>Email</th>
                        <th>Attempts</th>
                        <th>Total Marks</th>
                        <th>Registered</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.enrollment || '-'}</td>
                          <td>{s.email}</td>
                          <td>{s.attempt_count}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success)' }}>{s.total_marks}</td>
                          <td className="text-sm text-muted">{formatDate(s.created_at)}</td>
                          <td><button className="btn btn-danger btn-sm" onClick={() => deleteStudent(s.id)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card text-center text-muted" style={{ padding: 40 }}>No students registered yet.</div>
            )}
          </div>
        )}

        {section === 'results' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Test Results</h2>
                <p>View student submissions</p>
              </div>
            </div>
            <div className="card">
              <div className="form-group" style={{ margin: 0 }}>
                <label>Select Test</label>
                <select value={selectedResultTest} onChange={async e => {
                  const id = e.target.value;
                  setSelectedResultTest(id);
                  await loadResults(id);
                }}>
                  <option value="">-- Select a test --</option>
                  {resultTests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>
            {resultData.length ? (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Enrollment</th>
                        <th>Email</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Tab Switches</th>
                        <th>Submitted At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.map(a => (
                        <tr key={a.id}>
                          <td>{a.name}</td>
                          <td>{a.enrollment || '-'}</td>
                          <td>{a.email}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success)' }}>{a.total_marks_obtained}</td>
                          <td>
                            <span className={`badge ${a.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span>
                            {a.auto_submitted ? <span className="badge badge-danger" style={{ marginLeft: 4 }}>Auto</span> : null}
                          </td>
                          <td>{a.tab_switches}</td>
                          <td className="text-sm text-muted">{formatDate(a.submitted_at)}</td>
                          <td><button className="btn btn-ghost btn-sm" onClick={() => viewSubmission(a.id)}>View Code</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : selectedResultTest ? (
              <div className="card text-center text-muted" style={{ padding: 30 }}>No submissions yet.</div>
            ) : null}
          </div>
        )}

        {section === 'settings' && (
          <div>
            <div className="page-header">
              <div>
                <h2>Settings</h2>
                <p>Platform management and data controls</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Danger Zone</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="danger-zone">
                  <h4>Reset All Attempts</h4>
                  <p>Deletes all test attempts and question submissions. Students and tests are kept.</p>
                  <div className="danger-actions">
                    <button className="btn btn-warning btn-sm" onClick={() => setConfirmAction('reset-attempts')}>Reset All Attempts</button>
                  </div>
                </div>
                <div className="danger-zone">
                  <h4>Delete All Student Data</h4>
                  <p>Removes all student accounts along with their attempts and submissions.</p>
                  <div className="danger-actions">
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmAction('reset-all')}>Delete All Students &amp; Data</button>
                  </div>
                </div>
                <div className="danger-zone">
                  <h4>Delete All Tests</h4>
                  <p>Removes all tests, questions, test cases, and attempt data permanently.</p>
                  <div className="danger-actions">
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmAction('delete-tests')}>Delete All Tests</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Modal
        open={testModalOpen}
        title={editingTestId ? 'Edit Test' : 'Create New Test'}
        onClose={() => setTestModalOpen(false)}
        maxWidth={600}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setTestModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTest}>{editingTestId ? 'Save Changes' : 'Create Test'}</button>
          </>
        }
      >
        <div className="form-group">
          <label>Test Title *</label>
          <input type="text" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Campus Placement Round 1" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Duration (minutes) *</label>
            <input type="number" value={testForm.duration} onChange={e => setTestForm(f => ({ ...f, duration: e.target.value }))} min="1" />
          </div>
          <div className="form-group">
            <label>Total Marks</label>
            <input type="number" value={testForm.total_marks} onChange={e => setTestForm(f => ({ ...f, total_marks: e.target.value }))} min="0" />
          </div>
        </div>
        <div className="form-group">
          <label>Instructions for Students</label>
          <textarea value={testForm.instructions} onChange={e => setTestForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Additional instructions..." />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={testForm.is_active} onChange={e => setTestForm(f => ({ ...f, is_active: e.target.value }))}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <p className={`error-msg ${testError ? '' : 'hidden'}`}>{testError}</p>
      </Modal>

      <Modal
        open={!!submission}
        title="Student Submission"
        onClose={() => setSubmission(null)}
        maxWidth={860}
        footer={<button className="btn btn-ghost" onClick={() => setSubmission(null)}>Close</button>}
      >
        {!submission ? null : submission.error ? (
          <div className="alert alert-danger">{submission.error}</div>
        ) : (
          <>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <strong>{submission.name}</strong> ({submission.enrollment || 'N/A'}) &middot; Total: <strong>{submission.total_marks_obtained} marks</strong>
              {submission.auto_submitted ? ' &middot; Auto-submitted' : ''}
              &middot; Tab switches: {submission.tab_switches}
            </div>
            {submission.submissions?.length ? submission.submissions.map(s => (
              <div className="card" style={{ marginBottom: 12 }} key={`${s.question_title}-${s.language}`}>
                <div className="card-header">
                  <div><strong>{s.question_title}</strong> <span className="text-muted text-sm">({s.language})</span></div>
                  <span className={`badge ${s.marks_obtained > 0 ? 'badge-success' : 'badge-danger'}`}>{s.marks_obtained} marks &middot; {s.test_cases_passed}/{s.total_test_cases} passed</span>
                </div>
                <pre style={{ background: '#0d1117', border: '1px solid #30363d', padding: 14, borderRadius: 6, fontFamily: 'Cascadia Code, Fira Code, Consolas, monospace', fontSize: 12, overflowX: 'auto', maxHeight: 220, overflowY: 'auto', color: '#e6edf3', lineHeight: 1.5 }}>{s.code}</pre>
              </div>
            )) : <p className="text-muted">No question submissions found.</p>}
          </>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmAction}
        title={
          confirmAction === 'reset-attempts' ? 'Reset All Attempts?' :
            confirmAction === 'reset-all' ? 'Delete All Student Data?' :
              'Delete All Tests?'
        }
        message={
          confirmAction === 'reset-attempts'
            ? 'This will delete all test attempts and submissions. Student accounts and tests are kept.'
            : confirmAction === 'reset-all'
              ? 'This will permanently delete ALL student accounts, attempts, and submissions. Tests and admin account are kept.'
              : 'This will permanently delete ALL tests, questions, test cases, and all attempt data.'
        }
        confirmText={
          confirmAction === 'reset-attempts' ? 'Yes, Reset Attempts' :
            confirmAction === 'reset-all' ? 'Yes, Delete All Students' :
              'Yes, Delete All Tests'
        }
        confirmClass={confirmAction === 'reset-attempts' ? 'btn-warning' : 'btn-danger'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeAction}
      />
    </div>
  );
}

const SUPPORTED_BP_LANGUAGES = [
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'java', label: 'Java' },
  { key: 'cpp', label: 'C++' },
  { key: 'c', label: 'C' },
];

const DEFAULT_BOILERPLATE = {
  python: `def solve():\n    # write your solution here\n    pass\n\nif __name__ == '__main__':\n    solve()`,
  javascript: `function solve() {\n    // write your solution here\n}\n\nsolve();`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // write your solution here\n    }\n}`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(NULL);\n\n    // write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // write your solution here\n    return 0;\n}`,
};

export function TestEditorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const testId = params.get('id');
  const user = getUser();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingQId, setEditingQId] = useState(null);
  const [qError, setQError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [currentBpLang, setCurrentBpLang] = useState('python');
  const [bpData, setBpData] = useState({
    python: '',
    javascript: '',
    java: '',
    cpp: '',
    c: '',
  });
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    title: '',
    marks: 10,
    problem_statement: '',
    input_format: '',
    output_format: '',
    constraints: '',
    image_url: '',
  });
  const [sampleCases, setSampleCases] = useState([{ input: '', expected_output: '', explanation: '' }]);
  const [hiddenCases, setHiddenCases] = useState([{ input: '', expected_output: '' }]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!testId) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    loadTest();
  }, [navigate, testId, user]);

  async function loadTest() {
    try {
      const data = await apiFetch(`/admin/tests/${testId}`);
      setTestData(data);
    } catch (err) {
      setQError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingQId(null);
    setQuestionModalOpen(false);
    setQError('');
    setImagePreview('');
    setCurrentBpLang('python');
    setBpData({
      python: '',
      javascript: '',
      java: '',
      cpp: '',
      c: '',
    });
    setQuestionForm({
      title: '',
      marks: 10,
      problem_statement: '',
      input_format: '',
      output_format: '',
      constraints: '',
      image_url: '',
    });
    setSampleCases([{ input: '', expected_output: '', explanation: '' }]);
    setHiddenCases([{ input: '', expected_output: '' }]);
  }

  function openAddQuestion() {
    resetForm();
    setQuestionModalOpen(true);
  }

  function openEditQuestion(question) {
    setEditingQId(question.id);
    setQuestionModalOpen(true);
    setQError('');
    setImagePreview(question.image_url || '');
    setQuestionForm({
      title: question.title || '',
      marks: question.marks || 10,
      problem_statement: question.problem_statement || '',
      input_format: question.input_format || '',
      output_format: question.output_format || '',
      constraints: question.constraints || '',
      image_url: question.image_url || '',
    });
    setSampleCases(question.sample_cases?.length ? question.sample_cases.map(tc => ({ input: tc.input, expected_output: tc.expected_output, explanation: tc.explanation || '' })) : [{ input: '', expected_output: '', explanation: '' }]);
    setHiddenCases(question.hidden_cases?.length ? question.hidden_cases.map(tc => ({ input: tc.input, expected_output: tc.expected_output })) : [{ input: '', expected_output: '' }]);
    const nextBp = { python: '', javascript: '', java: '', cpp: '', c: '' };
    (question.boilerplate || []).forEach(bp => {
      nextBp[bp.language] = bp.code;
    });
    setBpData(nextBp);
    setCurrentBpLang('python');
  }

  function previewImage(input) {
    const file = input.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target.result;
      setImagePreview(url);
      setQuestionForm(f => ({ ...f, image_url: url }));
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImagePreview('');
    setQuestionForm(f => ({ ...f, image_url: '' }));
  }

  function updateSampleCase(index, key, value) {
    setSampleCases(prev => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function updateHiddenCase(index, key, value) {
    setHiddenCases(prev => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function switchBpLang(lang) {
    setCurrentBpLang(lang);
  }

  function updateBpCode(value) {
    setBpData(prev => ({ ...prev, [currentBpLang]: value }));
  }

  function collectBoilerplate() {
    return Object.entries(bpData)
      .filter(([, value]) => value.trim())
      .map(([language, value]) => ({ language, code: value }));
  }

  async function saveQuestion() {
    if (!questionForm.title || !questionForm.problem_statement) {
      setQError('Title and problem statement are required');
      return;
    }

    const body = {
      title: questionForm.title,
      problem_statement: questionForm.problem_statement,
      input_format: questionForm.input_format,
      output_format: questionForm.output_format,
      constraints: questionForm.constraints,
      marks: parseInt(questionForm.marks, 10) || 10,
      order_index: editingQId ? undefined : (testData?.questions?.length || 0),
      sample_cases: sampleCases.filter(tc => tc.input.trim() || tc.expected_output.trim()).map(tc => ({
        input: tc.input,
        expected_output: tc.expected_output,
        explanation: tc.explanation || '',
      })),
      hidden_cases: hiddenCases.filter(tc => tc.input.trim() || tc.expected_output.trim()).map(tc => ({
        input: tc.input,
        expected_output: tc.expected_output,
      })),
      boilerplate: collectBoilerplate(),
      image_url: null,
    };

    try {
      if (editingQId) {
        await apiFetch(`/admin/questions/${editingQId}`, { method: 'PUT', body });
      } else {
        await apiFetch(`/admin/tests/${testId}/questions`, { method: 'POST', body });
      }
      await loadTest();
      resetForm();
    } catch (err) {
      setQError(err.message);
    }
  }

  async function deleteQuestion(questionId) {
    if (!window.confirm('Delete this question?')) return;
    await apiFetch(`/admin/questions/${questionId}`, { method: 'DELETE' });
    await loadTest();
  }

  if (loading) {
    return <div className="dashboard"><div className="text-center text-muted" style={{ padding: 40 }}><span className="loader" /></div></div>;
  }

  if (qError && !testData) {
    return <div className="dashboard"><div className="main-content"><div className="alert alert-danger">{qError}</div></div></div>;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Code7</h2>
          <p>Test Editor</p>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/admin/dashboard')}>Back to Dashboard</button>
        </nav>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>{testData?.title || 'Loading...'}</h2>
            <p className="text-muted">{testData ? `${testData.duration} min · ${testData.total_marks} marks · ${testData.questions.length} questions` : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openAddQuestion}>+ Add Question</button>
        </div>

        {testData?.questions?.length ? (
          <div className="question-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {testData.questions.map((q, i) => (
              <div className="question-item" key={q.id}>
                <div className="q-header">
                  <div>
                    <strong>Q{i + 1}. {q.title}</strong>
                    <span className="badge badge-info" style={{ marginLeft: 8 }}>{q.marks} marks</span>
                    {q.image_url ? <span className="badge badge-info" style={{ marginLeft: 4 }}>Image</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditQuestion(q)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(q.id)}>Delete</button>
                  </div>
                </div>
                <p className="text-sm text-muted">{q.problem_statement.substring(0, 120)}{q.problem_statement.length > 120 ? '...' : ''}</p>
                <div className="text-sm text-muted mt-2">
                  {q.sample_cases?.length || 0} sample case(s) · {q.hidden_cases?.length || 0} hidden case(s) · {q.boilerplate?.length || 0} language(s)
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-muted" style={{ padding: 40 }}>No questions yet. Add your first question!</div>
        )}
      </main>

      <Modal
        open={questionModalOpen}
        title={editingQId ? 'Edit Question' : 'Add Question'}
        onClose={resetForm}
        maxWidth={800}
        footer={
          <>
            <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            <button className="btn btn-primary" onClick={saveQuestion}>{editingQId ? 'Save Changes' : 'Add Question'}</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Question Title *</label>
            <input type="text" value={questionForm.title} onChange={e => setQuestionForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Two Sum" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Marks *</label>
            <input type="number" value={questionForm.marks} onChange={e => setQuestionForm(f => ({ ...f, marks: e.target.value }))} min="1" style={{ width: 100 }} />
          </div>
        </div>

        <div className="form-group mt-3">
          <label>Problem Statement *</label>
          <textarea rows="5" value={questionForm.problem_statement} onChange={e => setQuestionForm(f => ({ ...f, problem_statement: e.target.value }))} placeholder="Describe the problem in detail..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Input Format</label>
            <textarea rows="3" value={questionForm.input_format} onChange={e => setQuestionForm(f => ({ ...f, input_format: e.target.value }))} placeholder="Describe input format..." />
          </div>
          <div className="form-group">
            <label>Output Format</label>
            <textarea rows="3" value={questionForm.output_format} onChange={e => setQuestionForm(f => ({ ...f, output_format: e.target.value }))} placeholder="Describe output format..." />
          </div>
        </div>
        <div className="form-group">
          <label>Constraints</label>
          <textarea rows="2" value={questionForm.constraints} onChange={e => setQuestionForm(f => ({ ...f, constraints: e.target.value }))} placeholder="e.g. 1 <= n <= 10^5" />
        </div>

        <div className="form-group">
          <label>Question Image - optional, for diagrams or visual context</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <input type="file" accept="image/*" onChange={previewImage} style={{ fontSize: 13 }} />
            <button type="button" className="add-tc-btn" style={{ color: 'var(--danger)' }} onClick={clearImage}>Remove Image</button>
          </div>
          {imagePreview ? (
            <div id="qImagePreview">
              <img src={imagePreview} alt="Preview" />
            </div>
          ) : null}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Sample Test Cases</label>
            <button type="button" className="add-tc-btn" style={{ color: 'var(--primary)' }} onClick={() => setSampleCases(prev => [...prev, { input: '', expected_output: '', explanation: '' }])}>+ Add Sample Case</button>
          </div>
          {sampleCases.map((tc, i) => (
            <div className="tc-group" key={`sample-${i}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <span className="text-sm text-muted">Sample Case {i + 1}</span>
                <button type="button" className="add-tc-btn" style={{ color: 'var(--danger)' }} onClick={() => setSampleCases(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}>Remove</button>
              </div>
              <div className="tc-row">
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)' }}>Input</label>
                  <textarea
                    rows="5"
                    value={tc.input}
                    onChange={e => updateSampleCase(i, 'input', e.target.value)}
                    placeholder="Input..."
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      minHeight: '10px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)' }}>Expected Output</label>
                  <textarea
                    rows="5"
                    value={tc.expected_output}
                    onChange={e => updateSampleCase(i, 'expected_output', e.target.value)}
                    placeholder="Output..."
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      minHeight: '10px'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>Explanation (optional)</label>
                <textarea rows="2" value={tc.explanation} onChange={e => updateSampleCase(i, 'explanation', e.target.value)} placeholder="Brief explanation..." />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Hidden Test Cases (for evaluation)</label>
            <button type="button" className="add-tc-btn" style={{ color: 'var(--primary)' }} onClick={() => setHiddenCases(prev => [...prev, { input: '', expected_output: '' }])}>+ Add Hidden Case</button>
          </div>
          {hiddenCases.map((tc, i) => (
            <div className="tc-group" key={`hidden-${i}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <div>
                  <span className="text-sm text-muted">Hidden Case {i + 1}</span>
                  {questionForm.marks ? (
                    <span className="badge badge-info" style={{ marginLeft: 8, fontSize: 12 }}>
                      {Math.round((questionForm.marks / hiddenCases.length) * 100) / 100} marks
                    </span>
                  ) : null}
                </div>
                <button type="button" className="add-tc-btn" style={{ color: 'var(--danger)' }} onClick={() => setHiddenCases(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}>Remove</button>
              </div>
              <div className="tc-row">
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)' }}>Input</label>
                  <textarea
                    rows="5"
                    value={tc.input}
                    onChange={e => updateHiddenCase(i, 'input', e.target.value)}
                    placeholder="Input..."
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      minHeight: '10px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)' }}>Expected Output</label>
                  <textarea
                    rows="5"
                    value={tc.expected_output}
                    onChange={e => updateHiddenCase(i, 'expected_output', e.target.value)}
                    placeholder="Output..."
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      minHeight: '10px'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Boilerplate Code</label>
          <div className="lang-tabs">
            {SUPPORTED_BP_LANGUAGES.map(lang => (
              <div
                key={lang.key}
                className={`lang-tab ${currentBpLang === lang.key ? 'active' : ''}`}
                onClick={() => switchBpLang(lang.key)}
              >
                {lang.label}
              </div>
            ))}
          </div>
          <textarea
            className="bp-editor"
            rows="18"
            placeholder={DEFAULT_BOILERPLATE[currentBpLang]}
            value={bpData[currentBpLang]}
            onChange={e => updateBpCode(e.target.value)}
          />
          <p className="text-sm text-muted" style={{ marginTop: 8 }}>
            Fill boilerplate only for languages you want to support. Empty languages are ignored.
          </p>
        </div>

        <p className={`error-msg ${qError ? '' : 'hidden'}`}>{qError}</p>
      </Modal>
    </div>
  );
}
