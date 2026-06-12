import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { clearAuth, getUser } from '../lib/auth';
import { formatTime } from '../lib/format';

function getDefaultBoilerplate(lang) {
  const templates = {
    python: '# Write your solution here\n\n',
    javascript: '// Write your solution here\n\n',
    java: 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
    c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}',
  };
  return templates[lang] || '// Write your solution here\n';
}

function QuestionCard({ question, index, active, answered, onClick }) {
  return (
    <button className={`q-btn ${active ? 'active' : ''} ${answered ? 'answered' : ''}`} onClick={() => onClick(index)}>
      {index + 1}
    </button>
  );
}

function TestCaseCard({ item, index, showInput = false }) {
  const isError = item.actual_output && item.actual_output.startsWith('Error:');
  const isTLE = item.actual_output === 'Time Limit Exceeded';
  const headerClass = isError || isTLE ? 'error' : item.passed ? 'pass' : 'fail';
  const icon = isError || isTLE ? '!' : item.passed ? 'OK' : 'X';
  const label = isError ? 'Runtime Error' : isTLE ? 'Time Limit Exceeded' : item.passed ? 'Passed' : 'Wrong Answer';
  const actualClass = isError || isTLE ? 'actual-error' : item.passed ? 'actual-pass' : 'actual-fail';

  return (
    <div className="tc-card">
      <div className={`tc-card-header ${headerClass}`}>
        <span>{icon} Test Case {index + 1}</span>
        <span style={{ fontWeight: 400, fontSize: 12 }}>{label}</span>
      </div>
      <div className="tc-card-body">
        {showInput && (
          <div className="tc-field">
            <label>Input</label>
            <pre>{item.input}</pre>
          </div>
        )}
        <div className="tc-field">
          <label>Expected Output</label>
          <pre className="expected">{item.expected_output}</pre>
        </div>
        <div className="tc-field">
          <label>Your Output</label>
          <pre className={actualClass}>{item.actual_output || ''}</pre>
        </div>
        {item.explanation ? (
          <div className="tc-field" style={{ gridColumn: '1 / -1' }}>
            <label>Explanation</label>
            <pre style={{ color: 'var(--text2)' }}>{item.explanation}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const user = useRef(getUser()).current;
  const [section, setSection] = useState('tests');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/student/login', { replace: true });
      return;
    }

    async function load() {
      try {
        const data = await apiFetch('/student/tests');
        setTests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [navigate, user]);

  const attempted = tests.filter(t => t.attempt && t.attempt.status === 'submitted');

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Code7</h2>
          <p>{user?.name || 'Student'}</p>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${section === 'tests' ? 'active' : ''}`} onClick={() => setSection('tests')}>Available Tests</button>
          <button className={`nav-item ${section === 'history' ? 'active' : ''}`} onClick={() => setSection('history')}>My Results</button>
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-ghost w-full" onClick={() => { clearAuth(); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        {section === 'tests' ? (
          <div id="section-tests">
            <div className="page-header">
              <div>
                <h2>Available Tests</h2>
                <p>Select a test to begin your assessment</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>Refresh</button>
            </div>
            {loading ? (
              <div className="text-center text-muted" style={{ padding: 40 }}><span className="loader" /></div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : tests.length ? (
              <div className="test-grid">
                {tests.map(t => (
                  <div className="test-card" key={t.id}>
                    <h3>{t.title}</h3>
                    <p className="text-sm text-muted">{t.description || 'No description'}</p>
                    <div className="meta">
                      <span>{t.duration} min</span>
                      <span>{t.total_marks} marks</span>
                    </div>
                    {t.attempt ? (
                      t.attempt.status === 'submitted' ? (
                        <div className="alert alert-success" style={{ margin: 0 }}>Submitted - Score: {t.attempt.total_marks_obtained}/{t.total_marks}</div>
                      ) : (
                        <button className="btn btn-warning w-full" onClick={() => navigate(`/student/instructions?testId=${t.id}&attemptId=${t.attempt.id}`)}>Resume Test</button>
                      )
                    ) : (
                      <button className="btn btn-primary w-full" onClick={() => navigate(`/student/instructions?testId=${t.id}`)}>Start Test</button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center text-muted" style={{ padding: 40 }}>No tests available right now.</div>
            )}
          </div>
        ) : (
          <div id="section-history">
            <div className="page-header">
              <div>
                <h2>My Results</h2>
                <p>Your test history and scores</p>
              </div>
            </div>
            {loading ? (
              <div className="text-center text-muted" style={{ padding: 40 }}><span className="loader" /></div>
            ) : attempted.length ? (
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Test</th>
                        <th>Score</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempted.map(t => (
                        <tr key={t.id}>
                          <td>{t.title}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>{t.attempt.total_marks_obtained}</td>
                          <td>{t.total_marks}</td>
                          <td><span className="badge badge-success">Submitted</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card text-center text-muted" style={{ padding: 40 }}>No completed tests yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export function StudentInstructionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const testId = params.get('testId');
  const existingAttemptId = params.get('attemptId');
  const [attemptId, setAttemptId] = useState(existingAttemptId);
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [countingDown, setCountingDown] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!testId) {
      navigate('/student/dashboard', { replace: true });
      return;
    }

    async function init() {
      try {
        const res = await apiFetch(`/student/tests/${testId}/start`, { method: 'POST' });
        setAttemptId(res.attemptId);
        setTestData(res.test);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [navigate, testId]);

  useEffect(() => {
    if (!countingDown) return undefined;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/student/test?attemptId=${attemptId}&duration=${testData?.duration || 60}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptId, countingDown, navigate, testData?.duration]);

  function startCountdown() {
    if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
    setCountdown(5);
    setCountingDown(true);
  }

  if (loading) {
    return (
      <div className="instructions-page">
        <div className="instructions-card">
          <div className="text-center" style={{ padding: 40 }}><span className="loader" /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructions-page">
        <div className="instructions-card">
          <div className="alert alert-danger">{error}</div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/student/dashboard" className="btn btn-ghost">Back</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instructions-page">
      <div className="instructions-card">
        <h2>{testData?.title || 'Test Title'}</h2>
        <div className="test-meta">
          <span><strong>{testData?.duration}</strong> minutes</span>
          <span><strong>{testData?.total_marks}</strong> marks</span>
        </div>

        {countingDown ? (
          <div className="countdown-box">
            <p>Test starts in</p>
            <div className="count">{countdown}</div>
            <p>Get ready!</p>
          </div>
        ) : null}

        <ul className="instructions-list">
          <li>The test will be conducted in fullscreen mode. Do not exit fullscreen.</li>
          <li>Switching tabs or windows is monitored. Excessive switching will auto-submit your test.</li>
          <li>The timer starts as soon as you click "Start Test" and cannot be paused.</li>
          <li>You can navigate between questions freely during the test.</li>
          <li>Click "Run" to test your code against sample cases before submitting.</li>
          <li>Click "Submit Question" to save your answer for each question.</li>
          <li>Click "Submit Test" to finalize your submission.</li>
          <li>The test will auto-submit when time expires.</li>
          {testData?.instructions ? <li>{testData.instructions}</li> : null}
        </ul>

        <div id="startSection">
          <button className="btn btn-primary btn-lg w-full" onClick={startCountdown} disabled={countingDown}>
            {countingDown ? 'Starting...' : 'Start Test'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/student/dashboard" className="text-sm text-muted">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export function StudentTestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const attemptId = params.get('attemptId');
  const durationMin = parseInt(params.get('duration') || '60', 10);
  const user = getUser();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(durationMin * 60);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [answered, setAnswered] = useState({});
  const [savedCode, setSavedCode] = useState({});
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('output');
  const [runResults, setRunResults] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [runCooldown, setRunCooldown] = useState(0);
  const [warning, setWarning] = useState('');
  const [submitingQuestion, setSubmitingQuestion] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const draftRef = useRef({ code: '', language: 'python', questionId: null });
  const submitTestRef = useRef(null);

  const currentQuestion = questions[currentIndex] || null;

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/student/login', { replace: true });
      return;
    }
    if (!attemptId) {
      navigate('/student/dashboard', { replace: true });
      return;
    }

    async function loadTest() {
      try {
        const data = await apiFetch(`/student/attempts/${attemptId}/questions`);
        console.log("durationMin =", durationMin);
        console.log("startedAt =", data.startedAt);
        console.log('Loaded test data:', data);
        
        if (!data || !data.questions) {
          setWarning('Error: No questions data received from server');
          setLoading(false);
          return;
        }
        
        setQuestions(data.questions || []);

        setTimerSeconds(durationMin * 60);

        const initialQuestions = data.questions || [];
        if (!initialQuestions.length) {
          setWarning('This test has no questions. Please contact your instructor.');
          setLoading(false);
          return;
        }

        const savedMap = {};
        for (const q of initialQuestions) {
          if (q.saved) {
            savedMap[q.id] = { code: q.saved.code, lang: q.saved.language };
            setAnswered(prev => ({ ...prev, [q.id]: true }));
          }
        }
        setSavedCode(savedMap);

        if (initialQuestions.length && initialQuestions[0]) {
          const first = initialQuestions[0];
          const saved = savedMap[first.id];
          const nextLang = saved?.lang || first.boilerplate?.[0]?.language || 'python';
          setLanguage(nextLang);
          setCode(saved?.code || first.boilerplate?.find(b => b.language === nextLang)?.code || getDefaultBoilerplate(nextLang));
          draftRef.current = {
            code: saved?.code || first.boilerplate?.find(b => b.language === nextLang)?.code || getDefaultBoilerplate(nextLang),
            language: nextLang,
            questionId: first.id,
          };
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading test:', err);
        setWarning(err.message || 'Failed to load test');
        setLoading(false);
      }
    }

    loadTest();
  }, [attemptId]);

  useEffect(() => {
    if (!currentQuestion) return;
    const saved = savedCode[currentQuestion.id];
    const nextLang = saved?.lang || language || currentQuestion.boilerplate?.[0]?.language || 'python';
    const nextCode =
      saved?.code ||
      currentQuestion.boilerplate?.find(b => b.language === nextLang)?.code ||
      getDefaultBoilerplate(nextLang);
    setLanguage(nextLang);
    setCode(nextCode);
    draftRef.current = {
      code: nextCode,
      language: nextLang,
      questionId: currentQuestion.id,
    };
  }, [currentQuestion?.id]); // deliberate: only when question changes

  useEffect(() => {
    draftRef.current = {
      code,
      language,
      questionId: currentQuestion?.id || null,
    };
  }, [code, language, currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion) return;
    const id = setInterval(() => {
      const draft = draftRef.current;
      if (!draft.questionId || !draft.code.trim()) return;
      apiFetch(`/student/attempts/${attemptId}/autosave`, {
        method: 'POST',
        body: {
          question_id: draft.questionId,
          language: draft.language,
          code: draft.code,
        },
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [attemptId, currentQuestion?.id]);

  useEffect(() => {
    if (!attemptId) return undefined;
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      setTabSwitches(prev => {
        const next = prev + 1;
        apiFetch(`/student/attempts/${attemptId}/tab-switch`, { method: 'PATCH' }).catch(() => {});
        if (next >= 2) {
          setWarning(`Too many tab switches (${next}). Auto-submitting test...`);
          setTimeout(() => submitTestRef.current?.(true), 3000);
        } else {
          setWarning(`Tab switch detected (${next}/2). One more will auto-submit.`);
        }
        return next;
      });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [attemptId]);

useEffect(() => {
  if (loading || submittingTest) return;
  
  const timer = setInterval(() => {
    setTimerSeconds(prev => {
      if (prev <= 1) {
        submitTestRef.current?.(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [loading, submittingTest]);


  useEffect(() => {
    if (!warning) return undefined;
    const timer = setTimeout(() => setWarning(''), 5000);
    return () => clearTimeout(timer);
  }, [warning]);

  useEffect(() => {
    if (runCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setRunCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [runCooldown]);

  function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  function updateCurrentQuestion(nextIndex) {
    if (currentQuestion) {
      setSavedCode(prev => ({
        ...prev,
        [currentQuestion.id]: { code, lang: language },
      }));
    }
    setCurrentIndex(nextIndex);
    setRunResults([]);
    setEvaluation(null);
    setActiveTab('output');
    setSubmitStatus('');
  }

  function onLangChange(nextLang) {
    if (!currentQuestion) return;
    setLanguage(nextLang);
    const bp = currentQuestion.boilerplate?.find(b => b.language === nextLang);
    const nextCode = bp ? bp.code : getDefaultBoilerplate(nextLang);
    setCode(nextCode);
  }

  async function runCode() {
    if (!currentQuestion || !code.trim()) return;
    if (runCooldown > 0) {
      setWarning(`Too many requests - please wait ${runCooldown}s before running again.`);
      return;
    }
    setRunCooldown(10);
    setActiveTab('output');
    setRunResults([]);
    try {
      const res = await apiFetch('/student/run', {
        method: 'POST',
        body: { code, language, question_id: currentQuestion.id },
      });
      setRunResults(res.results || []);
      if (!res.results?.length) setWarning('No sample test cases defined for this question.');
    } catch (err) {
      setWarning(err.message);
    }
  }

  async function submitQuestion() {
    if (!currentQuestion) return;
    if (!code.trim()) {
      setWarning('Please write your solution before submitting.');
      return;
    }

    setSubmitingQuestion(true);
    setActiveTab('results');
    setEvaluation(null);
    try {
      const res = await apiFetch(`/student/attempts/${attemptId}/submit-question`, {
        method: 'POST',
        body: { question_id: currentQuestion.id, language, code },
      });
      setAnswered(prev => ({ ...prev, [currentQuestion.id]: true }));
      setSavedCode(prev => ({ ...prev, [currentQuestion.id]: { code, lang: language } }));
      setSubmitStatus(`${res.marksObtained}/${res.maxMarks} marks`);
      setEvaluation(res);
    } catch (err) {
      setSubmitStatus('Error');
      setWarning(err.message);
    } finally {
      setSubmitingQuestion(false);
    }
  }

  async function submitTest(auto = false) {
    if (submittingTest) return;
    setSubmittingTest(true);
    try {
      if (currentQuestion) {
        const currentDraft = draftRef.current;
        if (currentDraft.code.trim() && !answered[currentQuestion.id]) {
          await apiFetch(`/student/attempts/${attemptId}/submit-question`, {
            method: 'POST',
            body: {
              question_id: currentQuestion.id,
              language: currentDraft.language,
              code: currentDraft.code,
            },
          }).catch(() => {});
        }
      }

      const res = await apiFetch(`/student/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: { tab_switches: tabSwitches, auto_submitted: auto },
      });
      navigate(`/student/result?score=${res.total}&auto=${auto}`, { replace: true });
    } catch (err) {
      setWarning(`Submission failed: ${err.message}`);
      setSubmittingTest(false);
    }
  }

  submitTestRef.current = submitTest;

  if (loading) {
    return (
      <div className="test-env">
        <div className="test-header">
          <div className="test-title">Starting test...</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center text-muted">
            <span className="loader"></span>
            <p style={{ marginTop: 16 }}>Loading questions and test data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="test-env">
        <div className="test-header">
          <div className="test-title">Error</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="alert alert-danger" style={{ marginBottom: 20, maxWidth: 500 }}>
              {warning || 'No questions found for this test. This test may not have any questions added yet.'}
            </div>
            <Link to="/student/dashboard" className="btn btn-ghost">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (warning && !questions.length) {
    return (
      <div className="test-env">
        <div className="test-header">
          <div className="test-title">Error Loading Test</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>{warning}</div>
            <Link to="/student/dashboard" className="btn btn-ghost">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const marksPerCase = currentQuestion?.hidden_count > 0
    ? (currentQuestion.marks / currentQuestion.hidden_count).toFixed(1)
    : currentQuestion?.marks || 0;

  const hiddenCount = currentQuestion?.hidden_count || 0;
  const allPass = evaluation && evaluation.passed === evaluation.total;
  const nonePass = evaluation && evaluation.passed === 0;
  const summaryClass = allPass ? 'all-pass' : nonePass ? 'all-fail' : 'partial';
  const summaryIcon = allPass ? 'OK' : nonePass ? 'X' : '!';


  return (
    <>
      <div id="tabWarning" className={`tab-warning ${warning ? '' : 'hidden'}`}>{warning}</div>
      <div className="test-env" id="testEnv">
      <div className="test-header">
        <div>
          <div className="test-title">{questions[0]?.title ? 'Test In Progress' : 'Loading...'}</div>
          <div className="text-sm text-muted">Tab switches: {tabSwitches}/2</div>
        </div>
        <div className={`timer ${timerSeconds <= 300 ? 'danger' : timerSeconds <= 600 ? 'warning' : ''}`}>{formatTime(timerSeconds)}</div>
        <button className="btn btn-danger btn-sm" onClick={() => submitTest(false)}>Submit Test</button>
      </div>

      <div className="question-nav">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            active={i === currentIndex}
            answered={!!answered[q.id]}
            onClick={updateCurrentQuestion}
          />
        ))}
      </div>

      <div className="test-body">
        <div className="problem-panel">
          {currentQuestion ? (
            <>
              <div className="problem-title">Q{currentIndex + 1}. {currentQuestion.title}</div>
              <div className="problem-marks">
                {currentQuestion.marks} marks
                <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 8 }}>
                  ({hiddenCount} test case{hiddenCount !== 1 ? 's' : ''} x {marksPerCase} marks each)
                </span>
              </div>
              <div className="problem-section">
                <h4>Problem Statement</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.problem_statement}</p>
              </div>
              {currentQuestion.input_format ? (
                <div className="problem-section">
                  <h4>Input Format</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.input_format}</p>
                </div>
              ) : null}
              {currentQuestion.output_format ? (
                <div className="problem-section">
                  <h4>Output Format</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{currentQuestion.output_format}</p>
                </div>
              ) : null}
              {currentQuestion.constraints ? (
                <div className="problem-section">
                  <h4>Constraints</h4>
                  <pre>{currentQuestion.constraints}</pre>
                </div>
              ) : null}
              {currentQuestion.image_url ? (
                <div className="problem-section">
                  <h4>Reference Image</h4>
                  <img src={currentQuestion.image_url} alt="Question" style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid var(--border)', marginTop: 6 }} />
                </div>
              ) : null}
              {currentQuestion.sample_cases?.length ? (
                <div className="problem-section">
                  <h4>Sample Test Cases</h4>
                  <div className="text-sm text-muted" style={{ marginBottom: 12 }}>
                    Total question marks: {currentQuestion.marks}. Each sample case shown here helps you validate your solution.
                  </div>
                  {currentQuestion.sample_cases.map((tc, i) => {
                    const perCaseMark = currentQuestion.marks && currentQuestion.sample_cases.length
                      ? (currentQuestion.marks / currentQuestion.sample_cases.length).toFixed(1)
                      : '0';
                    return (
                      <div className="sample-case" key={i}>
                        <div className="sample-header">
                          <span>Example {i + 1}</span>
                          <span className="badge badge-info">~{perCaseMark} marks</span>
                        </div>
                        <div className="label">Input:</div>
                        <pre style={{ margin: '4px 0 8px' }}>{tc.input}</pre>
                        <div className="label">Expected Output:</div>
                        <pre style={{ margin: `4px 0 ${tc.explanation ? '8px' : '0'}` }}>{tc.expected_output}</pre>
                        {tc.explanation ? <div className="label" style={{ marginTop: 4, fontStyle: 'italic' }}>Tip: {tc.explanation}</div> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center text-muted" style={{ padding: 40 }}><span className="loader" /></div>
          )}
        </div>

        <div className="editor-panel">
          <div className="editor-toolbar">
            <select value={language} onChange={e => onLangChange(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={runCode} disabled={runCooldown > 0}>
              {runCooldown > 0 ? `Run (${runCooldown}s)` : 'Run'}
            </button>
            <button className="btn btn-success btn-sm" onClick={submitQuestion} disabled={submitingQuestion}>
              {submitingQuestion ? 'Evaluating...' : 'Submit Question'}
            </button>
            <span id="submitStatus" className="text-sm text-muted">{submitStatus}</span>
          </div>
          <textarea
            id="code-editor"
            spellCheck="false"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Write your code here..."
          />
          <div className="output-panel">
            <div className="output-tabs">
              <div className={`output-tab ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>Output</div>
              <div className={`output-tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>Test Results</div>
            </div>
            <div className={`output-content ${activeTab === 'output' ? '' : 'hidden'}`}>
              {runResults.length ? (
                runResults.map((r, i) => <TestCaseCard key={i} item={r} index={i} showInput />)
              ) : (
                <span className="text-muted text-sm">Run your code to see output here.</span>
              )}
            </div>
            <div className={`output-content ${activeTab === 'results' ? '' : 'hidden'}`}>
              {evaluation ? (
                <>
                  <div className={`eval-summary ${summaryClass}`}>
                    <span>{summaryIcon} {evaluation.passed} / {evaluation.total} hidden test cases passed</span>
                    <span className="score-pill">{evaluation.marksObtained} / {evaluation.maxMarks} marks</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                    Each test case is worth {(evaluation.maxMarks / evaluation.total).toFixed(1)} marks
                  </div>
                </>
              ) : (
                <span className="text-muted text-sm">Submit a question to see evaluation results.</span>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export function StudentResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const score = params.get('score') || 0;
  const auto = params.get('auto') === 'true';

  useEffect(() => {
    if (!getUser() || getUser().role !== 'student') {
      navigate('/student/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="result-page">
      <div className="result-card">
        <div style={{ fontSize: 48 }} id="resultIcon">{auto ? '⏰' : 'Done'}</div>
        <h2 style={{ marginTop: 12 }}>Test Submitted!</h2>
        <div className="result-score" id="scoreDisplay">{score}</div>
        <p className="text-muted" id="autoMsg">{auto ? 'Test was auto-submitted.' : ''}</p>
        <div className="result-details">
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }} id="scoreVal">{score}</div>
            <div className="text-muted text-sm">Marks Obtained</div>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/student/dashboard', { replace: true })}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
